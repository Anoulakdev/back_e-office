const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/positionController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/positions", auth, list);

router.get("/positions/:positionId", auth, getById);

module.exports = router;
