import React, { useEffect, useState } from 'react';
import { getWishlist, removeFromWishlist } from '../../utils/wishlist';
import { addToCartApi } from '../../api';
import { useNavigate } from 'react-router-dom';
import '../profile/profile.css';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getWishlist());
  }, []);

  async function addToCart(item) {
    try {
      await addToCartApi(item.id, item);
      navigate('/cart');
    } catch (e) {
      navigate('/login');
    }
  }

  function remove(id) {
    setItems(removeFromWishlist(id));
  }

  if (items.length === 0) {
    return (
      <div className='orders-section'>
        <h4>Your wishlist is empty</h4>
      </div>
    );
  }

  return (
    <div className='orders-section'>
      <h4>Your Wishlist</h4>
      {items.map((p) => (
        <div key={p.id} className='order-bottom-item row'>
          <div className='col-4 col-sm-3 col-md-2'>
            <img src={p.url || p.img} alt={p.name} />
          </div>
          <div className='col-8 col-sm-9 col-md-10'>
            <h6>{p.name}</h6>
            <button onClick={() => addToCart(p)} style={{ marginRight: '10px' }}>Add to Cart</button>
            <button onClick={() => remove(p.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Wishlist;


