import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("user connected");
  console.log(`id: ${socket.id}}`);
});

app.get("/", (req, res) => {
  res.send("Chat App");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
