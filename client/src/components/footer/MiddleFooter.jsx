import React from 'react';
import LanguageIcon from '@mui/icons-material/Language';
import $ from 'jquery';
// Use public images brand logo for Lakshmiworld

const MiddleFooter = () => {

  function showLanguages () {
    $(".language-dropdown-content").css({ 'transform': ' translateY(30px)', 'display': 'block', transition : '1s ease' });
  }
  function hideLanguages () {
    $(".language-dropdown-content").css({ 'transform': 'translateY(0px)', 'display': 'none', transition : '1s ease' });
  }

  return (
    <div className='middle-footer'>

      <div className='middle-footer-top'>
        <div className='row'>
          <div className='col-6 col-xl-3'>
            <h6>Get to Know Us</h6>
            <p><button type='button' className='linklike'>About Us</button></p>
            <p><button type='button' className='linklike'>Careers</button></p>
            <p><button type='button' className='linklike'>Press Releases</button></p>
            <p><button type='button' className='linklike'>lakshmiworld Cares</button></p>
            <p><button type='button' className='linklike'>Gift a Smile</button></p>
            <p><button type='button' className='linklike'>lakshmiworld Science</button></p>
          </div>
          <div className='col-6 col-xl-3'>
            <h6>Connect with Us</h6>
            <p><a href="https://facebook.com/lakshmiworld">Facebook</a></p>
            <p><a href="https://twitter.com/lakshmiworld">Twitter</a></p>
            <p><a href="https://instagram.com/lakshmiworld">Instagram</a></p>
          </div>
          <div className='col-6 col-xl-3'>
            <h6>Make Money with Us</h6>
            <p><button type='button' className='linklike'>Sell on lakshmiworld</button></p>
            <p><button type='button' className='linklike'>Sell under lakshmiworld Accelerator</button></p>
            <p><button type='button' className='linklike'>lakshmiworld Global Selling</button></p>
            <p><button type='button' className='linklike'>Become an Affiliate</button></p>
            <p><button type='button' className='linklike'>Fulfilment by lakshmiworld</button></p>
            <p><button type='button' className='linklike'>Advertise Your Products</button></p>
            <p><button type='button' className='linklike'>lakshmiworld Pay on Merchants</button></p>
          </div>
          <div className='col-6 col-xl-3'>
            <h6>Let Us Help You</h6>
            <p><button type='button' className='linklike'>COVID-19 and lakshmiworld</button></p>
            <p><button type='button' className='linklike'>Your Account</button></p>
            <p><button type='button' className='linklike'>Returns Centre</button></p>
            <p><button type='button' className='linklike'>100% Purchase Protection</button></p>
            <p><button type='button' className='linklike'>lakshmiworld App Download</button></p>
            <p><button type='button' className='linklike'>lakshmiworld Assistant Download</button></p>
            <p><button type='button' className='linklike'>Help</button></p>
          </div>
        </div>
      </div>

      <div className='middle-footer-bottom'>
        <div className='logo-language'>
          <div className='footer-logo'>
            <img src='images/logo.png' alt='lakshmiworld' />
          </div>
          <div className='language-dropdown'>
            <button>
              <LanguageIcon id="language-icon" />
              English
            </button>
            <div className="language-dropdown-content">
              <div className='lang-name'>
                <input type='radio' name='language' id="english" value='EN' defaultChecked ></input>
                <label htmlFor="english">English - EN</label>
              </div>
              <div className='dropdown-divider'></div>
              <div className='lang-name'>
                <input type='radio' name='language' id='x' value='HI'></input>
                <label htmlFor="x">हिन्दी - HI</label>
              </div>
              <div className='lang-name'>
                <input type='radio' name='language' id='y' value='TA'></input>
                <label htmlFor="y">தமிழ் - TA</label>
              </div>
              <div className='lang-name'>
                <input type='radio' name='language' id='z' value='KN'></input>
                <label htmlFor="z">ಕನ್ನಡ - KN</label>
              </div>
              <div className='lang-name'>
                <input type='radio' name='language' id='z' value='BN'></input>
                <label htmlFor="z">বাংলা - BN</label>
              </div>
              <div className='lang-name'>
                <input type='radio' name='language' id='z' value='MR'></input>
                <label htmlFor="z">मराठी - MR</label>
              </div> 
            </div>
          </div>
        </div>
        <div className='countries'>
          {['Australia','Brazil','Canada','China','France','Germany','Italy','Japan','Mexico','Netherlands','Poland','Singapore','Spain','Turkey','United Arab Emirates','United Kingdom','United States'].map((c)=>(
            <button key={c} type='button' className='linklike'>{c}</button>
          ))}
        </div>
      </div>

    </div>
  )
}

export default MiddleFooter;