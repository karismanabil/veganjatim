import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Accordion, Form, Button, Alert } from "react-bootstrap";
import bgjumbotron from "../assets/vegetarians.jpg";


const Payment = () => {
    const { orderId } = useParams();
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(7200); // 2 jam dalam detik (2 * 60 * 60)
    const [order, setOrder] = useState(null); // Inisialisasi order dengan null
    const [loading, setLoading] = useState(true); // State loading untuk handle async
    const [paymentMethod, setPaymentMethod] = useState(localStorage.getItem("paymentMethod") || ""); // Menyimpan metode pembayaran
    const [paymentCode, setPaymentCode] = useState(""); // Kode pembayaran
    

    const banks = [
        {
            name: "BCA",
            instructions: {
                atm: "1. Masukkan kartu ATM BCA.\n2. Masukkan PIN.\n3. Pilih 'Transfer', lalu pilih 'Rekening BCA'.\n4. Masukkan kode pembayaran.",
                internetBanking: "1. Login ke KlikBCA.\n2. Pilih 'Transfer Dana'.\n3. Masukkan nomor rekening dan kode pembayaran.",
                mobileBanking: "1. Buka aplikasi m-BCA.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening dan kode pembayaran.",
            },
        },
        {
            name: "Mandiri",
            instructions: {
                atm: "1. Masukkan kartu ATM Mandiri.\n2. Pilih 'Bayar/Beli'.\n3. Pilih 'Transfer'.\n4. Masukkan kode pembayaran.",
                internetBanking: "1. Login ke Internet Banking Mandiri.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
                mobileBanking: "1. Buka Livin by Mandiri.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
            },
        },
        {
            name: "BRI",
            instructions: {
                atm: "1. Masukkan kartu ATM BRI.\n2. Pilih 'Bayar/Beli'.\n3. Pilih 'Transfer'.\n4. Masukkan kode pembayaran.",
                internetBanking: "1. Login ke Internet Banking BRI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
                mobileBanking: "1. Buka Livin by BRI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
            },
        },
        {
            name: "BNI",
            instructions: {
                atm: "1. Masukkan kartu ATM BNI.\n2. Pilih 'Bayar/Beli'.\n3. Pilih 'Transfer'.\n4. Masukkan kode pembayaran.",
                internetBanking: "1. Login ke Internet Banking BNI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
                mobileBanking: "1. Buka Livin by BNI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
            },
        },
        {
            name: "BSI",
            instructions: {
                atm: "1. Masukkan kartu ATM BSI.\n2. Pilih 'Bayar/Beli'.\n3. Pilih 'Transfer'.\n4. Masukkan kode pembayaran.",
                internetBanking: "1. Login ke Internet Banking BSI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
                mobileBanking: "1. Buka Livin by BSI.\n2. Pilih 'Transfer'.\n3. Masukkan nomor rekening tujuan dan kode pembayaran.",
            },
        },

    ];

    // Mengambil metode pembayaran dari localStorage saat komponen pertama kali dimuat
    useEffect(() => {
        if (paymentMethod) {
            // Generate kode pembayaran acak hanya jika paymentMethod dipilih
            const generatedCode = Math.floor(10000000000 + Math.random() * 9000000000);
            setPaymentCode(generatedCode.toString()); // Pastikan disimpan sebagai string
        } else {
            setPaymentCode(""); // Reset jika belum memilih metode pembayaran
        }
    }, [paymentMethod]);

    // Hitung countdown setiap detik
    useEffect(() => {
        if (!order) return;

        // Ambil waktu pembuatan order dari order.created_at (pastikan format ISO string)
        const orderCreatedAt = new Date(order.created_at).getTime();
        const paymentDeadline = orderCreatedAt + 2 * 60 * 60 * 1000; // 2 jam dalam ms

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((paymentDeadline - now) / 1000));
            setTimeLeft(diff);

            // Jika waktu habis dan status masih waiting for payment, update status ke payment failed
            if (diff === 0 && order.status === "waiting for payment") {
                axios
                    .patch(`http://localhost:5000/orders/${orderId}`)
                    .then(() => {
                        setOrder({ ...order, status: "payment failed" });
                    })
                    .catch((err) => {
                        console.error("Failed to update payment status:", err);
                    });
            }
        };

        updateTimer(); // Jalankan sekali saat mount
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [order, orderId]);
    // Mengonversi detik ke format HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    useEffect(() => {
        axios
            .get(`http://localhost:5000/payment/${orderId}`)
            .then((response) => {
                // Jika res.data adalah array, ambil elemen pertama
                const data = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];
                setOrder(data[0]); // Ambil elemen pertama dari array
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching order data:", error);
                setLoading(false);
            });
    }, [orderId]);


    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadPayment = () => {
        if (!selectedFile) {
            alert("Pilih file terlebih dahulu!");
            return;
        }

        const formData = new FormData();
        formData.append("payment_proof", selectedFile);

        axios
            .post(`http://localhost:5000/payment/${orderId}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((res) => {
                alert("Bukti pembayaran berhasil diunggah!",res);
                localStorage.removeItem("paymentMethod");
                navigate("/orders"); // Redirect ke Order History
            })
            .catch((error) => {
                console.error("Error uploading payment proof:", error);
            });
    };

    if (loading) {
        return <p>Loading order details...</p>;
    }

    if (!order) {
        return <p>Order tidak ditemukan.</p>;
    }

    return (
        
        <div className="m-5 p-5 full-width-container" >
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
                    <h1 className="">Pembayaran Pesanan</h1> 
                    <span
                        className={ `badge ${order.status === "waiting for payment" ? "bg-warning" : "bg-primary"}`}>
                        {order.status}
                    </span>
                    </div>
                </div>

            <div className="bg-body-tertiary border rounded-3 p-3">

            {timeLeft > 0 ? (
                <>
                    <Alert variant="info">
                    <div className="d-flex align-items-center ">
                        <h5 className="me-auto">Silakan lakukan pembayaran dan unggah bukti sebelum batas waktu habis.</h5>
                        <h4>{formatTime(timeLeft)}</h4>
                    </div>
                    </Alert>
                    
                    <div className="container-fluid border bg-white p-3 d-flex align-items-center mb-3">
                        <h5 className="me-auto">Total Harga</h5>
                        <h4>Rp {order.total_price ? order.total_price.toLocaleString() : "N/A"}</h4>
                    </div>

                    <div className="container-fluid border bg-white p-3 d-flex align-items-center mb-3">
                        <h5 className="me-auto">Kode Pembayaran</h5>
                        <h4 >{paymentCode}</h4>
                    </div>

                    <div className="container-fluid border bg-white p-3  mb-3">
                        <h5 className="">Metode Pembayaran</h5>
                        <div className="d-flex">
                        <div className="me-auto">
                            <select
                                value={paymentMethod}
                                onChange={(e) => {
                                    setPaymentMethod(e.target.value);
                                    localStorage.setItem("paymentMethod", e.target.value); // Simpan ke localStorage
                                }}
                                className="form-select ">
                                <option value="">Pilih Metode Pembayaran</option>
                                <option value="BCA">BCA</option>
                                <option value="Mandiri">Mandiri</option>
                                <option value="BRI">BRI</option>
                                <option value="BNI">BNI</option>
                                <option value="BSI">BSI</option>
                            </select>
                        </div>
                        <h4>{paymentMethod}</h4>
                        </div>
                    </div>


                    <h5 className="mb-3">Intruksi Pembayaran    </h5>
                    {/* Accordion untuk instruksi pembayaran */}
                    <Accordion className="mb-3">
                        <Accordion.Item eventKey="0">
                        <Accordion.Header>Transfer via ATM</Accordion.Header>
                        <Accordion.Body>
                            <pre>{banks.find((bank) => bank.name === paymentMethod)?.instructions.atm}</pre>
                        </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="1">
                        <Accordion.Header>Transfer via Internet Banking</Accordion.Header>
                        <Accordion.Body>
                            <pre>{banks.find((bank) => bank.name === paymentMethod)?.instructions.internetBanking}</pre>
                        </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="2">
                        <Accordion.Header>Transfer via Mobile Banking</Accordion.Header>
                        <Accordion.Body>
                            <pre>{banks.find((bank) => bank.name === paymentMethod)?.instructions.mobileBanking}</pre>
                        </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                    
                    <Form>
                        <Form.Group controlId="formFile" className="mb-3">
                            <h5 className="mb-3">Kirim Bukti Pembayaran</h5>
                            <Form.Control type="file" onChange={handleFileChange} />
                        </Form.Group>
                        <Button variant="primary" onClick={handleUploadPayment}>
                            Unggah dan Bayar
                        </Button>
                    </Form>
                </>
            ) : (
                
                <div className="container-full text-center mt-4">
                    <Alert variant="danger" className="text-center">
                        Waktu pembayaran telah habis! Silakan buat pesanan baru.
                    </Alert>
                    <a href="/" className="btn btn-primary">
                        Cari Produk
                    </a>
                </div>
            )}
            </div>
        </div>
    );
};

export default Payment;
