const express = require("express");

const app = express();
const PORT = 5000;

// 👉 Home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 👉 Example API
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from backend 👋" });
});

// 👉 Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});