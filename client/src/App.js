import Navbar from './components/header/Navbar'
import Home from './components/home/Home';
import Footer from './components/footer/Footer';
import { Routes, Route } from 'react-router-dom';
import SignUp from './components/login-register/SignUp';
import SignIn from './components/login-register/SignIn';
import Product from './components/product/Product';
import Cart from './components/cart/Cart';
import Profile from './components/profile/Profile';
import Orders from './components/profile/Orders';
import OrderDetails from './components/profile/OrderDetails';
import Wishlist from './components/profile/Wishlist';
import AdminDashboard from './components/admin/AdminDashboard';
import Vendors from './components/admin/Vendors';
import Browse from './components/browse/Browse';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={ <> <Navbar /> <Home /> <Footer /> </> } />
        <Route path='/login' element={ <SignIn /> } />
        <Route path='/register' element={ <SignUp /> } />
        <Route path='/product/:id' element={ <> <Navbar /> <Product /> <Footer /> </> } />
        <Route path='/cart' element={ <> <Navbar /> <Cart /> <Footer /> </> } />
        <Route path='/profile' element={ <> <Navbar /> <Profile /> <Footer /> </> } />
        <Route path='/orders' element={ <> <Navbar /> <Orders /> <Footer /> </> } />
        <Route path='/orders/:id' element={ <> <Navbar /> <OrderDetails /> <Footer /> </> } />
        <Route path='/wishlist' element={ <> <Navbar /> <Wishlist /> <Footer /> </> } />
        <Route path='/browse/:category' element={ <> <Navbar /> <Browse /> <Footer /> </> } />
        <Route path='/admin' element={ <> <Navbar /> <AdminDashboard /> <Footer /> </> } />
        <Route path='/admin/vendors' element={ <> <Navbar /> <Vendors /> <Footer /> </> } />
      </Routes>
    </div>
  );
}

export default App;
