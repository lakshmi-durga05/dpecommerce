import React, { useEffect, useState, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { getOrderById, advanceOrder } from '../../api';
import './profile.css';

const Step = ({ label, active, time }) => (
  <div style={{display:'flex',alignItems:'center',gap:'8px',opacity: active?1:0.4}}>
    <div style={{width:12,height:12,borderRadius:6,background: active?'#28a745':'#ccc'}}></div>
    <div>
      <div style={{fontWeight:600}}>{label}</div>
      {time && <div style={{fontSize:12,color:'#666'}}>{new Date(time).toLocaleString()}</div>}
    </div>
  </div>
);

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await getOrderById(id);
      setOrder(data.order);
    } catch(e) { console.log(e); }
    setLoading(false);
  }, [id]);

  useEffect(()=>{ load(); }, [load]);

  if (loading) return <div style={{padding:'20px'}}>Loading...</div>;
  if (!order) return <div style={{padding:'20px'}}>Order not found.</div>;

  const steps = ['Placed','Packed','Shipped','Out for delivery','Delivered'];
  const activeIndex = Math.max(0, steps.indexOf(order.status||'Placed'));
  const findTime = (label) => (order.events||[]).find(e=>e.label===label)?.at;

  return (
    <div className='profile' style={{padding:'20px'}}>
      <h3 style={{marginBottom:'10px'}}>Order Details</h3>
      <div style={{marginBottom:'12px'}}>Order ID: <strong>{order.razorpay?.orderId || order.paypal?.orderID}</strong></div>
      <div style={{marginBottom:'20px'}}>Status: <strong>{order.status}</strong></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'20px'}}>
        {steps.map((s, i)=> (
          <div key={s} className='card' style={{padding:'12px'}}>
            <Step label={s} active={i<=activeIndex} time={findTime(s)} />
          </div>
        ))}
      </div>

      <h4>Items</h4>
      <div className='order-bottom'>
        {(order.products||[]).map((p, idx)=> (
          <div key={idx} className='ordered-product'>
            <img src={p.img} alt={p.name} />
            <div className='ordered-details'>
              <NavLink to={`/product/${p.id}`}>{p.name}</NavLink>
              <div>Qty: {p.qty}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:'20px',display:'flex',gap:'10px'}}>
        <NavLink to="/orders" className='btn btn-secondary'>Back to Orders</NavLink>
        <button className='btn btn-outline-primary' onClick={async()=>{ await advanceOrder(id); await load(); }}>Advance (demo)</button>
      </div>
    </div>
  );
};

export default OrderDetails;
