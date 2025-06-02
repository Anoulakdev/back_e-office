const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/officeController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/offices", auth, list);

router.get("/offices/:officeId", auth, getById);

module.exports = router;
