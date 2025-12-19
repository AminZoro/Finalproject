const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/users");
const taskRoutes = require ("./routes/tasks");
const projectRoutes = require("./routes/projects");

const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
// Root route - shows API documentation
app.get("/", (req, res) => {
  res.json({
    message: "TeamFlow API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
      },
      projects: {
        list: "GET /api/projects",
        create: "POST /api/projects",
        single: "GET /api/projects/:id",
        update: "PUT /api/projects/:id",
        delete: "DELETE /api/projects/:id",
        members: "GET /api/projects/:id/members",
      },
      users: {
        list: "GET /api/users",
        projectUsers: "GET /api/users/project/:projectId",
        addMember: "POST /api/users/project/:projectId/members",
        removeMember: "DELETE /api/users/project/:projectId/members/:userId",
      },
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working correctly",
    endpoints: [
      "GET /",
      "GET /api/health",
      "GET /api/test",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/projects",
      "POST /api/projects",
    ],
  });
});

// Simple auth endpoints (temporary - add your real routes later)
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: "temp-" + Date.now(),
      name,
      email,
      role: "member",
    },
    token: "temp-jwt-token-" + Date.now(),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: "temp-1",
      name: "Test User",
      email,
      role: "member",
    },
    token: "temp-jwt-token-" + Date.now(),
  });
});



// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
    suggestion: "Visit the root route / for available endpoints",
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
