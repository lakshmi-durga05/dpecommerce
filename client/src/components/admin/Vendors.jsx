import React, { useEffect, useState } from 'react';
import { erpGetVendors, erpCreateVendor, erpUpdateVendor, erpDeleteVendor, erpGetLowStock, erpCreatePO, erpGetNotifications, erpMarkNotificationRead, erpForecastShortage, erpRunForecast } from '../../api';
import './admin.css';

const Vendors = () => {
  const empty = { name: '', email: '', phone: '', gstin: '', paymentTermsDays: 30, isActive: true };
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState([]);
  const [poVendorId, setPoVendorId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [forecast, setForecast] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const res = await erpGetVendors();
      setVendors(res.data || []);
      const low = await erpGetLowStock();
      setLowStock((low.data && low.data.items) || []);
      const notif = await erpGetNotifications();
      setNotifications((notif.data && notif.data.items) || []);
      const f = await erpForecastShortage();
      setForecast((f.data && f.data.items) || []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }

  async function markRead(id) {
    try { await erpMarkNotificationRead(id); await load(); } catch(e){ console.log(e); }
  }

  async function runForecast() {
    try { await erpRunForecast(); await load(); } catch(e){ console.log(e); }
  }

  useEffect(() => { load(); }, []);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await erpUpdateVendor(editingId, form);
      } else {
        await erpCreateVendor(form);
      }
      setForm(empty); setEditingId(null);
      await load();
    } catch (e) { console.log(e); }
  }

  async function onEdit(v) { setEditingId(v._id); setForm({
    name: v.name||'', email: v.email||'', phone: v.phone||'', gstin: v.gstin||'', paymentTermsDays: v.paymentTermsDays||30, isActive: !!v.isActive
  }); }

  async function onDelete(id) { if (!window.confirm('Delete this vendor?')) return; await erpDeleteVendor(id); await load(); }

  async function createDraftPO() {
    if (!poVendorId) { alert('Select a vendor'); return; }
    if (!lowStock.length) { alert('No low stock items'); return; }
    const items = lowStock.map(i => ({ sku: i.sku || '', qty: Math.max( (i.reorderQty||0) || 10, 1 ), unitPrice: 0 }));
    try {
      await erpCreatePO({ vendorId: poVendorId, items, status: 'draft', notes: 'Auto-generated for low stock' });
      alert('Draft Purchase Order created');
    } catch(e) { console.log(e); alert('Failed to create PO'); }
  }

  return (
    <div className="admin-dashboard" style={{padding:'20px'}}>
      <h2>Vendors</h2>

      <div className="card" style={{padding:'12px', marginBottom:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{marginBottom:'8px'}}>Notifications</h3>
          <button onClick={runForecast}>Run Forecast</button>
        </div>
        {notifications.length === 0 ? <div>No notifications.</div> : (
          <div style={{display:'grid',gap:'8px'}}>
            {notifications.map(n => (
              <div key={n._id} className='admin-tr' style={{display:'grid',gridTemplateColumns:'2fr 4fr 1fr',gap:'8px',alignItems:'center'}}>
                <div className='admin-td'><strong>{n.name}</strong><div style={{fontSize:12,color:'#666'}}>{n.sku}</div></div>
                <div className='admin-td'>{n.message}</div>
                <div className='admin-td'>
                  {!n.read ? <button onClick={()=>markRead(n._id)}>Mark read</button> : <span style={{color:'#28a745'}}>Read</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{padding:'12px', marginBottom:'16px'}}>
        <h3 style={{marginBottom:'8px'}}>Low Stock Alerts</h3>
        {lowStock.length === 0 ? (
          <div>No low stock items.</div>
        ) : (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'6px',marginBottom:'10px'}}>
              {lowStock.map((i)=> (
                <div key={i._id||i.sku} className='admin-tr' style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'6px'}}>
                  <div className='admin-td'><strong>{i.sku}</strong></div>
                  <div className='admin-td'>Stock: {i.currentStock||0}</div>
                  <div className='admin-td'>Reorder Pt: {i.reorderPoint||0}</div>
                  <div className='admin-td'>Reorder Qty: {i.reorderQty||10}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <select value={poVendorId} onChange={(e)=>setPoVendorId(e.target.value)}>
                <option value=''>Select vendor</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
              <button onClick={createDraftPO}>Create Draft PO</button>
            </div>
          </>
        )}
      </div>

      {forecast && forecast.length>0 && (
        <div className="card" style={{padding:'12px', marginBottom:'16px'}}>
          <h3 style={{marginBottom:'8px'}}>Forecast Shortages</h3>
          <div style={{display:'grid',gap:'6px'}}>
            {forecast.map(i => (
              <div key={i.productId} className='admin-tr' style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'6px'}}>
                <div className='admin-td'><strong>{i.sku}</strong></div>
                <div className='admin-td'>{i.name}</div>
                <div className='admin-td'>Stock: {i.currentStock}</div>
                <div className='admin-td'>Rate/day: {i.dailyRate}</div>
                <div className='admin-td'>Days left: {i.daysLeft}</div>
                <div className='admin-td'>Lead time: {i.leadTimeDays}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="admin-form" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px',marginBottom:'20px'}}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={onChange} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={onChange} />
        <input name="gstin" placeholder="GSTIN" value={form.gstin} onChange={onChange} />
        <input name="paymentTermsDays" type="number" placeholder="Terms (days)" value={form.paymentTermsDays} onChange={onChange} />
        <label style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} /> Active
        </label>
        <button type="submit">{editingId ? 'Update Vendor' : 'Add Vendor'}</button>
        {editingId && <button type="button" onClick={()=>{setEditingId(null); setForm(empty);}}>Cancel</button>}
      </form>

      {loading ? <div>Loading...</div> : (
        <div className="admin-table">
          <div className="admin-thead">
            {['name','email','phone','gstin','paymentTermsDays','isActive','actions'].map(h=> <div className="admin-th" key={h}>{h}</div>)}
          </div>
          <div className="admin-tbody">
            {vendors.map(v => (
              <div className="admin-tr" key={v._id}>
                <div className="admin-td">{v.name}</div>
                <div className="admin-td">{v.email}</div>
                <div className="admin-td">{v.phone}</div>
                <div className="admin-td">{v.gstin}</div>
                <div className="admin-td">{v.paymentTermsDays}</div>
                <div className="admin-td">{String(v.isActive)}</div>
                <div className="admin-td">
                  <button onClick={()=>onEdit(v)} style={{marginRight:'8px'}}>Edit</button>
                  <button onClick={()=>onDelete(v._id)}>Delete</button>
                </div>
              </div>
            ))}
            {vendors.length === 0 && <div className="admin-empty">No vendors</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
