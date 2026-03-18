import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const App = () => {
  const socket = useMemo(
    () => io("http://localhost:3000", { withCredentials: true }),
    [],
  );

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socketID, setSocketId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const messagesEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    socket.emit("message", { message, room: currentRoom });
    setMessage("");
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    socket.emit("join-room", roomName);
    setRoomName("");
  };

  useEffect(() => {
    socket.on("connect", () => setSocketId(socket.id));
    socket.on("receive-message", ({ message, senderId }) =>
      setMessages((prev) => [...prev, { message, senderId }])
    );
    socket.on("welcome", (s) => console.log(s));
    socket.on("room-joined", (room) => setCurrentRoom(room));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f0f2f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
          {/* Header */}
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: 3,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              💬 Chat App
            </Typography>
            {socketID && (
              <Chip
                label={`ID: ${socketID.slice(0, 8)}...`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontSize: 11 }}
              />
            )}
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Join Room */}
            <Box component="form" onSubmit={joinRoomHandler}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Join a Room
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  id="room-name"
                  label="Room Name"
                  variant="outlined"
                />
                <Button type="submit" variant="contained" sx={{ whiteSpace: "nowrap" }}>
                  Join
                </Button>
              </Stack>
              {currentRoom && (
                <Chip
                  label={`In room: ${currentRoom}`}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Messages */}
            <Box
              sx={{
                height: 300,
                overflowY: "auto",
                bgcolor: "#f8f9fa",
                borderRadius: 2,
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {messages.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  textAlign="center"
                  mt={10}
                >
                  No messages yet. Start the conversation!
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {messages.map((m, i) => {
                    const isOwn = m.senderId === socketID;
                    return (
                      <Box
                        key={i}
                        sx={{
                          alignSelf: isOwn ? "flex-end" : "flex-start",
                          bgcolor: isOwn ? "primary.main" : "white",
                          color: isOwn ? "white" : "text.primary",
                          border: "1px solid",
                          borderColor: isOwn ? "primary.main" : "divider",
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          maxWidth: "80%",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        {!isOwn && (
                          <Typography variant="caption" sx={{ opacity: 0.6, display: "block" }}>
                            {m.senderId.slice(0, 6)}
                          </Typography>
                        )}
                        <Typography variant="body2">{m.message}</Typography>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* Send Message */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  id="send-message"
                  label={currentRoom ? `Message in ${currentRoom}` : "Message (no room)"}
                  variant="outlined"
                />
                <Button type="submit" variant="contained" sx={{ whiteSpace: "nowrap" }}>
                  Send
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default App;
