import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Checkout = () =>  {
  const [address, setAddress] = useState(""); // State untuk menyimpan alamat
  const [region, setRegion] = useState("jatim"); // Default: Jawa Timur
  const [paymentMethod, setPaymentMethod] = useState(""); // Menyimpan metode pembayaran
  const shippingFee = region === "jatim" ? 0 : 25000; // Gratis ongkir di Jatim, Rp 25.000 luar Jatim
  const [loading, setLoading] = useState(false); // State untuk menampilkan loading saat checkout
  const userId = localStorage.getItem("userId"); // Mengambil userId dari localStorage
  const navigate = useNavigate(); // Menggunakan useNavigate untuk navigasi
  const location = useLocation(); /// Menggunakan useLocation untuk mendapatkan state dari navigasi sebelumnya
  const totalPrice = location.state?.totalPrice || 0; // Mengambil total harga dari state
  const TOTAL = totalPrice + shippingFee; // Mengambil total harga dari state
  
  const handleCheckout = async () => {
    
    // Mengambil cart dari localStorage, jika tidak ada, set ke array kosong
    const cart = JSON.parse(localStorage.getItem("cart")) || []; 
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items to cart before checking out.");
      return;
    }

    if (!address) { // Cek apakah alamat sudah diisi
      alert("Please enter your address before proceeding.");
      return;
    }

    if (!paymentMethod) { // Cek apakah metode pembayaran sudah dipilih
      alert("Please select a payment method.");
      return;
    }

    localStorage.setItem("paymentMethod", paymentMethod); // Simpan metode pembayaran ke localStorage
    setLoading(true); // Set loading state to true

    try { // Mengirim data checkout ke server
      const response = await fetch("http://localhost:5000/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          address,
          total_price: TOTAL,
          items: cart,
        }),
      });

      setLoading(false); // Set loading state to false after response

      if (response.ok) {
        const data = await response.json();
        localStorage.removeItem("cart");
        if (data.data) { // Cek apakah data.data ada
          navigate(`/payment/${data.data}`); // Navigasi ke halaman payment dengan order ID
        } else {
          alert("Order ID not found in response. Please contact support.");
        }
      } else {
        const errorText = await response.text();
        console.error("Checkout failed:", errorText);
        alert("There was a problem processing your order. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Checkout error:", error);
      alert("There was a problem processing your order. Please try again.");
    }
  };

  return (
    <div className="full-width-container m-5 p-5" >
      <h1 className="mb-3 ">Checkout</h1>
      <div className="parent">
        <div className="scrollable-container bg-body-tertiary border rounded-3 p-3 ">
            <div className="mb-3">
              <label className="form-label">Alamat</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-control"
                placeholder="Masukkan Alamat Lengkap"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Pengiriman Daerah</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="form-select">
                <option value="jatim">Jawa Timur (Gratis Ongkir)</option>
                <option value="luar-jatim">Luar Jawa Timur (Rp 25.000)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select">
                <option value="">Pilih Metode Pembayaran</option>
                <option value="BCA">BCA</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="BSI">BSI</option>
              </select>
            </div>
            
        </div>
        <div className="fixed-container p-3 ms-3 card">
            <div className="d-flex m-0">
              <p className="text-bold me-auto">Subtotal </p>
              <h6 className="m-0">Rp{totalPrice}</h6>
            </div>
            <div className="d-flex">
              <p className=" me-auto">Ongkos Kirim </p>
              <h6 className="m-0 ">Rp{shippingFee.toLocaleString()}</h6>
            </div>
            <br className="border"/>
            <div className="d-flex">
              <h5 className="fw-bold me-auto">Total </h5>
              <h5 className="fw-bold">Rp{(totalPrice + shippingFee).toLocaleString()}</h5>
            </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`btn btn-success ${loading ? "disabled" : ""}`}>
                  {loading ? "Processing..." : "Confirm and Pay"}
                </button>
        </div>
      </div>
      
    </div>
  );
}

export default Checkout;