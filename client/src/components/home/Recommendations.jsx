import React, { useEffect, useState } from 'react';
import { getRecommendations, getProducts as apiGetProducts, getAuthUser as apiGetAuthUser } from '../../api';
import Loader from '../loader/Loader';
import { NavLink } from 'react-router-dom';
import './home.css';

// Swiper import
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper';

const Recommendations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Check auth; if logged in, use recommendations
        let isLoggedIn = false;
        try {
          await apiGetAuthUser();
          isLoggedIn = true;
        } catch (_) {}

        if (isLoggedIn) {
          const res = await getRecommendations();
          const arr = (res.data && res.data.items) ? res.data.items : [];
          setItems(arr);
        } else {
          const res = await apiGetProducts();
          setItems(res.data.slice(0, 12));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className='slider' style={{ height: '332px' }}>
        <Loader />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className='slider'>
      <div className='slider-heading'>
        <h5>Recommended for you</h5>
        <a href='/'>See more</a>
      </div>
      <Swiper
        slidesPerView='auto'
        spaceBetween={10}
        slidesPerGroupAuto={true}
        navigation={true}
        modules={[Navigation]}
      >
        {items.map((product) => {
          const path = 'product/' + product.id;
          return (
            <SwiperSlide className='swiper-slide' key={product.id}>
              <NavLink to={path}>
                <div className='swiper-slide-img-wrapper'>
                  <img src={product.url} className='swiper-slide-img' alt={product.name} loading='lazy' />
                </div>
                <p>{product.price}</p>
              </NavLink>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default Recommendations;
