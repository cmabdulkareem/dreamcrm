const corsOptions = {
  origin: ["https://dreamcrms.vercel.app", "https://dreamcrm.onrender.com", "http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization", "x-brand-id"],
  exposedHeaders: ["set-cookie"]
};

export default corsOptions;