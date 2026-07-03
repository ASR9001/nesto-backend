import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// import {User } from "../models/Users";

export const userVerifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Access denied. Authorization header is missing.",
        error: "Access denied.",
      });
    }

    const parts = bearerHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Malformed token format. Must be Bearer <token>",
        error: "Malformed Token",
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Access denied. Token is missing.",
        error: "Access denied.",
      });
    }

    const verified = jwt.verify(token, process.env.USER_SECRET_KEY);
    if (verified) {
      const user = await User.findOne({ email: verified.email });
      if (!user) {
        return res.status(400).json({
          statusCode: 400,
          data: null,
          message: "Invalid email in token",
          error: "Invalid email",
        });
      }
      req.user = {
        id: user.id,
        role: verified.role,
        iat: verified.iat
      };
    } else {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Malformed Token",
        error: "Malformed Token",
      });
    }
  } catch (error) {
    return res.status(400).json({
      statusCode: 400,
      data: null,
      message: error.message || "Invalid Token",
      error: "Invalid Token",
    });
  }
  next();
};
