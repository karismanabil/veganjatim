import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import loginBg from "../assets/vegetarians.jpg";

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", formData, { withCredentials: true });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("role", res.data.role);

      setIsAuthenticated(true);

      if (res.data.role === "admin") {
        navigate("/admin/orders");
      } else {
        navigate("/");
      }
    } catch (error) {
      setMessage("Login gagal. Cek email & password.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000, error);
    }
  };

  return (
    <div className="full-width-container"
      style={{
      backgroundImage: `url(${loginBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      }}
    >
      {/* Overlay  */}
      <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(3px)",
        zIndex: 1,
      }}
      />

      {/* Floating Alert */}
      {showAlert && (
      <div
        style={{
        position: "fixed",
        top: 30,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        minWidth: 300,
        }}
      >
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {message}
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => setShowAlert(false)}
          style={{ outline: "none" }}
        ></button>
        </div>
      </div>
      )}

      {/*  Login */}
      <div
      className="card p-5"
      style={{
        backgroundColor: "rgba(255, 255, 255, 1)",
        zIndex: 2,
      }}
      >
      <div className="mb-4 text-center">
        <h2 className="mb-2">Login</h2>
        <p className="text-secondary fw-semibold">Login untuk dapat memesan makanan!</p>
      </div>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="form-control"
          onChange={handleChange}
          required
        />
        </div>
        <div className="mb-4">
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="form-control"
          onChange={handleChange}
          required
        />
        </div>
        <button type="submit" className="btn btn-primary w-100">
        Login
        </button>
      </form>
      <p className="mt-3 text-center">
        Belum punya akun? <a href="/register">Register</a>
      </p>
      </div>
    </div>
    );
};

export default Login;
