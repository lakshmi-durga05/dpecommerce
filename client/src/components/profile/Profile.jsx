import React, { useEffect, useState } from 'react';
import NameBanner from './NameBanner';
import UserDetails from './UserDetails';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import { getAuthUser } from '../../api';
import Loader from '../loader/Loader';

const Profile = () => {

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
    const fname = name.substring(0, name.indexOf(' ')) + "'s Account";

    return (
      <>
        {
          isLoading ? <Loader /> :
          <div className='profile'>
            <NameBanner name={fname} />
            <UserDetails user={userData} />
          </div>
        }
      </>
    )
  } else {
    <Loader />
  }
  
}

export default Profile;