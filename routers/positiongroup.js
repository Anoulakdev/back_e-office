const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
} = require("../controllers/positiongroup");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/positiongroups", list);

router.get("/positiongroups/:positiongroud_id", getById);

module.exports = router;