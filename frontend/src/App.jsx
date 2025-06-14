import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderHistory from "./pages/OrderHistory";
import Payment from "./pages/Payment";  
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";  
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute'; 
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  
  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated);
  }, [isAuthenticated]);

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId")
    localStorage.removeItem("token"); 
    localStorage.removeItem("role"); 
  };

  return (
    <Router>
            <Navbar isAuthenticated={isAuthenticated} logout={logout} />
            <Toaster position="bottom-right" reverseOrder={false} />
            <Routes>
                <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/payment/:orderId" element={<Payment />} />
                <Route path="/checkout" element={<Checkout />} /> 
                <Route path="/cart" element={<Cart />} /> 
                <Route path="/admin/orders" element={<PrivateRoute><AdminDashboard/></PrivateRoute>}/></Routes>
        </Router>
);
}

export default App
