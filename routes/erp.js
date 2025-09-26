// Libraries
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Models
const Vendor = require('../models/erp/Vendor');
const InventoryItem = require('../models/erp/InventoryItem');
const PurchaseOrder = require('../models/erp/PurchaseOrder');
const SalesOrder = require('../models/erp/SalesOrder');
const Invoice = require('../models/erp/Invoice');
const TaxConfig = require('../models/erp/TaxConfig');
const Notification = require('../models/erp/Notification');
const Invoice = require('../models/erp/Invoice');
const nodemailer = require('nodemailer');
const axios = require('axios');

// -------- Vendors --------
router.get('/vendors', authenticate, authorize('admin'), async (req, res) => {
  const items = await Vendor.find();
  res.json(items);
});

router.post('/vendors', authenticate, authorize('admin'), async (req, res) => {
  const doc = new Vendor(req.body);
  await doc.save();
  res.status(201).json(doc);
});

router.put('/vendors/:id', authenticate, authorize('admin'), async (req, res) => {
  const updated = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/vendors/:id', authenticate, authorize('admin'), async (req, res) => {
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// -------- Inventory --------
router.get('/inventory', authenticate, authorize('admin'), async (req, res) => {
  const items = await InventoryItem.find();
  res.json(items);
});

router.post('/inventory', authenticate, authorize('admin'), async (req, res) => {
  const doc = new InventoryItem(req.body);
  await doc.save();
  res.status(201).json(doc);
});

router.put('/inventory/:id', authenticate, authorize('admin'), async (req, res) => {
  const updated = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/inventory/:id', authenticate, authorize('admin'), async (req, res) => {
  await InventoryItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// -------- Purchase Orders --------
router.get('/purchase-orders', authenticate, authorize('admin'), async (req, res) => {
  const items = await PurchaseOrder.find();
  res.json(items);
});

router.post('/purchase-orders', authenticate, authorize('admin'), async (req, res) => {
  const doc = new PurchaseOrder(req.body);
  await doc.save();
  res.status(201).json(doc);
});

router.put('/purchase-orders/:id', authenticate, authorize('admin'), async (req, res) => {
  const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/purchase-orders/:id', authenticate, authorize('admin'), async (req, res) => {
  await PurchaseOrder.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// -------- Sales Orders --------
router.get('/sales-orders', authenticate, authorize('admin'), async (req, res) => {
  const items = await SalesOrder.find();
  res.json(items);
});

// -------- Invoices --------
router.get('/invoices', authenticate, authorize('admin'), async (req, res) => {
  const items = await Invoice.find();
  res.json(items);
});

router.post('/invoices', authenticate, authorize('admin'), async (req, res) => {
  const doc = new Invoice(req.body);
  await doc.save();
  res.status(201).json(doc);
});

// -------- Tax Config --------
router.get('/tax-config', authenticate, authorize('admin'), async (req, res) => {
  const cfg = await TaxConfig.findOne();
  res.json(cfg || { defaultGstRate: 18, hsnRates: [] });
});

router.post('/tax-config', authenticate, authorize('admin'), async (req, res) => {
  const existing = await TaxConfig.findOne();
  if (existing) {
    existing.defaultGstRate = req.body.defaultGstRate ?? existing.defaultGstRate;
    existing.hsnRates = req.body.hsnRates ?? existing.hsnRates;
    await existing.save();
    return res.json(existing);
  }
  const doc = new TaxConfig(req.body);
  await doc.save();
  res.status(201).json(doc);
});

// -------- Forecasting (basic) --------
router.get('/forecast/low-stock', authenticate, authorize('admin'), async (req, res) => {
  // Simple rule-based: items below reorderPoint or will be below after lead time
  const items = await InventoryItem.find();
  const low = items.filter(i => (i.currentStock || 0) <= (i.reorderPoint || 0));
  res.json({ items: low });
});

// Run forecast and return items predicted to be short before lead time
router.get('/forecast/shortage', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await runForecastAndNotify(false);
    res.json(result);
  } catch (e) { console.log(e); res.status(500).json({ error: 'forecast failed' }); }
});

// Trigger forecast and create notifications (idempotent-ish)
router.post('/forecast/run', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await runForecastAndNotify(true);
    res.json(result);
  } catch (e) { console.log(e); res.status(500).json({ error: 'forecast run failed' }); }
});

// -------- Notifications --------
router.get('/notifications', authenticate, authorize('admin'), async (req, res) => {
  const vendorId = req.query.vendorId;
  const q = vendorId ? { vendorId } : {};
  const items = await Notification.find(q).sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});

router.post('/notifications/:id/read', authenticate, authorize('admin'), async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.read = true; await n.save();
  res.json({ ok: true });
});

module.exports = router;

// Helper: compute sales rate and notify if shortage predicted within lead time window
async function runForecastAndNotify(createNotifs = false) {
  const daysWindow = 30;
  const now = new Date();
  const since = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000);

  // Aggregate sold qty per productId from Invoices in window
  const invoices = await Invoice.find({ createdAt: { $gte: since } });
  const soldMap = new Map(); // productId -> qty
  invoices.forEach(inv => {
    (inv.items || []).forEach(it => {
      const pid = Number(it.productId || 0);
      if (!pid) return;
      soldMap.set(pid, (soldMap.get(pid) || 0) + (Number(it.qty) || 0));
    });
  });

  const items = await InventoryItem.find();
  const transporter = buildMailer();
  const risks = [];
  for (const it of items) {
    const sold = soldMap.get(Number(it.productId)) || 0;
    const daily = sold / daysWindow;
    if (daily <= 0) continue; // no sales, skip
    const daysLeft = (it.currentStock || 0) / daily;
    const threshold = (it.leadTimeDays || 7) + 2; // buffer X=2 days
    if (daysLeft <= threshold) {
      const risk = { sku: it.sku, productId: it.productId, name: it.name, currentStock: it.currentStock, dailyRate: Number(daily.toFixed(2)), daysLeft: Number(daysLeft.toFixed(1)), leadTimeDays: it.leadTimeDays, vendorId: it.vendorId };
      risks.push(risk);
      if (createNotifs) {
        const msg = `Forecast shortage for ${it.name} (SKU ${it.sku}): ~${risk.daysLeft} days left at ${risk.dailyRate}/day. Lead time: ${it.leadTimeDays} days.`;
        const n = await Notification.create({ vendorId: it.vendorId || null, sku: it.sku, productId: it.productId, name: it.name, type: 'forecast_shortage', message: msg });
        // Send email if vendor has email and transport configured
        if (transporter && it.vendorId) {
          try {
            const vendor = await Vendor.findById(it.vendorId);
            if (vendor && vendor.email) {
              await transporter.sendMail({
                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                to: vendor.email,
                subject: `Forecast Shortage: ${it.name} (${it.sku})`,
                text: msg
              });
            }
          } catch (e) { console.log('mail failed', e); }
        }
        // Send WhatsApp if configured
        try {
          const vendor = it.vendorId ? await Vendor.findById(it.vendorId) : null;
          if (vendor && vendor.phone) {
            await sendWhatsapp(vendor.phone, msg);
          }
        } catch (e) { console.log('whatsapp send failed', e?.response?.data || e); }
      }
    }
  }
  return { count: risks.length, items: risks };
}

function buildMailer() {
  try {
    if (!process.env.SMTP_HOST) return null;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    return transporter;
  } catch {
    return null;
  }
}

async function sendWhatsapp(phoneNumber, text) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return;
    // phoneNumber must be in international format, e.g., 919876543210
    await axios.post(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      messaging_product: 'whatsapp',
      to: String(phoneNumber).replace(/\D/g,''),
      type: 'text',
      text: { body: text }
    }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.log('WA error', e?.response?.data || e);
  }
}
