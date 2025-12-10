const API = import.meta.env.PROD
    ? import.meta.env.VITE_API_URL_PRODUCTION || "https://dreamcrm.onrender.com/api"
    : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default API;
