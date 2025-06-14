import { useState, useEffect  } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/vegan.png";

const Navbar = ({ isAuthenticated, logout }) => {

    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false); 
    const [cartCount, setCartCount] = useState(0);
    const role = localStorage.getItem("role"); 
    
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            setCartCount(cart.length); 
        };
    
        updateCartCount(); 
    
        const intervalId = setInterval(updateCartCount, 1000); 
    
        return () => clearInterval(intervalId); 
    }, []);
    

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
    };


    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userId")
        localStorage.removeItem("token"); 
        localStorage.removeItem("role"); 
        localStorage.removeItem("cart"); 
        localStorage.removeItem("paymentMethod"); 
        logout();
        navigate("/login");
    };
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
            <div className="container">
                <h1 className="navbar-brand " style={{ fontSize: "26px", fontWeight: "700" }}>
                <img src={logo} alt="Logo" className="me-3" style={{ height: "32px"}} />
                    Vegan Jatim</h1>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" onClick={toggleNavbar}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
                    <ul className="navbar-nav ms-auto">
                    {role === "admin" ? (
                            <>
                                <li className="nav-item">
                                    <NavLink className="nav-link nav-menu" to="/admin/orders">Transaction Order</NavLink>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>Logout</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item ">
                                    <NavLink className="nav-link nav-menu" to="/">Home</NavLink>
                                </li>
                                {isAuthenticated && (
                                    <>
                                        <li className="nav-item">
                                            <NavLink className="nav-link nav-menu" to="/orders">Riwayat Pesanan</NavLink>
                                        </li>
                                        <li className="nav-item">
                                            <NavLink className="nav-link nav-menu" to="/cart">
                                                Cart{" "}
                                                <span className="badge bg-success">{cartCount}</span>
                                            </NavLink>
                                        </li>
                                        <li className="nav-item">
                                            <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>Logout</button>
                                        </li>
                                    </>
                                )}
                                {!isAuthenticated && (
                                    <li className="nav-item">
                                        <NavLink className="btn btn-outline-primary ms-2" to="/login">Login</NavLink>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
