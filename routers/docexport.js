const express = require("express");
const router = express.Router();

// controllers
const { list, getById, update } = require("../controllers/docexportController");
// middleware
const { auth, checkRole } = require("../middleware/auth");

router.get("/docexports", auth, checkRole([12]), list);
router.get("/docexports/:docexportId", auth, checkRole([12]), getById);
router.put("/docexports/:docexportId", auth, checkRole([12]), update);

module.exports = router;
