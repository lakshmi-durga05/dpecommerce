import React from 'react';
import './home.css';
import { NavLink } from 'react-router-dom';

const Card = (props) => {
  return (
    <div className='cards-card'>
      <h5>{props.name}</h5>
      <div className='img-container'>
        <NavLink to={`/browse/${encodeURIComponent(props.name)}`} >
          <img src={"images/" + props.img + ".jpg"} alt={props.img}></img>
        </NavLink>
      </div>
      <NavLink to={`/browse/${encodeURIComponent(props.name)}`} className='bottom-link'>
        {props.bottom}
      </NavLink>
    </div>
  )
}

export default Card;