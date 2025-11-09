import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function verifyToken(req, res, next) {
  // Safe access to token
  console.log('Cookies received:', req.cookies);
  const token = req.cookies?.token;
  console.log('Token:', token);

  if (!token) {
    console.log("Token is missing");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification error:', err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
