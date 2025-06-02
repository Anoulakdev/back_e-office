const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/divisionController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/divisions", auth, list);

router.get("/divisions/:divisionId", auth, getById);

module.exports = router;
