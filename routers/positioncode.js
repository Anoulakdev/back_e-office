const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
} = require("../controllers/positioncode");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/positioncodes", list);

router.get("/positioncodes/:poscodeId", getById);

module.exports = router;