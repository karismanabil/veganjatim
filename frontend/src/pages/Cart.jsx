import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {  Alert } from "react-bootstrap";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const userId = localStorage.getItem("userId"); // Assuming userId is stored in localStorage
  const navigate = useNavigate();
  const [totalPrice, setTotalPrice] = useState(0);


  // Fetch cart items from API
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    calculateTotalPrice(storedCart); // Hitung total harga
  }, [userId]);

  const calculateTotalPrice = (cartItems) => {
    const total = cartItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    setTotalPrice(total);
  };

  const updateCartInLocalStorage = (updatedCart) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart)); // Simpan cart ke localStorage
    setCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated")); 
    calculateTotalPrice(updatedCart); // Update total price
  };

  const handleIncreaseQuantity = (productId) => {
    const updatedCart = cart.map((item) => {
      if (item.product_id === productId) {
        item.quantity += 1;
      }
      return item;
    });
    updateCartInLocalStorage(updatedCart);
  };

  const handleDecreaseQuantity = (productId) => {
    const updatedCart = cart
      .map((item) => {
        if (item.product_id === productId) {
          item.quantity -= 1;
        }
        return item;
      })
      .filter((item) => item.quantity > 0); // Filter item dengan quantity > 0

    updateCartInLocalStorage(updatedCart);
  };
  

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart Anda kosong. Silakan tambahkan produk terlebih dahulu.");
      return;
    }
    navigate("/checkout", { state: { totalPrice } });
  };

  return (
    <div className="full-width-container m-5 p-5" >
      <h1 className="mb-3">Cart</h1>
      <div className="parent ">
        <div className="scrollable-container bg-body-tertiary border rounded-3 p-3 ">
          {cart.length === 0 ? (
            <div className="container text-center mt-4">
                <Alert variant="info" className="text-center">
                  Anda belum memiliki pesanan
                </Alert>
                <a href="/" className="btn btn-primary">
                  Cari Produk
                </a>
            </div>
          ) : (
          <>
          <div className="row p-3 ">
                  {cart.map((item) => (
                    <div className="card mb-3 p-2" key={item.product_id} >
                      <div className="row">
                        <div className="col-2">
                          <img
                            src={`http://localhost:5000/uploads/${item.product_image}`}
                            alt={item.product_name}
                            className="card-img-top rounded-start"
                            style={{ maxHeight: "100px", objectFit: "cover" }}
                            />
                        </div>
                        <div className="col-10">
                          <div className="p-2">
                            <h6>{item.product_name}</h6>
                              <div className="d-flex price-cart-div ">
                                <h5 className="w-100">Rp{item.product_price} </h5>
                                <div className="w-100 d-flex align-items-center ">
                                  <button
                                    onClick={() => handleDecreaseQuantity(item.product_id)}
                                    className="btn btn-sm btn-primary me-2 px-3">-</button>
                                  <h5 className="px-2">{item.quantity}</h5>
                                  <button
                                    onClick={() => handleIncreaseQuantity(item.product_id)}
                                    className="btn btn-sm btn-primary ms-2 px-3">+</button>
                                </div>
                                <h5 className="w-100 m-0 text-end fw-bold">Rp{item.product_price * item.quantity}</h5>
                              </div>
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  
                </div>
              </>
              )}
        </div>
        <div className="fixed-container p-3 ms-3 card">
          <div className="d-flex">
            <p className="text-bold me-auto">Subtotal </p>
            <h6 > Rp{totalPrice}</h6>
          </div>
          <br className="border"/>
          <div className="d-flex">
            <h5 className="fw-bold me-auto">Total </h5>
            <h5 className="fw-bold"> Rp{totalPrice}</h5>
          </div>
            <button
              onClick={handleCheckout}
              className="mt-2 bg-success text-white px-4 py-2 rounded">
              Checkout
            </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;