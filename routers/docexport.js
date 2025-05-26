const express = require("express");
const multer = require("multer");
const router = express.Router();

// controllers
const { list, getById, update } = require("../controllers/docexportController");
// middleware
const { auth } = require("../middleware/auth");

const upload = multer();

router.get("/docexports", auth, list);
router.get("/docexports/:docexportId", auth, getById);
router.put("/docexports/:docexportId", upload.none(), auth, update);

module.exports = router;
