// Libraries
const router = require('express').Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Razorpay = require('razorpay');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const { check, validationResult } = require('express-validator');
const axios = require('axios');
const InventoryItem = require('../models/erp/InventoryItem');
const Notification = require('../models/erp/Notification');

// Seed products (local convenience)
router.post('/seed-products', async function(req, res) {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.status(200).json({ message: 'Products already exist', count });

// Get latest invoice by orderRef for current user
router.get('/invoice/by-order/:ref', authenticate, async (req, res) => {
  try {
    const ref = req.params.ref;
    const Invoice = require('../models/erp/Invoice');
    const inv = await Invoice.findOne({ userId: req.userId, orderRef: ref }).sort({ createdAt: -1 });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ id: inv._id });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to fetch invoice by order' });
  }
});
    }
    const defaultData = require('../defaultData');
    await defaultData();
    const newCount = await Product.countDocuments();
    res.status(201).json({ message: 'Seeded products', count: newCount });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// Get products API
router.get("/products", async function(req, res) {
  try {
    // Fetching data from database
    const productsData = await Product.find();
    res.status(200).json(productsData);
  } catch (error) {
    console.log(error);
  }
})

// Update cart quantity
router.post('/cart/update-qty', authenticate, async function(req, res) {
  try {
    const { id, qty } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(400).json({ error: 'Invalid user' });
    await user.updateCartQty(id, qty);
    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// Get single order by external id (razorpay or paypal id)
router.get('/order/:extId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { extId } = req.params;
    if (!user || !Array.isArray(user.orders)) return res.status(404).json({ error: 'Order not found' });
    const match = user.orders.find(o => {
      const info = o.orderInfo || {};
      const rId = info.razorpay && info.razorpay.orderId;
      const pId = info.paypal && info.paypal.orderID;
      return rId === extId || pId === extId;
    });
    if (!match) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: match.orderInfo });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Advance order status (demo/admin)
router.post('/order/:extId/advance', async (req, res) => {
  try {
    const { extId } = req.params;
    const users = await User.find({ 'orders.orderInfo': { $exists: true } });
    const steps = ['Placed','Packed','Shipped','Out for delivery','Delivered'];
    let updated = false;
    for (const user of users) {
      for (const o of user.orders) {
        const info = o.orderInfo || {};
        const rId = info.razorpay && info.razorpay.orderId;
        const pId = info.paypal && info.paypal.orderID;
        if (rId === extId || pId === extId) {
          const idx = steps.indexOf(info.status || 'Placed');
          const next = steps[Math.min(idx + 1, steps.length - 1)];
          info.status = next;
          info.events = info.events || [];
          if (!info.events.find(e=>e.label===next)) info.events.push({ label: next, at: new Date() });
          updated = true;
          await user.save();
          return res.json({ ok: true, status: info.status });
        }
      }
    }
    if (!updated) return res.status(404).json({ error: 'Order not found' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to advance order' });
  }
});

// Log search
router.post('/search/log', authenticate, async function(req, res) {
  try {
    const { term } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(400).json({ error: 'Invalid user' });
    user.searchHistory = user.searchHistory || [];
    user.searchHistory.push({ term: (term || '').toString().slice(0, 100) });
    // keep only last 20
    if (user.searchHistory.length > 20) user.searchHistory = user.searchHistory.slice(-20);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to log search' });
  }
});

// AI-based Recommendations (content + search-history)
router.get('/recommendations', authenticate, async function(req, res) {
  try {
    const user = await User.findById(req.userId);
    const allProducts = await Product.find();

    // Build a preference profile from user's cart + last orders + search history
    const tagWeights = new Map();

    const considerProducts = [];
    // From cart
    if (user.cart && user.cart.length) {
      user.cart.forEach(ci => considerProducts.push(ci.cartItem));
    }
    // From last 3 orders
    if (user.orders && user.orders.length) {
      const lastOrders = user.orders.slice(-3);
      lastOrders.forEach(o => {
        const info = o.orderInfo || {};
        const prods = info.products || [];
        prods.forEach(p => considerProducts.push(p));
      });
    }

    // If no history, return top discounted products as fallback
    if (considerProducts.length === 0) {
      const fallback = allProducts.slice(0, 10);
      return res.json({ items: fallback });
    }

    function addWeights(points, w = 1) {
      (points || []).forEach(tag => {
        tagWeights.set(tag, (tagWeights.get(tag) || 0) + w);
      });
    }
    considerProducts.forEach(p => addWeights(p.points, 1));

    // From search history: boost tags that match terms
    const history = (user.searchHistory || []).slice(-10);
    history.forEach(h => {
      const t = (h.term || '').toLowerCase();
      allProducts.forEach(p => {
        const name = (p.name || '').toLowerCase();
        if (t && name.includes(t)) {
          addWeights(p.points, 0.5);
        }
      })
    });

    function scoreProduct(prod) {
      let s = 0;
      (prod.points || []).forEach(tag => { s += (tagWeights.get(tag) || 0); });
      return s;
    }

    // Exclude items already in cart
    const inCartIds = new Set((user.cart || []).map(ci => ci.id));
    const scored = allProducts
      .filter(p => !inCartIds.has(p.id))
      .map(p => ({ product: p, score: scoreProduct(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(x => x.product);

    res.json({ items: scored });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to compute recommendations' });
  }
});

// Get individual data
router.get("/product/:id", async function(req, res) {
  try {
    const {id} = req.params;
    const individualData = await Product.findOne({ id: id });
    res.status(200).json(individualData);
  } catch (error) {
    console.log(error);
  }
})

// Post register data
router.post('/register', [
    // Check Validation of Fields
    check('name').not().isEmpty().withMessage("Name can't be empty")
                      .trim().escape(),

    check('number').not().isEmpty().withMessage("Number can't be empty")
                      .isNumeric().withMessage("Number must only consist of digits")
                      .isLength({max: 10, min: 10}).withMessage('Number must consist of 10 digits'),

    check('password').not().isEmpty().withMessage("Password can't be empty")
                      .isLength({min: 6}).withMessage("Password must be at least 6 characters long")
                      .matches(/\d/).withMessage("Password must contain a number")
                      .isAlphanumeric().withMessage("Password can only contain alphabets and numbers"),

    check('confirmPassword').not().isEmpty().withMessage("Confirm Password can't be empty"),

    check('email').not().isEmpty().withMessage("Email can't be empty")
                      .isEmail().withMessage("Email format is invalid")
                      .normalizeEmail()

  ], async function(req, res) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        "status": false,
        "message": errors.array()
      });
    } else {
      const { name, number, email, password, confirmPassword } = req.body;
      const errors = [];

      // Check Duplicate Emails
      User.findOne({ email: email }, function (err, duplicateEmail) {
        if (err) {
          console.log(err);
        } else {
          if (duplicateEmail) {
            errors.push({msg: "Email already registered"});
            return res.status(400).json({
              "status": false,
              "message": errors
            })
          } else {
            // Check Duplicate Numbers
            User.findOne({ number: number }, async function (err, duplicateNumber) {
              if (err) {
                console.log(err);
              } else {
                if (duplicateNumber) {
                  errors.push({msg: "Number already registered"});
                  return res.status(400).json({
                    "status": false,
                    "message": errors
                  })
                } else {
                  // Check if Passwords Match
                  if (password != confirmPassword) {
                    errors.push({msg: "Passwords don't match"})
                    return res.status(400).json({
                      "status": false,
                      "message": errors
                    })
                  } else {
                    // Hashing the password
                    const saltRounds = 10;
                    const salt = await bcrypt.genSalt(saltRounds);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    const newUser = new User({
                      name: name,
                      number: number,
                      email: email,
                      password: hashedPassword
                    })
        
                    const savedUser = await newUser.save();
        
                    res.status(201).json(savedUser);
                  }
                }
              }
            })
          }
        }
      })
    }
})

// Post registered data / login 
router.post('/login', [
    // Check fields validation
    check('email').not().isEmpty().withMessage("Email can't be empty")
                    .isEmail().withMessage("Email format invalid")
                    .normalizeEmail(),
    
    check('password').not().isEmpty().withMessage("Password can't be empty")
                    .isLength({min: 6}).withMessage("Password must be at least 6 characters long")
                    .matches(/\d/).withMessage("Password must contain a number")
                    .isAlphanumeric().withMessage("Password can only contain alphabets and numbers")

  ], async function(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        "status": false,
        "message": errors.array()
      })
    } else {
      const { email, password } = req.body;
      const errors = [];

      // Check if email exists
      User.findOne({ email: email }, async function(err, found) {
        if (err) {
          console.log(err);
        } else {
          if (!found) {
            errors.push({msg: "Incorrect Email or Password"});
            return res.status(400).json({
              "status": false,
              "message": errors
            })
          } else {
            // Comparing the password
            bcrypt.compare(password, found.password, async function(err, result) {
              if(result) {

                // Token generation
                const token = await found.generateAuthToken();

                // Cookie generation
                res.cookie("LakshmiWorld", token, {
                  expires: new Date(Date.now() + 3600000), // 60 Mins
                  httpOnly: true
                });

                return res.status(201).json({
                  "status": true,
                  "message": "Logged in successfully!"
                })
              } else {
                errors.push({msg: "Incorrect Email or Password"});
                return res.status(400).json({
                  "status": false,
                  "message": errors
                })
              }
            });

          }
        }
      })
    }
  })

// Adding items to cart
router.post('/addtocart/:id', authenticate, async function(req, res) {
  try {
    const {id} = req.params; // Getting id from url parameters 
    const productInfo = await Product.findOne({ id: id });
    // console.log(productInfo);

    const userInfo = await User.findOne({ _id: req.userId }); // req.UserId from authenticate.js
    // console.log(userInfo);

    if (userInfo) {
      let flag = true;

      for (let i = 0; i < userInfo.cart.length; i++) {
        // Incrementing qty by one if product already exists in cart
        if (userInfo.cart[i].id == id) {
          const test = await User.updateOne({ 'cart.id': id }, {
            $inc: {
              'cart.$.qty': 1 
            }
          });
          console.log(test);
          flag = false;
        }
      }

      if (flag) { // flag = true means the product is not in the cart
        await userInfo.addToCart(id, productInfo); // Adding new product into cart
      }

      // const cartData = await userInfo.addToCart(id, productInfo);
      // await userInfo.save();
      // console.log(cartData);
      res.status(201).json({
        status: true,
        message: userInfo
      })
    } else {
      res.status(400).json({
        status: false,
        message: "Invalid User"
      })
    }

  } catch (error) {
    console.log(error);
  }
})

// Delete items from cart
router.delete("/delete/:id", authenticate, async function(req, res) {
  try {
    const {id} = req.params;
    const userData = await User.findOne({ _id: req.userId });

    userData.cart = userData.cart.filter(function(cartItem) {
      return cartItem.id != id;
    })

    await userData.save();

    res.status(201).json({
      status: true,
      message: "Item deleted successfully"
    })

    console.log(userData);

  } catch (error) {
    res.status(400).json({
      status: false,
      message: error
    })
  }
})

// Logout 
router.get("/logout", authenticate, async function(req, res) {
  try {

    // Deleting current token on logout from database
    req.rootUser.tokens = req.rootUser.tokens.filter(function(currentToken) {
      return currentToken.token !== req.token
    })

    // Cookie expiration
    await res.cookie("LakshmiWorld", {
      expires: Date.now()
    });

    req.rootUser.save();

    return res.status(201).json({
      "status": true,
      "message": "Logged out successfully!"
    })
  } catch (error) {
    res.status(400).json({
      "status": false,
      "message": error
    })
  }
})

// Verify if user is logged in
router.get('/getAuthUser', authenticate, async function(req, res) {
  const userData = await User.findOne({ _id: req.userId });
  res.send(userData);
});

// Razorpay 
router.get("/get-razorpay-key", function(req, res) {
  res.send({ key: process.env.RAZORPAY_KEY_ID })
})

// PayPal config (safe: only exposes Client ID)
router.get('/paypal/config', function(req, res) {
  res.send({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    mode: process.env.PAYPAL_MODE || 'sandbox'
  });
});

// PayPal: get access token
async function getPaypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const base = (process.env.PAYPAL_MODE === 'live') ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  const resp = await axios.post(`${base}/v1/oauth2/token`, params, {
    auth: { username: clientId, password: secret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return { token: resp.data.access_token, base };
}

// PayPal: create order
router.post('/paypal/create-order', authenticate, async (req, res) => {
  try {
    const { amount, currency } = req.body; // amount as string like '25842.00'
    const { token, base } = await getPaypalAccessToken();
    const resp = await axios.post(`${base}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [ { amount: { currency_code: currency || 'INR', value: amount } } ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json({ id: resp.data.id });
  } catch (e) {
    console.log(e?.response?.data || e);
    res.status(500).json({ error: 'PayPal create-order failed' });
  }
});

// PayPal: capture order
router.post('/paypal/capture-order', authenticate, async (req, res) => {
  try {
    const { orderID } = req.body;
    const { token, base } = await getPaypalAccessToken();
    const resp = await axios.post(`${base}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(resp.data);
  } catch (e) {
    console.log(e?.response?.data || e);
    res.status(500).json({ error: 'PayPal capture failed' });
  }
});

// PayPal: save order to our DB (similar to /pay-order)
router.post('/paypal/save-order', authenticate, async (req, res) => {
  try {
    const userInfo = await User.findOne({ _id: req.userId });
    const { amount, dateOrdered, orderedProducts, subTotal, taxRate, taxAmount, paypal } = req.body;
    const now = new Date();
    const newOrder = ({
      products: orderedProducts,
      date: dateOrdered,
      isPaid: true,
      amount: amount,
      subTotal: subTotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      status: 'Placed',
      events: [ { label: 'Placed', at: now } ],
      paypal: paypal
    });
    if (userInfo) {
      await userInfo.addOrder(newOrder);
      try {
        const Invoice = require('../models/erp/Invoice');
        const invoiceItems = (orderedProducts || []).map(p => ({
          productId: p.id,
          name: p.name,
          qty: p.qty,
          unitPrice: Number(p.accValue || p.value || 0),
          taxRate: taxRate || 0,
          taxAmount: 0,
          lineTotal: Number(p.qty || 1) * Number(p.accValue || p.value || 0)
        }));
        await Invoice.create({
          salesOrderId: null,
          userId: userInfo._id,
          orderRef: (paypal && paypal.orderID) || '',
          items: invoiceItems,
          subTotal: subTotal || 0,
          taxAmount: taxAmount || 0,
          total: (Number(subTotal || 0) + Number(taxAmount || 0)),
          status: 'paid'
        });
      } catch (e) {
        console.log('Invoice creation failed', e);
      }
      // Adjust inventory and notify vendors on low stock
      try {
        await adjustInventory(orderedProducts);
      } catch(e) { console.log('Inventory adjust failed', e); }
      return res.status(200).json({ message: 'Order saved' });
    }
    res.status(400).json({ error: 'Invalid user' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

router.post("/pay-order", authenticate, async function(req, res) {
  try {

    const userInfo = await User.findOne({ _id: req.userId }); // req.UserId from authenticate.js
    
    const { amount, razorpayPaymentId, razorpayOrderId, razorpaySignature, orderedProducts, dateOrdered, subTotal, taxRate, taxAmount } = req.body;
    const now = new Date();
    const newOrder = ({
      products: orderedProducts,
      date: dateOrdered,
      isPaid: true,
      amount: amount,
      subTotal: subTotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      status: 'Placed',
      events: [ { label: 'Placed', at: now } ],
      razorpay: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature
      }
    })

    // Saving order model into user model
    if (userInfo) {
      await userInfo.addOrder(newOrder);
      // Adjust inventory and notify vendors on low stock
      try {
        await adjustInventory(orderedProducts);
      } catch(e) { console.log('Inventory adjust failed', e); }
      // Create invoice document
      try {
        const Invoice = require('../models/erp/Invoice');
        const invoiceItems = (orderedProducts || []).map(p => ({
          productId: p.id,
          name: p.name,
          qty: p.qty,
          unitPrice: 0,
          taxRate: taxRate || 0,
          taxAmount: 0,
          lineTotal: 0
        }));
        await Invoice.create({
          salesOrderId: null,
          userId: userInfo._id,
          items: invoiceItems,
          subTotal: subTotal || 0,
          taxAmount: taxAmount || 0,
          total: (Number(subTotal || 0) + Number(taxAmount || 0)),
          status: 'paid'
        });
      } catch (e) {
        console.log('Invoice creation failed', e);
      }
    } else {
      res.status(400).json("Invalid user");
    }

    res.status(200).json({
      message: "Payment was successful"
    })
  } catch(error) {
    res.status(400).json(error);
  }
})

// Helper: decrement inventory by ordered qty and notify vendor if at/below reorder point
async function adjustInventory(orderedProducts) {
  if (!orderedProducts || !orderedProducts.length) return;
  for (const p of orderedProducts) {
    try {
      const item = await InventoryItem.findOne({ productId: p.id });
      if (!item) continue;
      item.currentStock = Math.max(0, (item.currentStock || 0) - (p.qty || 1));
      await item.save();
      if ((item.currentStock || 0) <= (item.reorderPoint || 0)) {
        const message = `Low stock for ${item.name} (SKU ${item.sku}). Current: ${item.currentStock}, Reorder point: ${item.reorderPoint}.`;
        await Notification.create({
          vendorId: item.vendorId || null,
          sku: item.sku,
          productId: item.productId,
          name: item.name,
          type: 'low_stock',
          message
        });
      }
    } catch (e) { console.log('adjustInventory err', e); }
  }
}

// Fetch invoice by ID
router.get('/invoice/:id', authenticate, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      res.json(invoice);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Render simple HTML for invoice download/print
router.get('/invoice/:id/print', authenticate, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      const html = `
        <html>
          <head>
            <title>Invoice ${invoice._id}</title>
          </head>
          <body>
            <h1>Invoice ${invoice._id}</h1>
            <p>Order Ref: ${invoice.orderRef}</p>
            <table>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>${item.unitPrice}</td>
                  <td>${item.lineTotal}</td>
                </tr>
              `).join('')}
            </table>
            <p>Subtotal: ${invoice.subTotal}</p>
            <p>Tax Amount: ${invoice.taxAmount}</p>
            <p>Total: ${invoice.total}</p>
          </body>
        </html>
      `;
      res.set("Content-Disposition", `attachment; filename="invoice_${invoice._id}.html"`);
      res.set("Content-Type", "text/html");
      res.send(html);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to render invoice' });
  }
});

// Secure admin promote endpoint guarded by ADMIN_SETUP_TOKEN
router.post('/admin/promote', async (req, res) => {
  const token = req.header('ADMIN_SETUP_TOKEN');
  if (!token || token !== process.env.ADMIN_SETUP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.role = 'admin';
    await user.save();

    res.json({ message: 'User promoted to admin' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

module.exports = router;