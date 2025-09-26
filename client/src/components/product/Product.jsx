import React, { useEffect, useState } from 'react';
import { getProduct as apiGetProduct, getProducts as apiGetProducts, addToCartApi, getAuthUser as apiGetAuthUser, createOrder, getRazorpayKey, payOrder } from '../../api';
import './product.css';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../loader/Loader';

const Product = () => {

  // Loader
  const [isLoading, setIsLoading] = useState(true);
  
  const {id} = useParams("");

  // Fetching individual product from API
  const [product, setProduct] = useState();
  const [similar, setSimilar] = useState([]);

  useEffect(function() {
    async function fetchSingleProduct() {
      try {
        const res = await apiGetProduct(id);
        setProduct(res.data);
        try {
          const all = await apiGetProducts();
          const items = all.data || [];
          const base = res.data || {};
          const name = (base.name||'').toLowerCase();
          const words = name.split(/\W+/).filter(w=>w.length>2);
          const keys = words.slice(0,3);
          const points = (base.points||[]).map(p=> (p+'' ).toLowerCase());
          const score = (p)=>{
            let s=0; const n=(p.name||'').toLowerCase();
            keys.forEach(k=>{ if(n.includes(k)) s+=2; });
            (p.points||[]).forEach(pt=>{ if(points.includes((pt+'' ).toLowerCase())) s+=1; });
            return s;
          };
          const sims = items
            .filter(p=> p.id !== base.id)
            .map(p=> ({...p, __s: score(p)}))
            .filter(p=> p.__s>0)
            .sort((a,b)=> b.__s - a.__s)
            .slice(0,8);
          setSimilar(sims);
        } catch(e) { /* ignore */ }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
      }
    }

    fetchSingleProduct();
  }, [id])

  // To navigate to a diff page
  const navigate = useNavigate();
  // Add to cart
  async function addToCart(id) {
    try {
      const res = await addToCartApi(id, product);
      if (res && res.status === 201) {
        navigate('/cart');
      }
    } catch (error) {
      if (error.response.data.message === "No token provided") {
        navigate('/login'); // Go to login if there's no cookie
      }
    }
  }

  const [userData, setUserData] = useState();
  async function fetchUser() {
    try {
      const res = await apiGetAuthUser();
      if (res) {
        setUserData(res.data);
      }
    } catch (error) {
      if (error.response.data.message === "No token provided") {
        navigate('/login');
      } else {
        console.log(error);
      }
    }
  }

  // Buy now
  function loadRazorpay() {
    try {

      fetchUser();

      const script = document.createElement("script");
      script.src="https://checkout.razorpay.com/v1/checkout.js";

      script.onerror = () => {
        alert("Razorpay SDK failed to load. Try again later");
      };
      script.onload = async () => {
        try {

          const orderAmount = product.accValue;
          const orderedProducts = {
            id: product.id,
            name: product.name,
            qty: 1,
            img: product.url
          }

          const res = await createOrder(orderAmount + '00');
          
          const { id, amount, currency } = res.data.order;
          const { data: { key } } = await getRazorpayKey();

          var today = new Date();
          var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();

          const options = {
            key: key,
            amount: amount.toString(),
            currency: currency,
            order_id: id,
            name: product.name,
            handler: async function(response) {
              await payOrder({
                orderedProducts: orderedProducts,
                dateOrdered: date,
                amount: amount,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              })
              navigate("/orders");
            },
            prefill: {
              name: userData.name,
              email: userData.email,
              contact: '+91' + userData.number
            },
            theme: {
              color: '#1976D2'
            }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();

          

        } catch (error) {
          console.log(error);
        }
      };

      document.body.appendChild(script);
    }
    catch (error) {
      if (error.response.data.message === "No token provided") {
        navigate('/login'); // Go to login if there's no cookie
      }
    }
  }

  const today = new Date();
  today.setDate(today.getDate() + 3);
  const dayArr = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const monthArr = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const day = dayArr[today.getDay()];
  const date = today.getDate();
  const month = monthArr[today.getMonth()];
  const deliveryDate = day + ", " + date + " " + month;

  if (product) {
    return (
      <div className='product-section'>
        <div className='left'>
          <img src={ product.resUrl } alt={product.name} loading="lazy"></img>
        </div>
        <div className='middle'>
          <div className='product-details'>
            <h4>{ product.name }</h4>
            <div className='divider'></div>
            <div className='price'>
              { product.discount } 
              <span>
                <span className='sup'> ₹</span>
                { product.value }
                <span className='sup'>00</span>
              </span>
            </div>
            <div className='mrp'>M.R.P.: <strike>{ product.mrp }</strike></div>
            <p className='taxes'>Inclusive of all taxes</p>
          </div>
          <div className='about-product'>
            <h6>About this item</h6>
            <ul>
              { product.points.map(function(point, index) {
                return (
                  <li key={index}>{point}</li>
                )
              }) }
            </ul>
          </div>
        </div>
        <div className='right'>
          <h3><span><span className='sup'>₹</span>{ product.value }<span className='sup'>00</span></span></h3>
          <p><span>FREE delivery:</span> {deliveryDate}</p>
          <button id="addtocart-btn" onClick={ () => addToCart(product.id) }>Add to Cart</button>
          <button onClick={() => {
            try {
              const { addToWishlist } = require('../../utils/wishlist');
              addToWishlist(product);
              alert('Added to wishlist');
            } catch (e) {}
          }}>Add to Wishlist</button>
          <button onClick={loadRazorpay} >Buy Now</button>
        </div>
        {similar && similar.length>0 && (
          <div style={{gridColumn:'1 / -1', marginTop:'24px', width:'100%'}}>
            <h4 style={{margin:'12px 0'}}>Similar items</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px'}}>
              {similar.map((p)=> (
                <div key={p.id} className='rec-card' style={{border:'1px solid #eee',borderRadius:6,padding:10}}>
                  <a href={`/product/${p.id}`} className='img-wrap' style={{display:'block',textAlign:'center'}}>
                    <img src={p.url} alt={p.name} loading='lazy' style={{maxWidth:'100%',maxHeight:140,objectFit:'contain'}} onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='images/d.jpg'; }} />
                  </a>
                  <a href={`/product/${p.id}`} className='name' style={{display:'block',marginTop:8}}>{p.name}</a>
                  {p.price && <div className='price' style={{color:'#111',fontWeight:600}}>{p.price}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div>
        { isLoading ? <Loader /> : "" }
      </div>
    )
  }
}

export default Product;