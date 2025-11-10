const corsOptions = {
  origin: ["https://dreamcrm-wjh1.vercel.app", "https://dreamcrm.onrender.com", "http://localhost:5173"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;
