import React, { useEffect, useState } from 'react';
import NameBanner from './NameBanner';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import { getAuthUser } from '../../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import OrderTop from './OrderTop';
import OrderedProduct from './OrderedProduct';
import { getInvoiceByOrderRef } from '../../api';
import Loader from '../loader/Loader';

const Orders = () => {

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState();

  const navigate = useNavigate();

  useEffect(function() {
    async function fetchUser() {
      try {
        const res = await getAuthUser();
        if (res) {
          setUserData(res.data);
          setIsLoading(false);
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message === "No token provided") {
          navigate('/login');
        } else {
          console.log(error);
        }
      }
    }

    fetchUser();
  }, []);
  
  if (userData) {

    const name = userData.name;
    const fname = name.substring(0, name.indexOf(' ')) + "'s Orders";

    const orders = userData.orders;
    orders.reverse();

    return (
      <>
        { 
          isLoading ? <Loader /> :
          <div className='profile'>
            <NameBanner name={fname} />
            <div className='order-list'>
              { orders.map((order, index) => {
                let orderItem = order.orderInfo;
                let orderedProducts = orderItem.products;

                // console.log("---NEW ORDER---");
                // console.log(orderedProducts);

                return (
                  <div className='order'>
                    <OrderTop order={ orderItem } />
                    <div className='order-bottom'>
                      { orderedProducts ? orderedProducts.map((product, index) => {
                        // console.log(product);
                          return <OrderedProduct key={index} product={product} />
                        }) : ""
                      } 
                      <div style={{marginTop:'10px', display:'flex', gap:'8px', flexWrap:'wrap'}}>
                        <a className='btn btn-outline-primary' href={`/orders/${(orderItem.razorpay && orderItem.razorpay.orderId) || (orderItem.paypal && orderItem.paypal.orderID)}`}>Track</a>
                        <button className='btn btn-secondary' onClick={async()=>{
                          try {
                            const ref = (orderItem.razorpay && orderItem.razorpay.orderId) || (orderItem.paypal && orderItem.paypal.orderID);
                            if (!ref) return alert('No order reference');
                            const { data } = await getInvoiceByOrderRef(ref);
                            if (data && data.id) {
                              // open download in same tab
                              window.location.href = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api') + `/invoice/${data.id}/print`;
                            } else {
                              alert('Invoice not found');
                            }
                          } catch (e) { console.log(e); alert('Unable to fetch invoice'); }
                        }}>Download Invoice</button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
            </div>
          </div>
        }
      </>
    )
  }
  
}

export default Orders;