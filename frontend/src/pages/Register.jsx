import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import regbg from "../assets/vegetarians.jpg";

const Alert = ({ message, type, onClose }) => (
  <div
    className={`alert alert-${type === "success" ? "success" : "danger"} alert-dismissible fade show`}
    role="alert"
    style={{
      position: "fixed",
      top: 30,
      right: 30,
      zIndex: 9999,
      minWidth: 250,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}
  >
    {message}
    <button
      type="button"
      className="btn-close"
      aria-label="Close"
      onClick={onClose}
    ></button>
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/register", formData);
      handleAlert("Registrasi berhasil! Silakan login.", "success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        (error.response.data.message?.toLowerCase().includes("email") ||
          error.response.data.error?.toLowerCase().includes("email"))
      ) {
        handleAlert("Email sudah terdaftar. Gunakan email lain.", "error");
      } else {
        handleAlert("Registrasi gagal. Coba lagi.", "error");
      }
    }
  };

  return (
    <div
      className="full-width-container"
      style={{
        backgroundImage: `url(${regbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(3px)",
          zIndex: 1,
        }}
      />

      {/* Bootstrap Alert */}
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* Register */}
      <div
        className="card p-5"
        style={{
          zIndex: 2,
        }}
      >
        <div className="mb-4 text-center">
          <h2 className="mb-2">Register</h2>
          <p className="text-secondary fw-semibold">
            Daftarkan akunmu untuk dapat memesan makanan!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Nama"
              onChange={handleChange}
              required
              className="form-control mb-2"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              className="form-control mb-2"
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="form-control mb-2"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Register
          </button>
        </form>
        <p className="mt-3 text-center">
          Sudah punya akun? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
