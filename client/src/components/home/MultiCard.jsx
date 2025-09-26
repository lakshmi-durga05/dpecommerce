import React from 'react';
import './home.css';
import { NavLink } from 'react-router-dom';

const MultiCard = (props) => {
  return (
    <div className='cards-card'>
      <h5>{props.name}</h5>
      <div className="row">
        <div className="col-6">
          <div className='multi-img-container'>
            <NavLink to={`/browse/${encodeURIComponent(props.a)}`} >
              <img src={"images/" + props.img + "-a.jpg"} alt={props.img}></img>
            </NavLink>
          </div>
          <span>{props.a}</span>
        </div>
        <div className="col-6">
          <div className='multi-img-container'>
            <NavLink to={`/browse/${encodeURIComponent(props.b)}`} >
              <img src={"images/" + props.img + "-b.jpg"} alt={props.img}></img>
            </NavLink>
          </div>
          <span>{props.b}</span>
        </div>
        <div className="col-6">
          <div className='multi-img-container'>
            <NavLink to={`/browse/${encodeURIComponent(props.c)}`} >
              <img src={"images/" + props.img + "-c.jpg"} alt={props.img}></img>
            </NavLink>
          </div>
          <span>{props.c}</span>
        </div>
        <div className="col-6">
          <div className='multi-img-container'>
            <NavLink to={`/browse/${encodeURIComponent(props.d)}`} >
              <img src={"images/" + props.img + "-d.jpg"} alt={props.img}></img>
            </NavLink>
          </div>
          <span>{props.d}</span>
        </div>
      </div>
      <NavLink to={`/browse/${encodeURIComponent(props.name)}`} className='bottom-link'>
        {props.bottom}
      </NavLink>
    </div>
  )
}

export default MultiCard;