const corsOptions = {
  origin: ["https://dreamcrm-wjh1.vercel.app", "https://dreamcrm.onrender.com"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  secure: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;
