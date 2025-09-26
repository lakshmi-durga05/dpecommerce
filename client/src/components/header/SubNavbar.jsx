import React from 'react';
import './Navbar.css';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import subnav from './subnav.jpg';
import { NavLink } from 'react-router-dom';

const SubNavbar = () => {
  return (
    <div className="sub-nav">

      <div className="left">
        <NavLink to='/' className="left-item all">
          <MenuOutlinedIcon id="hamburger" /> All
        </NavLink>
        <NavLink to='/browse/Best Sellers' className="left-item">Best Sellers</NavLink>
        <NavLink to='/browse/Mobiles' className="left-item">Mobiles</NavLink>
        <NavLink to='/browse/Customer Services' className="left-item">Customer Services</NavLink>
        <NavLink to="/browse/Today's Deals" className="left-item">Today's Deals</NavLink>
        <NavLink to='/browse/Fashion' className="left-item">Fashion</NavLink>
        <NavLink to='/browse/Electronics' className="left-item">Electronics</NavLink>
        <NavLink to='/browse/Home & Kitchen' className="left-item">Home & Kitchen</NavLink>
        <NavLink to='/browse/New Releases' className="left-item">New Releases</NavLink>
      </div>

      <div className="right">
        <a href="/" className="download">
          <img src={subnav} alt="Download App"></img>
        </a>
      </div>

    </div>
  )
}

export default SubNavbar;