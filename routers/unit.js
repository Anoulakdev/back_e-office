const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/unitController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/units", list);

router.get("/units/:unitId", getById);

module.exports = router;
