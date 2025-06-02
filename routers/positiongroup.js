const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/positiongroupController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/positiongroups", auth, list);

router.get("/positiongroups/:posgroudId", auth, getById);

module.exports = router;
