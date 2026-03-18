import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

/**
 * @Server Side Socket Events -> socket.emit() -> socket.on()
 * @Client Side Socket Events -> socket.on() <- socket.emit()
 */

io.on("connection", (socket) => {
  const username = socket.handshake.auth.username || "Anonymous";
  socket.emit("welcome", `Welcome ${username}! Your socket ID is ${socket.id}`);

  socket.on("message", ({ room, message }) => {
    const payload = { message, senderId: socket.id, username };
    if (room) {
      io.to(room).emit("receive-message", payload);
    } else {
      io.emit("receive-message", payload);
    }
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    socket.emit("room-joined", room);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
