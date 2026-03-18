# 💬 ChatApp — Real-Time Chat with Socket.IO

A full-stack real-time chat application built with **Node.js + Socket.IO** on the server and **React + Material UI** on the client. Users can join named rooms and exchange messages instantly using WebSocket connections.

---

## 📁 Project Structure

```
ChatApp-Socket/
├── client/                  # React frontend (Vite)
│   └── src/
│       └── App.jsx          # Main UI component
└── server/
    └── app.js               # Express + Socket.IO server
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### 1. Start the Server

```bash
cd server
npm install
npm run dev        # uses node --watch for auto-restart
```

Server runs on → `http://localhost:3000`

### 2. Start the Client

```bash
cd client
npm install
npm run dev        # Vite dev server
```

Client runs on → `http://localhost:5173`

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Server    | Node.js, Express 5, Socket.IO 4   |
| Client    | React 19, Vite 8, Socket.IO-client 4 |
| UI        | Material UI (MUI) v7              |
| Protocol  | WebSocket (via Socket.IO)         |

---

## ⚙️ How Socket.IO Works — Deep Dive

### What is Socket.IO?

Socket.IO is a library that enables **real-time, bidirectional, event-driven communication** between a browser and a server. It wraps the native WebSocket protocol and adds:

- Automatic reconnection
- Fallback to HTTP long-polling if WebSocket is unavailable
- Room and namespace support
- Event-based messaging

### WebSocket vs HTTP

| HTTP (REST)                        | WebSocket (Socket.IO)                  |
|------------------------------------|----------------------------------------|
| Client always initiates request    | Either side can send at any time       |
| One request = one response         | Persistent open connection             |
| Stateless                          | Stateful (connection is maintained)    |
| Good for CRUD operations           | Good for real-time features            |

### Connection Lifecycle

```
Client                                    Server
  |                                          |
  |------- HTTP Upgrade Request ----------->|
  |<------ 101 Switching Protocols ---------|
  |                                          |
  |<======= WebSocket Connection Open ======>|
  |                                          |
  |------- socket.emit("join-room") ------->|
  |<------ socket.emit("room-joined") ------|
  |                                          |
  |------- socket.emit("message") --------->|
  |<------ io.to(room).emit("receive-message") --|
  |                                          |
  |------- disconnect() ------------------->|
  |                                          X
```

---

## 📡 Socket Events — Complete Reference

### Server-Side Events (`server/app.js`)

#### `io.on("connection", callback)`
```js
io.on("connection", (socket) => { ... });
```
- Fires every time a **new client connects**
- `socket` is a unique object representing that specific client
- Each socket gets a unique `socket.id` (e.g. `"xK92mP..."`)
- This is the entry point for all per-client event handling

---

#### `socket.emit("welcome", message)` — Server → Client (only sender)
```js
socket.emit("welcome", `Welcome! Your socket ID is ${socket.id}`);
```
- `socket.emit` sends an event to **only this connected client**
- Fires immediately after connection is established
- Client listens: `socket.on("welcome", (msg) => console.log(msg))`

---

#### `socket.on("message", callback)` — Receives message from client
```js
socket.on("message", ({ room, message }) => {
  const payload = { message, senderId: socket.id };
  if (room) {
    io.to(room).emit("receive-message", payload);  // room broadcast
  } else {
    io.emit("receive-message", payload);           // global broadcast
  }
});
```
- Listens for the `"message"` event emitted by the client
- Destructures `{ room, message }` from the payload
- Attaches `senderId` so the client can identify own vs others' messages
- Two broadcast strategies depending on whether a room is specified (see below)

---

#### `socket.on("join-room", callback)` — Adds client to a room
```js
socket.on("join-room", (room) => {
  socket.join(room);
  socket.emit("room-joined", room);
});
```
- `socket.join(room)` adds this socket to a named Socket.IO room
- Rooms are created automatically — no pre-registration needed
- After joining, confirms back to the client with `"room-joined"` event
- A socket can be in multiple rooms simultaneously

---

