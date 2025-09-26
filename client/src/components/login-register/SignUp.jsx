import React, { useState } from 'react';
import { api } from '../../api';

import CountryCode from './CountryCode';
import './login-register.css';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { NavLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';

const SignUp = () => {

  const [signUpInfo, setSignUpInfo] = useState({
    name: "",
    number: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  function formUpdate(e) {
    const {name, value} = e.target;

    setSignUpInfo(function() {
      return {
        ...signUpInfo,
        [name]: value
      }
    })
  }

  const [errorMessage, setErrorMessage] = useState([]);
  const navigate = useNavigate();

  async function sendData(e) {
    e.preventDefault();
    let { name, number, email, password, confirmPassword } = signUpInfo;

    // sanitize inputs
    name = (name || '').trim();
    number = (number || '').toString().replace(/\D/g, ''); // digits only
    email = (email || '').trim().toLowerCase();

    if (password !== confirmPassword) {
      document.querySelector(".success-alert").style.display = "none";
      document.querySelector(".error-alert").style.display = "flex";
      setErrorMessage(["Passwords don't match"]);
      return;
    }

    try {
      await api.post('/register', { name, number, email, password, confirmPassword });

      setSignUpInfo(function() {
        return {
          ...signUpInfo,
          name: "", number: "", email: "", password: "", confirmPassword: ""
        }
      });

      document.querySelector(".error-alert").style.display = "none";
      document.querySelector(".success-alert").style.display = "flex";

      setTimeout(function() {
        navigate('/login');
      }, 1000)

    } catch(error) {
      document.querySelector(".success-alert").style.display = "none";
      document.querySelector(".error-alert").style.display = "flex";
      if(error.response) {
        const errors = (error.response && error.response.data && error.response.data.message) ? error.response.data.message : [];
        const temp = [];
        for (let i = 0; i < errors.length; i++) {
          temp.push(errors[i].msg)
        }
        setErrorMessage(temp);
      } else {
        setErrorMessage(["Server not reachable. Please ensure backend is running on http://localhost:8000"]);
      }
    }

  }

  return (
    <div className='signin signup'>
      <NavLink to='/' className='logo'>
        <span style={{fontWeight:'800',fontSize:'24px',color:'#111'}}>lakshmiworld</span>
      </NavLink>

      <Alert variant="outlined" severity="warning" className='alert error-alert'>
        <AlertTitle className='alert-title'>There were some errors</AlertTitle>
        <ul>
          { 
            errorMessage.map(function(error, index) {
              return (
                <li key={index}> {error} </li>
              )
            })
          }
        </ul>
      </Alert>

      <Alert variant="outlined" className='alert success-alert'>Registered successfully! Please <NavLink to='/login'>login</NavLink></Alert>
   
      <div className='form-details'>
        <h3>Create Account</h3>
        <form method='POST' onSubmit={ sendData }>
          <label htmlFor='name'>Your name</label>
          <input type='text' name='name' id='name' placeholder='First and last name' onChange={ formUpdate } value={ signUpInfo.name } required />
          <label htmlFor='number'>Mobile number</label>
          <div className='mobile-number'>
            <CountryCode />
            <input type='text' name='number' id='number' placeholder='Mobile number' onChange={ formUpdate } value={ signUpInfo.number } required />
          </div>
          <label htmlFor='email'>Email</label>
          <input type='email' name='email' id='email' placeholder='Email Address' onChange={ formUpdate } value={ signUpInfo.email } required />
          <label htmlFor='password'>Password</label>
          <input type='password' name='password' id='password' placeholder='Password (At least 6 characters)' onChange={ formUpdate } value={ signUpInfo.password } required />
          <label htmlFor='confirmPassword'>Confirm Password</label>
          <input type='password' name='confirmPassword' id='confirmPassword' placeholder='Confirm Password' onChange={ formUpdate } value={ signUpInfo.confirmPassword } required />
          <button type='submit' id='submit'>Continue</button>
        </form>

        <div className='already-have-account'>
          <p>Already have an account? <NavLink to="/login">Sign in<ArrowRightIcon id='arrow-right' /></NavLink></p>
        </div>
      </div>
    </div>
  )
}

export default SignUp;