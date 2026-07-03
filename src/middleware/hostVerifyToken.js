import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Host from '../models/Host.js';
// import {User } from "../models/Users";

export const hostVerifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Access denied. You are not authorised.",
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
      const user = await Host.findOne({ email: verified.email });
      if (!user) {
        return res.status(400).json({
          statusCode: 400,
          data: null,
          message: "Invalid email",
          error: "Invalid email",
        });
      }

      req.hostInfo = {
        id: user.id,
        role: verified.role,
        iat: verified.iat
      };
    } else {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Access denied.",
        error: "Access denied.",
      });
    }
  } catch (error) {
    return res.status(400).json({
      statusCode: 400,
      data: null,
      message: error.message || "Access denied.",
      error: "Access denied.",
    });
  }
  next();
};
