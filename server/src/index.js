
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
    contentSecurityPolicy: false  // Disable for API testing
}));
app.use(cors({
    origin: process.env.CLIENT_URL || "*", credentials: true
}));
app.use(morgan("dev"))
app.use(express.json())

// Routes
const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspace");
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
// Error middleware
const errorMiddleware = require("./middleware/error.middleware");
app.use(errorMiddleware);

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});

