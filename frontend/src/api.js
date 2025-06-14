const API_URL = import.meta.env.VITE_API_URL;

export const fetchOrders = async () => {
  const response = await fetch(`${API_URL}/orders`);
  return response.json();
};
