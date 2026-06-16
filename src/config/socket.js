import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { setupSocketMiddleware , setupSocketHandlers} from "../socket_chat_infra/index.js";

export let io;
export let redisSocketClient;

// export let io: Server;
// export let redisSocketClient: Redis;

export const setupSocketServer = async (server) => {
  try {
    if (!server) {
      throw new Error("Server instance is undefined");
    }

    if (!io) {
      io = new Server(server, {
        allowEIO3: true,
        cors: {
          origin: "*",
          credentials: true,
        },
        transports: ["websocket", "polling"],

      });



      const pubClient = new Redis(process.env.REDIS_HOST, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        keepAlive: 30000,


        retryStrategy(times) {

          if (times <= 5 || times % 20 === 0) {
            console.log(`🔁 Redis retry attempt: ${times}`);
          }

          return Math.min(times * 500, 5000);
        },
      });



      const subClient = pubClient.duplicate();

      pubClient.on("connect", () => {
        console.log("✅ Redis pub connected");
      });

      subClient.on("connect", () => {
        console.log("✅ Redis sub connected");
      });


      pubClient.on("ready", () => {
        console.log("🚀 Redis pub ready");
      });

      subClient.on("ready", () => {
        console.log("🚀 Redis sub ready");
      });


      pubClient.on("error", (err) => console.error("❌ Redis pub error:", err));
      subClient.on("error", (err) => console.error("❌ Redis sub error:", err));


      pubClient.on("close", () => {
        console.log("⚠️ Redis pub connection closed");
      });

      subClient.on("close", () => {
        console.log("⚠️ Redis sub connection closed");
      });

      io.adapter(createAdapter(pubClient, subClient));
      redisSocketClient = pubClient;
      console.log("✅ Socket.IO initialized with Redis adapter");
      setupSocketMiddleware(io);
      setupSocketHandlers(io);
    }
    return io;


  } catch (error) {
    console.error("❌ Socket setup error:", error);
  }
};