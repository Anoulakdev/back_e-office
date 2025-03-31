const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/positiongroupController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/positiongroups", list);

router.get("/positiongroups/:posgroudId", getById);

module.exports = router;
