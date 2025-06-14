import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Collapse } from "react-bootstrap";
import { Link } from "react-router-dom";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import bgjumbotron from "../assets/vegetarians.jpg";


const statusBadgeClasses = {
  "waiting for payment": "badge bg-warning",
  "waiting for confirmation": "badge bg-warning text-dark",
  "processing": "badge bg-primary",
  "shipped": "badge bg-secondary",
  "complete": "badge bg-success",
  "cancelled": "badge bg-danger",
  "payment failed": "badge bg-dark",
};

const statusList = ["all", ...Object.keys(statusBadgeClasses)];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [openOrderIndex, setOpenOrderIndex] = useState(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const toggleProducts = (index) => {
    setOpenOrderIndex(openOrderIndex === index ? null : index);
  };

  useEffect(() => {
    if (!userId) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios
      .get(`http://localhost:5000/orders/${userId}`, { headers })
      .then((response) => {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        setOrders(data);
      })
      .catch((error) => console.error("Error fetching orders:", error));
  }, [userId, token]);

// Handle complete order actions
  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/orders/${orderId}`,
        { status: "complete" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Pesanan telah diselesaikan!");
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? { ...order, status: "complete" } : order
        )
      );
    } catch (error) {
      console.error("Gagal menyelesaikan pesanan:", error);
    }
  };
// Handle cancel order action
  const handleCancelOrder = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/orders/${orderId}`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Pesanan berhasil dibatalkan!");
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
    } catch (error) {
      console.error("Gagal membatalkan pesanan:", error);
    }
  };

  useEffect(() => {
    if (!orders.length) return;
    const now = new Date();
    orders.forEach(async (order) => {
      if (
        order.status === "waiting for payment" &&
        new Date(now - new Date(order.created_at)).getTime() > 2 * 60 * 60 * 1000
      ) {
        try {
          await axios.put(
            `http://localhost:5000/orders/${order.order_id}`,
            { status: "payment failed" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setOrders((prev) =>
            prev.map((o) =>
              o.order_id === order.order_id ? { ...o, status: "payment failed" } : o
            )
          );
        } catch (error) {
          console.error("Gagal update status payment failed:", error);
        }
      }
    });
  }, [orders, token]);

  const groupedOrders = {};
  orders.forEach((order) => {
    if (!groupedOrders[order.status]) groupedOrders[order.status] = [];
    groupedOrders[order.status].push(order);
  });

  return (
    <div className="full-width-container m-5 p-5">
      <div className="mb-4 text-center text-bg-success rounded-3"
          style={{
          backgroundImage: `url(${bgjumbotron})`,
          backgroundSize: "cover",
        }}
      >
      <div className="p-5"
        style={{
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1,
        borderRadius: "inherit",
        }}
      >
      <h1 className="">Riwayat Pesanan</h1> 
      <p className="col-lg-8 mx-auto lead">Semua Riwayat Pesanan Anda</p>
      </div>
    </div>

      <div className="bg-body-tertiary border rounded-3 p-3">
        {orders.length === 0 ? (
          <div className="container text-center mt-4">
            <Alert variant="info" className="text-center">
              Anda belum memiliki pesanan
            </Alert>
            <a href="/" className="btn btn-primary">
              Cari Produk
            </a>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="all"
            id="order-tabs"
            className=" green-tabs"
          >
            {statusList.map((statusKey) => {
              const isAllTab = statusKey === "all";
              const tabOrders = isAllTab ? orders : groupedOrders[statusKey] || [];
          
              return (
                <Tab
                eventKey={statusKey}
                key={statusKey}
                title={
                  isAllTab
                    ? "All"
                    : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
                }
              >
                {tabOrders.length > 0 ? (
                  tabOrders
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((order, index) => (
                      // 👇 potongan card order kamu yang panjang tetap dipertahankan di sini
                      <div className="card mb-3" key={order.order_id}>
                        <div className="row g-0">
                          <div className="col-md-4 p-3 border-bottom">
                            {order.products &&
                              typeof order.products === "string" &&
                              (order.products = JSON.parse(order.products))}

                            {Array.isArray(order.products) &&
                            order.products.length > 0 ? (
                              <>
                                <img
                                  src={`http://localhost:5000/uploads/${order.products[0].product_image}`}
                                  alt="Foto Produk"
                                  className="img-fluid rounded mb-2"
                                  style={{
                                    maxHeight: "100px",
                                    objectFit: "cover",
                                  }}
                                />
                                <div className="d-flex">
                                  <strong className="me-auto">Nama Produk</strong>
                                  <p className="m-0">
                                    {order.products[0].product_name}
                                  </p>
                                </div>
                                <div className="d-flex">
                                  <strong className="me-auto">Jumlah</strong>
                                  <p className="m-0">
                                    {order.products[0].quantity}
                                  </p>
                                </div>
                                <div className="d-flex">
                                  <strong className="me-auto">Harga</strong>
                                  <p className="m-0">
                                    Rp{order.products[0].price.toLocaleString()}
                                  </p>
                                </div>

                                {order.products.length > 1 && (
                                  <>
                                    <Collapse in={openOrderIndex === index}>
                                      <div id={`collapse-${order.order_id}`}>
                                        {order.products.slice(1).map((product, idx) => (
                                          <div
                                            key={idx}
                                            className="py-4 border-top my-2"
                                          >
                                            <img
                                              src={`http://localhost:5000/uploads/${product.product_image}`}
                                              alt="Foto Produk"
                                              className="img-fluid rounded mb-2"
                                              style={{
                                                maxHeight: "100px",
                                                objectFit: "cover",
                                              }}
                                            />
                                            <div className="d-flex">
                                              <strong className="me-auto">
                                                Nama Produk
                                              </strong>
                                              <p className="m-0">{product.product_name}</p>
                                            </div>
                                            <div className="d-flex">
                                              <strong className="me-auto">Jumlah</strong>
                                              <p className="m-0">{product.quantity}</p>
                                            </div>
                                            <div className="d-flex">
                                              <strong className="me-auto">Harga</strong>
                                              <p className="m-0">
                                                Rp{product.price.toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </Collapse>
                                    <Button
                                      variant="text"
                                      className="p-0 mt-2 text-success"
                                      onClick={() => toggleProducts(index)}
                                      aria-controls={`collapse-${order.order_id}`}
                                      aria-expanded={openOrderIndex === index}
                                    >
                                      {openOrderIndex === index
                                        ? "Lihat Lebih Sedikit"
                                        : "Lihat Lebih Banyak"}
                                    </Button>
                                  </>
                                )}
                              </>
                            ) : (
                              <p className="text-muted">Produk Tidak Tersedia</p>
                            )}
                          </div>

                          <div className="col-md-8">
                            <div className="card-body">
                              <div className="d-flex py-3 border-bottom">
                                <h5 className="card-title me-auto fw-bold">Pesanan #{order.order_id}</h5>
                                <span
                                  className={`badge py-2 ${
                                    statusBadgeClasses[order.status]
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <div className="d-flex">
                                <div className="w-100 me-auto">
                                  <strong>Nama Pemesan</strong>
                                  <p>{order.user_name}</p>
                                </div>
                                <div className="w-100">
                                  <strong>Alamat</strong>
                                  <p>{order.address}</p>
                                </div>
                              </div>
                              <div className="d-flex">
                                <div className="w-100 me-auto">
                                  <strong>Dibuat pada</strong>
                                  <p>
                                    {new Date(order.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="w-100">
                                  <strong>Diubah pada</strong>
                                  <p>
                                    {new Date(order.updated_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex">
                                <div className="w-100 me-auto">
                                  {order.payment_proof ? (
                                    <div >
                                      <p>
                                      <strong>Bukti Pembayaran</strong>
                                      </p>
                                      <img
                                        src={`http://localhost:5000/uploads/${order.payment_proof}`}
                                        alt="Bukti Pembayaran"
                                        className="img-fluid rounded border"
                                        style={{
                                          maxHeight: "80px",
                                          minWidth: "80px",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div >
                                      <strong>Bukti Pembayaran</strong>
                                      <p className="text-muted">
                                        <i>Belum ada bukti pembayaran</i>
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="w-100">
                                  {order.tracking_number && (
                                    <div >
                                      <strong>Nomor Resi</strong>
                                      <p>{order.tracking_number}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="container py-2 px-3 my-3 bg-body-tertiary d-flex">
                                <h5 className="text-body-secondary me-auto fw-bold">Total Harga</h5>
                                <h5 className="fw-bold">Rp{order.total_price.toLocaleString()}</h5>
                              </div>

                              <div className="text-end py-3">
                                <div className="d-flex justify-content-end gap-2">
                                  {order.status === "waiting for payment" && (
                                    <Button
                                        variant="danger"
                                        onClick={() =>
                                          handleCancelOrder(order.order_id)
                                        }
                                      >
                                        Cancel Pesanan
                                      </Button>
                                  )}
                                  {order.status === "waiting for payment" && (
                                    <Link
                                      to={`/payment/${order.order_id}`}
                                      className="btn btn-success"
                                    >
                                      Bayar Sekarang
                                    </Link>
                                  )}
                                </div>
                                
                                {order.status === "shipped" &&
                                  order.tracking_number && (
                                    <Button
                                      variant="success"
                                      onClick={() =>
                                        handleCompleteOrder(order.order_id)
                                      }
                                    >
                                      Selesaikan Pesanan
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i>Tidak ada produk diproses ini</i>
                  </div>
                )}
              </Tab>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
