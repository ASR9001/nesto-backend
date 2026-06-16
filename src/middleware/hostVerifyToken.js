import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Host from '../models/Host.js';
// import {User } from "../models/Users";

export const hostVerifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.send({
        statusCode: 400,
        data: null,
        message: "Access denied.You are not authorised.",
        error: "Access denied.",
      });
    }
    // console.log("my header", req.headers)
    const token = bearerHeader.split(" ")[1];
    if (!token)
      return res.send({
        statusCode: 401,
        data: null,
        message: "Access denied.",
        error: "Access denied.",
      });
    const verified = await jwt.verify(token, process.env.USER_SECRET_KEY);
    if (verified) {

      const user = await Host.findOne({
        email: verified.email
      })
      if (!user) {
        return res.send({
          statusCode: 400,
          data: null,
          message: "Invalid email",
          error: "Invalid email",
        });
      }
    

      req.hostInfo = {
        id: user.id,
        // email : get_user_id_from_hash_mapper.email,
        role: verified.role,
        iat: verified.iat
      }
    } else {
      return res.send({
        statusCode: 401,
        data: null,
        message: "Access denied.",
        error: "Access denied.",
      });
    }
  }
  catch (error) {
    return res.send({
      statusCode: 400,
      data: null,
      message: error.message || "Access denied.",
      error: error
    });
  }
  next();
};
