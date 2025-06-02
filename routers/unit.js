const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/unitController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/units", auth, list);

router.get("/units/:unitId", auth, getById);

module.exports = router;
