import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const server = app.listen(3000, () => {
  console.log("server is running");
});

const wss =new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    console.log("Data from Client %s:", data);
    ws.send("Thanks");
  });
});
