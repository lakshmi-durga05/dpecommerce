import React, { useEffect, useState } from 'react';
import { deleteFromCart as deleteFromCartApi, updateCartQty } from '../../api';
import { NavLink, useNavigate } from 'react-router-dom';
import { addToWishlist } from '../../utils/wishlist';
import './cart.css';

const CartProduct = (props) => {

    const product = props.cartItem;
    const path = '/product/' + product.id;

    const qty = props.qty;
    const [q, setQ] = useState(qty);

    useEffect(()=>{ setQ(qty); }, [qty]);

    const navigate = useNavigate();

    async function deleteFromCart() {
      try {
        const res = await deleteFromCartApi(product.id);
        if (res.data.message === "Item deleted successfully") {
          window.location.reload(false);
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message === "No token provided") {
          navigate('/login');
        } else {
          console.log(error);
        }
      }
    }

    function sanitize(n) {
      const num = Number(n);
      if (!isFinite(num) || isNaN(num)) return 1;
      return Math.max(1, Math.floor(num));
    }

    async function commitQty(newQty) {
      try {
        await updateCartQty(product.id, sanitize(newQty));
        window.location.reload(false);
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message === "No token provided") {
          navigate('/login');
        } else {
          console.log(error);
        }
      }
    }

    async function changeQty(delta) {
      const newQty = sanitize((q || qty) + delta);
      await commitQty(newQty);
    }

    function onInputChange(e) {
      setQ(sanitize(e.target.value));
    }

    async function onInputBlur() {
      if (q !== qty) {
        await commitQty(q);
      }
    }

    let amount = (product.accValue * qty).toString();  
    let lastThree = amount.substring(amount.length-3);
    let otherNumbers = amount.substring(0,amount.length-3);
    if(otherNumbers !== '')
      lastThree = ',' + lastThree;
    amount = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return (
      <div className='cart-product'>
        <div className='product-left'>
          <div className='product-img-wrapper'>
            <img className='product-img' src={ product.url } alt={product.name || 'product'} />
          </div>
          <div className='product-details'>
            <NavLink to={path}>
              <h5 className='name'>{ product.name }</h5>
            </NavLink>
            <p className='in-stock'>In stock</p>
            <p className='shipping'>Eligible for FREE Shipping</p>
            <img src='images/logo-dark.png' alt="lakshmiworld" loading="lazy" />
            <div className='product-options' id="product-options">
              <section className='quantity' style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <button className='btn btn-light' onClick={() => changeQty(-1)}>-</button>
                <label htmlFor={`qty-${product.id}`}>Qty:</label>
                <input id={`qty-${product.id}`} type='number' min='1' value={q} onChange={onInputChange} onBlur={onInputBlur} style={{width:'64px'}} />
                <button className='btn btn-light' onClick={() => changeQty(1)}>+</button>
              </section>
              <div className='delete' onClick={deleteFromCart}>
                Delete
              </div>
              <div className='save' onClick={async ()=>{ try { addToWishlist({ id: product.id, name: product.name, url: product.url, accValue: product.accValue }); await deleteFromCart(); } catch(e){ console.log(e); } }}>
                Save for later
              </div>
              <div className='more' onClick={()=> navigate(`/browse/${encodeURIComponent(product.name)}`)}>
                See more like this
              </div>
            </div>
          </div>
        </div>
        <div className='product-right'>
          <h5>₹{ amount }.00</h5>
        </div>
      </div>
    )
  
}

export default CartProduct;