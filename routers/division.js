const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/divisionController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/divisions", list);

router.get("/divisions/:divisionId", getById);

module.exports = router;
