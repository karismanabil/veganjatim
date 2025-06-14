import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import db from "./db.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs  from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",  // URL frontend
  credentials: true,  // Izinkan cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000; // URL Backend

// ======================= AUTH  ======
// **REGISTER**
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Cek apakah email sudah terdaftar
  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (result.length > 0) {
      return res.status(400).json({ message: "Email sudah pernah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], (result) => {
      res.status(200).json({status: "success", message: "User registered successfully", data:result});
    });
  });
});

// **LOGIN**
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(401).json({ message: "Email atau Password salah" });
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Password Salah" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({status:"success", message: "Login successful", token, userId: user.id, role: user.role});
  });
});

// **MIDDLEWARE AUTH**
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];  // Ambil header Authorization
  if (!authHeader) {
      return res.status(403).json({status:"error", message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];  // Ambil token setelah "Bearer "
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).json({status:"error", message: "Unauthorized access" });
      }
      req.user = decoded;  // Simpan user ke req.user
      next();
  });
};


// **MIDDLEWARE ADMIN**
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({status: "error", message: "Access denied" });
    next();
};

// ======================= AUTH CLOSE ======

// ======================= ADMIN  ===========

// ADMIN: MELIHAT SEMUA ORDER
app.get("/admin/orders", verifyToken, isAdmin, async (req, res) => {
  const sql = `SELECT 
      orders.id AS order_id, 
      orders.total_price, 
      orders.status, 
      orders.created_at, 
      orders.updated_at, 
      orders.address, 
      orders.tracking_number,  -- Ambil tracking number
      CONCAT(
        '[', 
        GROUP_CONCAT(JSON_OBJECT(
          'product_name', products.name
        )), 
        ']'
      ) AS products, 
      CASE 
        WHEN orders.status = 'waiting for confirmation' THEN orders.payment_proof 
        ELSE NULL 
      END AS payment_proof,
      users.name AS user_name  
    FROM orders 
    JOIN order_items ON orders.id = order_items.order_id 
    JOIN products ON order_items.product_id = products.id 
    JOIN users ON orders.user_id = users.id  
    GROUP BY orders.id;`;

  try {
    const result = await new Promise((resolve, reject) => {
      db.query(sql, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    if (result.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    const orders = result.map(order => ({
      ...order,
      products: JSON.parse(order.products || "[]"), // Parsing JSON string ke array
    }));
    res.status(200).json({ status:"success",message:"Data fetched successfully", data: orders });
  } catch (err) {
    res.status(500).json({ status:"error", message: "Internal Server Error", data: err });
  }
});


// validasi status yang diperbolehkan
const validStatuses = [
  "waiting for payment",
  "waiting for confirmation",
  "processing",
  "shipped",
  "complete",
  "cancelled",
  "payment failed",
];


/// ADMIN: API untuk update status pesanan
app.put("/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const { status, tracking_number } = req.body;

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  let sql, params;

  if (status === "shipped" && tracking_number) {
    // Jika status dikirim, simpan nomor resi
    sql = "UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?";
    params = [status, tracking_number, orderId];
  } else {
    // Jika hanya mengupdate status tanpa tracking number
    sql = "UPDATE orders SET status = ? WHERE id = ?";
    params = [status, orderId];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({status:"error", message:"Internal Server Error", data:err});
    }
    res.status(200).json({status:"success", message: "Order status updated successfully", data:result});
  });
});


// ======================= ADMIN CLOSE ==========


// ======================= PRODUCT ===========
// API untuk mendapatkan semua produk
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      return res.status(500).json({status:"error", message: "Internal Server Error", data: err});
    }
    res.status(200).json({status:"success", message: "Data fetched succesfully", data: result});
  });
});

// ======================= PRODUCT CLOSE ===========


// ===================== CHECKOUT ======================

