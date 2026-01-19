const API = import.meta.env.PROD
    ? import.meta.env.VITE_API_URL_PRODUCTION || "/api"
    : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default API;
