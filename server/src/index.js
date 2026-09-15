
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspace");
const channelRoutes = require("./routes/channel");
const dmRoutes = require("./routes/dm");
const inviteRoutes = require("./routes/invite");

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", channelRoutes);
app.use("/api/dms", dmRoutes);
app.use("/api/invites", inviteRoutes);  // GET /api/invites/:token + POST /api/invites/:token/accept

app.get("/", (req, res) => res.send("TeamSYNC backend running 🚀"));
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error middleware
const errorMiddleware = require("./middleware/error.middleware");
app.use(errorMiddleware);

// Socket.IO setup
const initSocket = require("./socket");
const io = initSocket(server);
app.set("io", io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