// API checkout untuk membuat pesanan baru
app.post("/checkout", async (req, res) => {
  const { user_id, address, total_price, items } = req.body;

  if (!user_id || !address || !total_price || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({status:"error", message: "Invalid request data" });
  }

  try {
    // Insert order
    const orderResult = await new Promise((resolve, reject) => {
      const sqlOrder = `
        INSERT INTO orders (user_id, address, total_price, status, created_at, updated_at) 
        VALUES (?, ?, ?, 'waiting for payment', NOW(), NOW())
      `;
      db.query(sqlOrder, [user_id, address, total_price], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const orderId = orderResult.insertId;

    // Insert order items
    const sqlItems = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
    const itemValues = items.map(item => [orderId, item.product_id, item.quantity, item.product_price * item.quantity]);

    await new Promise((resolve, reject) => {
      db.query(sqlItems, [itemValues], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.status(200).json({status:"success", message:"Order created successfully", data: orderId });
  } catch (err) {
    res.status(500).json({ status:"error", message: "Failed to create order", data: err });
  }
});

// ===================== CHECKOUT CLOSE ==================

// ======================= ORDER  ====================

// API untuk melihat pesanan berdasarkan user
app.get("/orders/:userId", async (req, res) => {
  const { userId } = req.params;

  const sql = `SELECT 
      orders.id AS order_id, 
      orders.total_price, 
      orders.status, 
      orders.created_at, 
      orders.updated_at, 
      orders.address, 
      orders.tracking_number,  -- Ambil tracking number
      CONCAT(
        '[', 
        GROUP_CONCAT(JSON_OBJECT(
          'product_id', products.id, 
          'product_name', products.name, 
          'product_image', products.image, 
          'quantity', order_items.quantity, 
          'price', order_items.price
        )), 
        ']'
      ) AS products, 
      CASE 
        WHEN orders.status = 'waiting for confirmation' THEN orders.payment_proof 
        ELSE NULL 
      END AS payment_proof,
      users.name AS user_name  
    FROM orders 
    JOIN order_items ON orders.id = order_items.order_id 
    JOIN products ON order_items.product_id = products.id 
    JOIN users ON orders.user_id = users.id  
    WHERE orders.user_id = ?  -- Gunakan parameter userId
    GROUP BY orders.id;`;

  try {
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, data) => {
        if (err) return reject(err); // Reject promise jika ada error
        resolve(data); // Resolve dengan hasil query
      });
    });

    // Cek apakah ada pesanan untuk user tersebut
    if (result.length === 0) {
      return res.status(404).json({ status:"error" ,message: "No orders found for this user." });
    }

    // Parsing JSON string produk ke array
    const orders = result.map(order => ({
      ...order,
      products: JSON.parse(order.products || "[]"),
    }));

    res.status(200).json({status:"success", message: "Data fetched successfully", data: orders}); // Return hasil query dalam bentuk JSON
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({status:"error", message: "Internal Server Error", data: err});
  }
});
// 

// ======================= ORDER CLOSE ====================

// ================== PAYMENT ========================

// API untuk mendapatkan detail pembayaran berdasarkan orderId
app.get("/payment/:orderId", (req, res) => {
  const { orderId } = req.params;
  const query = `SELECT total_price, status, created_at, updated_at FROM orders WHERE id = ?`;

  db.query(query, [orderId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({status:"error", message: "Internal Server Error", data: err});
    }

    if (results.length === 0) {
      return res.status(404).json({status:"error", message: "Order not found", data: err});
    }

    // Kirimkan hasil query yang valid
    return res.status(200).json({status:"success", message: "Data fetched successfully", data:results[0]});
  });
});

// Membuat direktori uploads jika belum ada
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, "uploads/"); // Simpan di folder uploads
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Nama unik
  }
});

// Inisialisasi multer dengan konfigurasi storage dan filter
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error("Format file tidak didukung! Gunakan JPG, JPEG, atau PNG"), false);
      }
      cb(null, true);
  }
});

// Endpoint untuk mengunggah bukti pembayaran
app.post("/payment/:orderId/upload", upload.single("payment_proof"), (req, res) => {
  const { orderId } = req.params;
  
  db.query("SELECT status FROM orders WHERE id = ?", [orderId], (err, result) => {
      if (err) {
          return res.status(500).json({ status:"error", message: "Gagal mengambil data pesanan" });
      }
      if (result.length === 0) {
          return res.status(404).json({ status:"error", message: "Pesanan tidak ditemukan" });
      }

      const orderStatus = result[0].status;
      if (orderStatus !== "waiting for payment") {
          return res.status(400).json({ status:"error", message: "Tidak dapat mengunggah bukti pembayaran untuk pesanan ini" });
      }

      if (!req.file) {
          return res.status(400).json({ status:"error", message: "File tidak ditemukan" });
      }

      const imagePath = req.file.filename;
      const sql = "UPDATE orders SET payment_proof = ?, status = 'waiting for confirmation' WHERE id = ?";
      db.query(sql, [imagePath, orderId], (err, result) => {
          if (err) {
              return res.status(500).json({ status:"error", message: "Gagal menyimpan bukti pembayaran", data: err });
          }
          res.status(200).json({ status:"success", message: "Bukti pembayaran berhasil diunggah!", imagePath, data: result });
      });
  });
});

// ================== PAYMENT CLOSE ========================



app.listen(PORT, () => {
});
