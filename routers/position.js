const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/positionController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/positions", list);

router.get("/positions/:positionId", getById);

module.exports = router;
