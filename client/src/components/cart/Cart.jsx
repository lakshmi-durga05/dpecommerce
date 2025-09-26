import React, { useEffect, useState } from 'react';
import Loader from '../loader/Loader';
import { getAuthUser as apiGetAuthUser, createOrder, getRazorpayKey, payOrder, erpGetTaxConfig, getPaypalConfig, paypalCreateOrder, paypalCaptureOrder, paypalSaveOrder, getRecommendations, updateCartQty, deleteFromCart as apiDeleteFromCart } from '../../api';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import './cart.css';
import CartProduct from './CartProduct';
import SubTotal from './SubTotal';

const Cart = () => {

  // Loader
  const [isLoading, setIsLoading] = useState(true);

  const [cartArr, setCartArr] = useState([]);
  const [userData, setUserData] = useState();
  const [taxRate, setTaxRate] = useState(0);
  const [recs, setRecs] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    apiGetAuthUser()
      .then(function(res) {
        setUserData(res.data);
        setCartArr(res.data.cart);
        setIsLoading(false);
      })
      .catch(function(error) {
        if (error.response && error.response.data && error.response.data.message == "No token provided") {
          navigate('/login');
        } else {
          console.log(error);
        }
      });

    erpGetTaxConfig().then(({ data }) => {
      if (data && typeof data.defaultGstRate === 'number') setTaxRate(data.defaultGstRate);
    }).catch(() => {});

    // Load recommendations (auth required)
    getRecommendations().then(({ data }) => {
      if (data && Array.isArray(data.items)) setRecs(data.items);
    }).catch(() => {});
  }, [])

  // Creating an array of products ordered
  const orderedProducts = [];

  for (let i = 0; i < cartArr.length; i++) {
    let product = {
      id: cartArr[i].cartItem.id,
      name: cartArr[i].cartItem.name,
      qty: cartArr[i].qty,
      img: cartArr[i].cartItem.url
    }
    orderedProducts.push(product);
  }


  let orderAmount = 0;
  for (let i = 0; i < cartArr.length; i++) {
    orderAmount += cartArr[i].qty * cartArr[i].cartItem.accValue;
  }

  const gstAmount = Math.round((orderAmount * (taxRate / 100)) * 100) / 100; // round to 2 decimals
  const grandTotal = orderAmount + gstAmount;

  async function loadPayPal() {
    try {
      // fetch config
      const { data } = await getPaypalConfig();
      const clientId = data.clientId;
      const mode = data.mode || 'sandbox';
      if (!clientId) {
        alert('PayPal is not configured');
        return;
      }
      // load SDK if not loaded
      if (!window.paypal) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // ensure container exists
      let container = document.getElementById('paypal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'paypal-container';
        document.body.appendChild(container);
      } else {
        container.innerHTML = '';
      }

      const amountStr = grandTotal.toFixed(2);

      await window.paypal.Buttons({
        createOrder: async () => {
          const res = await paypalCreateOrder(amountStr, 'USD');
          return res.data.id;
        },
        onApprove: async (data, actions) => {
          try {
            const capture = await paypalCaptureOrder(data.orderID);
            // Save order in our DB
            var today = new Date();
            var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();
            await paypalSaveOrder({
              orderedProducts: orderedProducts,
              dateOrdered: date,
              amount: Number(amountStr),
              subTotal: orderAmount,
              taxRate: taxRate,
              taxAmount: gstAmount,
              paypal: {
                orderID: data.orderID,
                captureID: (capture && capture.data && capture.data.purchase_units && capture.data.purchase_units[0] && capture.data.purchase_units[0].payments && capture.data.purchase_units[0].payments.captures && capture.data.purchase_units[0].payments.captures[0] && capture.data.purchase_units[0].payments.captures[0].id) || ''
              }
            });
            navigate('/orders');
          } catch (e) {
            console.log(e);
            alert('Failed to complete PayPal payment.');
          }
        },
        onError: (err) => {
          console.log(err);
          alert('PayPal Checkout failed to load.');
        }
      }).render('#paypal-container');

      // Scroll into view
      try { container.scrollIntoView({ behavior: 'smooth' }); } catch(_) {}
    } catch (e) {
      console.log(e);
      alert('Unable to initialize PayPal.');
    }
  }

  function loadRazorpay() {
    const script = document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";

    script.onerror = () => {
      alert("Razorpay SDK failed to load. Try again later");
    };
    script.onload = async () => {
      try {
        const res = await createOrder(Math.round(grandTotal * 100).toString());
        
        const { id, amount, currency } = res.data.order;
        const { data: { key } } = await getRazorpayKey();

        var today = new Date();
        var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();

        const options = {
          key: key,
          amount: amount.toString(),
          currency: currency,
          order_id: id,
          name: "Payment",
          handler: async function(response) {
            const result = await payOrder({
              orderedProducts: orderedProducts,
              dateOrdered: date,
              amount: amount,
              subTotal: orderAmount,
              taxRate: taxRate,
              taxAmount: gstAmount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            })
            navigate("/orders");
          },
          prefill: {
            name: userData.name,
            email: userData.email,
            contact: '9848285654'
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

  if (cartArr[cartArr.length-1]) {

    let totalQty = 0;

    for (let i = 0; i < cartArr.length; i++) {
      totalQty += cartArr[i].qty;
    }

    let amount = orderAmount.toString();  
    let lastThree = amount.substring(amount.length-3);
    let otherNumbers = amount.substring(0,amount.length-3);
    if(otherNumbers != '')
      lastThree = ',' + lastThree;
    amount = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return (
      <>
        { isLoading ? 
          <Loader /> :
          <div className='cart-section'>
          <div className='left'>
            <h3>Shopping Cart</h3>
            <p className='price-heading'>Price</p>
            {
              cartArr.map(function(cart, index) {
                return (
                  <CartProduct
                    key={index}
                    cartItem={cart.cartItem}
                    qty={cart.qty}
                    onQtyChange={async (id, newQty) => {
                      try {
                        await updateCartQty(id, newQty);
                        setCartArr(prev => prev.map(ci => ci.id === id ? { ...ci, qty: newQty } : ci));
                      } catch (e) {
                        console.log(e);
                      }
                    }}
                    onDelete={async (id) => {
                      try {
                        const res = await apiDeleteFromCart(id);
                        if (res && res.data && res.data.message === 'Item deleted successfully') {
                          setCartArr(prev => prev.filter(ci => ci.id !== id));
                        }
                      } catch (e) { console.log(e); }
                    }}
                    onSaveForLater={async (productObj) => {
                      try {
                        // add to wishlist
                        const { addToWishlist } = require('../../utils/wishlist');
                        addToWishlist(productObj);
                        // remove from cart locally and server
                        const res = await apiDeleteFromCart(productObj.id);
                        if (!res || !res.data || res.data.message !== 'Item deleted successfully') {
                          // still remove locally for UX
                          console.log('Wishlist saved; server remove failed or different response');
                        }
                        setCartArr(prev => prev.filter(ci => ci.id !== productObj.id));
                      } catch(e) { console.log(e); }
                    }}
                  />
                );
              })
            }
            <SubTotal totalQty={totalQty} subTotal={amount} taxRate={taxRate} gst={gstAmount} total={grandTotal} />

            {recs && recs.length > 0 && (
              <div className='recommendations' style={{marginTop:'20px'}}>
                <h4>You may also like</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px'}}>
                  {recs.slice(0,8).map((p)=> (
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
          <div className="right">
            <SubTotal totalQty={totalQty} subTotal={amount} taxRate={taxRate} gst={gstAmount} total={grandTotal} />
            <button onClick={loadPayPal} >Proceed to Buy</button>
            <div id='paypal-container' style={{ marginTop: '10px' }}></div>
          </div>
        </div>
        }
      </>
    )
  } else if (cartArr.length == 0) {
    return (
      <>
        {
          isLoading ?
          <Loader /> :
          <Alert variant="outlined" severity="warning" style={{ width: '80%', margin: '30px auto', fontSize: '16px', display: 'flex', justifyContent: 'center' }}>
            Cart is empty
          </Alert>
        }
      </>
    )
  }
}

export default Cart;