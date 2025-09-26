import React from 'react';
import './cart.css';

const SubTotal = (props) => {
  return (
    <div className='subtotal'>
      <h5>Subtotal ({props.totalQty} items): <span>₹{props.subTotal}.00</span></h5>
      { typeof props.taxRate === 'number' ? (
        <p>GST ({props.taxRate}%): <strong>₹{props.gst?.toFixed ? props.gst.toFixed(2) : props.gst}</strong></p>
      ) : null }
      { props.total ? (
        <p>Total: <strong>₹{props.total?.toFixed ? props.total.toFixed(2) : props.total}</strong></p>
      ) : null }
    </div>
  )
}

export default SubTotal;