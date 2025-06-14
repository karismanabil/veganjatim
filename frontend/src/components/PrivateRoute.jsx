import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";


const PrivateRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    // Cek validitas token dan role admin melalui request ke backend
    axios
      .get("http://localhost:5000/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.status === 200) {
          setIsAuthorized(true); // Authorized jika token valid dan role adalah admin
        }
      })
      .catch((error) => {
        console.error("Authorization error:", error);
        setIsAuthorized(false);
      })
      .finally(() => {
        setLoading(false); // Selesai proses validasi
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Loading screen selama validasi token
  }

  return isAuthorized ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
