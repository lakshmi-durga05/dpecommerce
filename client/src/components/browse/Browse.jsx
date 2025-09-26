import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { getProducts as apiGetProducts, addToCartApi, getAuthUser as apiGetAuthUser } from '../../api';
import './browse.css';

const Browse = () => {
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [view, setView] = useState([]);
  const [sort, setSort] = useState('relevance');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGetProducts();
        const all = res.data || [];
        const termRaw = decodeURIComponent(category || '');
        const term = termRaw.toLowerCase();

        // helper to parse discount like "-46%" -> 46
        const discountValue = (s) => {
          if (!s) return 0; const m = (s+"").match(/-?(\d+)/); return m ? parseInt(m[1], 10) : 0;
        };

        // keyword maps
        const anyIncludes = (text, arr) => arr.some(k => text.includes(k));

        let result = [];
        if (term === 'best sellers') {
          result = [...all].sort((a,b)=> discountValue(b.discount) - discountValue(a.discount)).slice(0, 16);
        } else if (term === "today's deals" || term === 'todays deals' || term === 'deals') {
          result = [...all].sort((a,b)=> discountValue(b.discount) - discountValue(a.discount)).slice(0, 16);
        } else if (term === 'mobiles') {
          const keys = ['phone','mobile','galaxy','iphone','smart','airpods'];
          result = all.filter(p => anyIncludes((p.name||'').toLowerCase(), keys));
        } else if (term === 'electronics') {
          const keys = ['laptop','lenovo','samsung','boat','bluetooth','speaker','camera','earbuds','airpods','watch','monitor'];
          result = all.filter(p => anyIncludes((p.name||'').toLowerCase(), keys));
        } else if (term === 'home & kitchen' || term === 'home and kitchen') {
          const keys = ['curtain','cushion','comforter','holder','vase','table','doormat','tealight','bedsheet','decor','collection'];
          result = all.filter(p => anyIncludes((p.name||'').toLowerCase(), keys));
        } else if (term === 'new releases') {
          // just show latest by id desc
          result = [...all].sort((a,b)=> (parseInt(b.id,10)||0) - (parseInt(a.id,10)||0)).slice(0, 16);
        } else if (term === 'customer services') {
          // show all for now
          result = all.slice(0, 20);
        } else {
          // generic text search
          result = term ? all.filter(p => (p.name||'').toLowerCase().includes(term)) : all;
        }

        // if nothing found, show top discounted as fallback
        if (!result || result.length === 0) {
          result = [...all].sort((a,b)=> discountValue(b.discount) - discountValue(a.discount)).slice(0, 16);
        }

        setItems(result);
        setView(result);
      } catch (e) {
        console.log(e);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category]);

  useEffect(() => {
    // local refine + sort
    let arr = items.filter(p => (p.name||'').toLowerCase().includes(q.toLowerCase()));
    const toNum = (s) => {
      if (!s) return 0; const m = (s+"").match(/(\d[\d,]*)/); return m ? parseInt(m[1].replace(/,/g,''),10) : 0;
    };
    const discountVal = (s)=>{ if(!s) return 0; const m=(s+"").match(/-?(\d+)/); return m?parseInt(m[1],10):0; };
    if (sort==='price_asc') arr.sort((a,b)=> toNum(a.accValue||a.value||a.price) - toNum(b.accValue||b.value||b.price));
    else if (sort==='price_desc') arr.sort((a,b)=> toNum(b.accValue||b.value||b.price) - toNum(a.accValue||a.value||a.price));
    else if (sort==='discount') arr.sort((a,b)=> discountVal(b.discount) - discountVal(a.discount));
    else if (sort==='newest') arr.sort((a,b)=> (parseInt(b.id,10)||0) - (parseInt(a.id,10)||0));
    setView([...arr]);
  }, [items, sort, q]);

  async function addToCart(id) {
    try {
      // ensure user is logged in
      await apiGetAuthUser();
      await addToCartApi(id);
      alert('Added to cart');
    } catch (e) {
      // if not logged in, redirect to login
      window.location.href = '/login';
    }
  }

  if (loading) return <div className='browse container'>Loading...</div>;
  if (error) return <div className='browse container'>{error}</div>;

  return (
    <div className='browse container'>
      <div className='browse-top'>
        <h3>{decodeURIComponent(category || 'All')}</h3>
        <span>{view.length} results</span>
      </div>
      <div className='browse-filters' style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
        <label>Sort:&nbsp;
          <select value={sort} onChange={(e)=>setSort(e.target.value)}>
            <option value='relevance'>Relevance</option>
            <option value='price_asc'>Price: Low to High</option>
            <option value='price_desc'>Price: High to Low</option>
            <option value='discount'>Top Discount</option>
            <option value='newest'>Newest</option>
          </select>
        </label>
        <input placeholder='Refine results' value={q} onChange={(e)=>setQ(e.target.value)} style={{flex:'1',maxWidth:'300px',height:'32px',padding:'4px 8px'}} />
      </div>
      <div className='browse-grid'>
        {view.map(item => (
          <div className='browse-card' key={item.id}>
            <NavLink to={`/product/${item.id}`} className='img-wrap'>
              <img src={item.url} alt={item.name} loading='lazy'
                   onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='images/d.jpg'; }} />
            </NavLink>
            <div className='info'>
              <NavLink to={`/product/${item.id}`} className='name'>{item.name}</NavLink>
              <div className='price'>{item.price}</div>
            </div>
            <div className='actions'>
              <button onClick={() => addToCart(item.id)}>Add to Cart</button>
              <NavLink to={`/product/${item.id}`} className='view'>View</NavLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Browse;
