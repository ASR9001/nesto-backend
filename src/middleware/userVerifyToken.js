import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// import {User } from "../models/Users";

export const userVerifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    // console.log("my header" , req.headers)
    const token = bearerHeader.split(" ")[1];
    if (!token)
      return res.send({
        statusCode: 401,
        data: null,
        message: null,
        error: "Access denied.",
      });
    const verified = await jwt.verify(token, process.env.USER_SECRET_KEY);
    if(verified){
    
      const user = await User.findOne({
        email:verified.email
      })
      if(!user){
        return res.send({
          statusCode: 400,
          data: null,
          message: null,
          error: "Invalid email",
        });
      }
        req.user = {
          id : user.id,
          // email : get_user_id_from_hash_mapper.email,
          role : verified.role,
          iat : verified.iat
        }
      }else{
        return res.send({
          statusCode: 401,
          data: null,
          message: null,
          error: "Malformed Token",
        });
      }
    }
   catch (error) {
    return res.send({
      statusCode: 400,
      data: null,
      message: null,
      error: "Invalid Token",
    });
  }
  next();
};
