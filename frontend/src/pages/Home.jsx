import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bgjumbotron from "../assets/vegetarians.jpg";


const Home = ({ isAuthenticated }) => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();
    

    useEffect(() => {
        fetch("http://localhost:5000/products")
            .then((res) => res.json())
            .then((data) => {if (Array.isArray(data.data)) {
        setProducts(data.data);
    }
    })
            .catch((err) => console.error(err));
    }, []);

    const handleAddToCart = (product) => {
        if (!isAuthenticated) {
            navigate("/login");
        } else {
            const storedCart = JSON.parse(localStorage.getItem("cart")) || [];

            const newItem = {
                product_id: product.id,
                product_name: product.name,
                product_image: product.image,
                product_price: product.price,
                quantity: 1,
            };
        
            const existingItem = storedCart.find((item) => item.product_id === product.id);
        
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                storedCart.push(newItem);
            }
        
            localStorage.setItem("cart", JSON.stringify(storedCart));
            toast.success(`${product.name} added to cart!`);
        }
    };

    return (
        <div className="container my-5 py-5">
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
                    <h1 className="">Vegan Jatim</h1> 
                    <p className="col-lg-8 mx-auto lead">Temukan Makanan dan Minuman Vegetarian untuk kamu Vegan dan yang ingin hidup sehat!</p>
                </div>
            </div>
            <div className="bg-body-tertiary border rounded-3 p-3">
                <div className="row ">
                    {products.length === 0 ? (
                        <div className="col-12">
                            <div className="alert alert-warning text-center" role="alert">
                                {products.length === 0
                                    ? "Makanan / Minuman tidak ditemukan atau terjadi masalah koneksi ke server."
                                    : ""}
                            </div>
                        </div>
                        
                    ) : (
                        products.map((product) => (
                            <div key={product.id} className="col-md-3 mb-4">
                                <div className="card mb-4 w-100 h-100" >
                                    <img src={`http://localhost:5000/uploads/${product.image}`} className="card-img-top" alt={product.name} />
                                    <div className="card-body">
                                        <p className="card-text">{product.name}</p>
                                        <h5 className="card-title">Rp{product.price.toLocaleString()}</h5>
                                    </div>
                                    <div className="card-footer">
                                        <button className="btn btn-success" onClick={() => handleAddToCart(product)}>
                                            Tambahkan ke Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
