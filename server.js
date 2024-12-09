require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const cors = require("cors");
const path = require("path");

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cors());

// Serve static files (CSS, JavaScript) from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Other middleware and routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Step 3 Routing
readdirSync("./routers").map((r) => app.use("/api", require("./routers/" + r)));

// Step 2 Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