#### `socket.on("disconnect", callback)` — Client disconnects
```js
socket.on("disconnect", () => {
  console.log("User Disconnected", socket.id);
});
```
- Fires automatically when the client closes the tab, loses network, or calls `socket.disconnect()`
- Used for cleanup: removing users from lists, notifying others, etc.

---

### Client-Side Events (`client/src/App.jsx`)

#### `io()` — Create socket connection
```js
const socket = useMemo(
  () => io("http://localhost:3000", { withCredentials: true }),
  []
);
```
- `io()` initiates the WebSocket handshake with the server
- `withCredentials: true` allows cookies/auth headers to be sent cross-origin
- Wrapped in `useMemo` with `[]` dependency so the socket is created **only once** per component mount — prevents duplicate connections on re-renders

---

#### `socket.on("connect", callback)` — Connection confirmed
```js
socket.on("connect", () => setSocketId(socket.id));
```
- Fires when the WebSocket connection is successfully established
- `socket.id` is now available — a unique string assigned by the server
- Used here to display the user's ID in the UI header

---

#### `socket.emit("join-room", roomName)` — Client → Server
```js
socket.emit("join-room", roomName);
```
- Sends the `"join-room"` event to the server with the room name string
- Server will call `socket.join(roomName)` and confirm back

---

#### `socket.on("room-joined", callback)` — Server confirms room join
```js
socket.on("room-joined", (room) => setCurrentRoom(room));
```
- Receives confirmation from server that the room was joined
- Updates `currentRoom` state so the send form knows which room to target
- The message input label updates to show `Message in <roomName>`

---

#### `socket.emit("message", payload)` — Send a message
```js
socket.emit("message", { message, room: currentRoom });
```
- Sends `"message"` event to the server with the text and target room
- If `currentRoom` is empty string, server broadcasts to all connected clients
- If `currentRoom` has a value, server broadcasts only to that room

---

#### `socket.on("receive-message", callback)` — Receive a message
```js
socket.on("receive-message", ({ message, senderId }) =>
  setMessages((prev) => [...prev, { message, senderId }])
);
```
- Fires when the server emits `"receive-message"` to this client
- Payload is `{ message: string, senderId: string }`
- `senderId` is compared to `socketID` to determine if the message is from self
- Own messages render right-aligned in blue; others render left-aligned in white

---

#### `socket.disconnect()` — Cleanup on unmount
```js
return () => socket.disconnect();
```
- Called in the `useEffect` cleanup function
- Closes the WebSocket connection when the React component unmounts
- Prevents memory leaks and ghost connections

---

## 📢 Broadcast Strategies — `socket.emit` vs `io.emit` vs `io.to(room).emit`

This is one of the most important concepts in Socket.IO:

| Method                          | Who receives it                              |
|---------------------------------|----------------------------------------------|
| `socket.emit("event")`          | Only the sender                              |
| `socket.to(room).emit("event")` | Everyone in the room **except** the sender   |
| `io.to(room).emit("event")`     | Everyone in the room **including** the sender|
| `io.emit("event")`              | Every connected client on the server         |
| `socket.broadcast.emit("event")`| Everyone **except** the sender (global)      |

In this app, `io.to(room).emit(...)` is used so the **sender also sees their own message** in the chat window.

---

## 🔄 Full Message Flow — Step by Step

### Joining a Room

```
1. User types "general" in Room Name input and clicks Join
2. Client: socket.emit("join-room", "general")
3. Server: socket.join("general")  →  socket added to "general" room
4. Server: socket.emit("room-joined", "general")
5. Client: setCurrentRoom("general")  →  green chip appears: "In room: general"
```

### Sending a Message

```
1. User types "Hello!" and clicks Send
2. Client: socket.emit("message", { message: "Hello!", room: "general" })
3. Server: receives "message" event
4. Server: builds payload = { message: "Hello!", senderId: "xK92mP..." }
5. Server: io.to("general").emit("receive-message", payload)
6. All clients in "general" (including sender) receive the event
7. Each client: setMessages(prev => [...prev, { message, senderId }])
8. React re-renders the message list
9. Sender's message appears right-aligned (blue)
10. Others' messages appear left-aligned (white) with truncated sender ID
```

### Disconnecting

