require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { auth } = require("./middleware/auth");

// middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());

// Static Middleware (ถ้าจำเป็น)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File route
app.get("/upload/user/:filename", auth, (req, res) => {
  const filePath = path.join(__dirname, "uploads/user", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.get("/upload/document/:filename", auth, (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads/document",
    req.params.filename
  );
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.get("/upload/documentlog/:filename", auth, (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads/documentlog",
    req.params.filename
  );
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Other middleware and routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Step 3 Routing
readdirSync("./routers").map((r) => app.use("/api", require("./routers/" + r)));

// Step 2 Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
