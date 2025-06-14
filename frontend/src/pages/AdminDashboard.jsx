import React, { useState, useEffect } from "react";
import axios from "axios";

const statusColors = {
  "waiting for payment": "badge bg-warning",
  "waiting for confirmation": "badge bg-warning text-dark",
  processing: "badge bg-primary",
  shipped: "badge bg-secondary",
  complete: "badge bg-success",
  cancelled: "badge bg-danger",
  "payment failed": "badge bg-dark",
};

const statusTabs = ["all", ...Object.keys(statusColors)];

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [trackingNumbers, setTrackingNumbers] = useState({});
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data.data);
      } catch (error) {
        console.error("Error fetching orders:", error.response || error);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setSelectedStatus((prevStatus) => ({
      ...prevStatus,
      [orderId]: newStatus,
    }));
  };

  const handleTrackingNumberChange = (orderId, value) => {
    setTrackingNumbers((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (
            order.status === "waiting for payment" &&
            Date.now() - new Date(order.created_at).getTime() > 2 * 60 * 60 * 1000
          ) {
            // Update status locally
            // Optionally, update status on server
            axios
              .put(
                `http://localhost:5000/orders/${order.orderId}`,
                { status: "payment failed", tracking_number: order.tracking_number || "" },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
              )
              .catch((error) => {
                console.error("Error auto-updating payment status:", error);
              });
            return { ...order, status: "payment failed" };
          }
          return order;
        })
      );
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (orderId) => {
    const status = selectedStatus[orderId];
    const trackingNumber = trackingNumbers[orderId] || "";
    axios
      .put(
        `http://localhost:5000/orders/${orderId}`,
        { status, tracking_number: trackingNumber },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      .then(() => {
        alert("Status berhasil diperbarui!");
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId
              ? { ...order, status, tracking_number: trackingNumber }
              : order
          )
        );
      })
      .catch((error) => {
        console.error("Error updating status:", error);
      });
  };

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  // Sort orders by created_at descending (newest first)
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="container m-5 p-5">
      <h2 className="mb-4">Transaction Orders</h2>

      {/* Tabs */}
      <ul className="nav nav-tabs">
        {statusTabs.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active fw-bold text-success" : "text-secondary"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-light">
              <th className="border px-3 py-2">Order ID</th>
              <th className="border px-3 py-2">User Name</th>
              <th className="border px-3 py-2">Address</th>
              <th className="border px-3 py-2">Products</th>
              <th className="border px-3 py-2">Total Price</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Tracking Number</th>
              <th className="border px-3 py-2">Payment Proof</th>
              <th className="border px-3 py-2">Created At</th>
              <th className="border px-3 py-2">Updated At</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <tr key={order.order_id} className="text-start">
                  <td className="border px-3 py-2">{order.order_id}</td>
                  <td className="border px-3 py-2">{order.user_name}</td>
                  <td className="border px-3 py-2 address-cell">{order.address}</td>
                  <td className="border pe-3 py-2">
                    <small>
                      <ul>
                        {order.products.map((product, index) => (
                          <li key={index}>{product.product_name}</li>
                        ))}
                      </ul>
                    </small>
                  </td>
                  <td className="border px-3 py-2">
                    Rp{order.total_price.toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    <span className={`badge py-2 mb-1 ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <select
                      value={selectedStatus[order.order_id] || order.status}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                      className="form-select mb-2"
                    >
                      {Object.keys(statusColors).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {selectedStatus[order.order_id] === "shipped" && (
                      <input
                        type="text"
                        placeholder="Enter tracking number"
                        value={trackingNumbers[order.order_id] || ""}
                        onChange={(e) =>
                          handleTrackingNumberChange(order.order_id, e.target.value)
                        }
                        className="form-control mt-2"
                      />
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {order.tracking_number || "-"}
                  </td>
                  <td className="border px-3 py-2">
                    {order.payment_proof ? (
                      <img
                        src={`http://localhost:5000/uploads/${order.payment_proof}`}
                        alt="Payment Proof"
                        className="img-fluid rounded"
                        style={{ maxHeight: "150px", objectFit: "cover" }}
                      />
                    ) : (
                      "No Proof"
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    {new Date(order.updated_at).toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    <button
                      onClick={() => handleUpdateStatus(order.order_id)}
                      className="ml-2 bg-primary px-2 py-1 rounded"
                    >
                      Ubah
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center py-4 text-muted">
                  <i>Tidak ada produk diproses ini</i>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