```
1. User closes the browser tab
2. Client: socket.disconnect() is called (or browser closes connection)
3. Server: "disconnect" event fires for that socket
4. Server: logs "User Disconnected <socket.id>"
5. Socket.IO automatically removes the socket from all rooms it was in
```

---

## 🧠 React Hooks Used

| Hook        | Purpose                                                                 |
|-------------|-------------------------------------------------------------------------|
| `useMemo`   | Creates the socket instance once — prevents reconnect on every render   |
| `useState`  | Tracks messages, current room, socket ID, input field values            |
| `useEffect` | Registers socket event listeners on mount, cleans up on unmount         |
| `useRef`    | Holds reference to the bottom of the message list for auto-scroll       |

### Why `useMemo` for the socket?

```js
// ❌ Wrong — creates a new socket on every render
const socket = io("http://localhost:3000");

// ✅ Correct — creates socket only once
const socket = useMemo(() => io("http://localhost:3000"), []);
```

Without `useMemo`, every state update (e.g. typing a message) would trigger a re-render and create a brand new socket connection, causing duplicate connections and event listeners.

### Why functional update in `setMessages`?

```js
// ❌ Risky — captures stale messages value from closure
socket.on("receive-message", (data) => setMessages([...messages, data]));

// ✅ Safe — always uses the latest state
socket.on("receive-message", (data) => setMessages((prev) => [...prev, data]));
```

Since the event listener is registered once inside `useEffect`, it closes over the initial value of `messages`. Using the functional form `(prev) => [...]` ensures we always append to the latest state.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        SERVER                           │
│                                                         │
│   Express App                                           │
│       └── HTTP Server (createServer)                    │
│               └── Socket.IO Server (io)                 │
│                       │                                 │
│               io.on("connection")                       │
│                   ├── socket.emit("welcome")            │
│                   ├── socket.on("join-room")            │
│                   │       └── socket.join(room)         │
│                   │       └── socket.emit("room-joined")│
│                   ├── socket.on("message")              │
│                   │       └── io.to(room).emit(...)     │
│                   └── socket.on("disconnect")           │
└─────────────────────────────────────────────────────────┘
              ▲  WebSocket (ws://)  ▼
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│                                                         │
│   React App (Vite)                                      │
│       └── App.jsx                                       │
│               ├── useMemo → io() → socket               │
│               ├── socket.on("connect")                  │
│               ├── socket.on("welcome")                  │
│               ├── socket.on("room-joined")              │
│               ├── socket.on("receive-message")          │
│               ├── socket.emit("join-room")              │
│               └── socket.emit("message")                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 CORS Configuration

```js
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",   // Vite dev server origin
    credentials: true,                 // Allow cookies/auth headers
  },
});
```

Socket.IO requires explicit CORS configuration because the client (`5173`) and server (`3000`) run on different ports — treated as different origins by the browser. Without this, the WebSocket upgrade request would be blocked.

---

## 📦 Dependencies

### Server
| Package     | Version  | Purpose                              |
|-------------|----------|--------------------------------------|
| express     | ^5.2.1   | HTTP server framework                |
| socket.io   | ^4.8.3   | WebSocket server with rooms/events   |
| cors        | ^2.8.6   | Cross-origin resource sharing        |

### Client
| Package            | Version  | Purpose                          |
|--------------------|----------|----------------------------------|
| react              | ^19.2.4  | UI library                       |
| socket.io-client   | ^4.8.3   | WebSocket client                 |
| @mui/material      | ^7.3.9   | Material Design UI components    |
| @emotion/react     | ^11.14.0 | CSS-in-JS (required by MUI)      |
| vite               | ^8.0.0   | Frontend build tool & dev server |

---

## 🧩 Key Concepts Summary

- **Socket** — A single persistent connection between one client and the server. Each has a unique `socket.id`.
- **Room** — A named channel. Sockets can join/leave rooms. Messages can be targeted to a room.
- **Event** — The unit of communication. Both sides emit and listen for named events (e.g. `"message"`, `"join-room"`).
- **`io` vs `socket`** — `io` is the server instance (all clients). `socket` is one specific client connection.
- **Emit** — Send an event. **On** — Listen for an event.
