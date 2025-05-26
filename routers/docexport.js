const express = require("express");
const multer = require("multer");
const router = express.Router();

// controllers
const { list, getById, update } = require("../controllers/docexportController");
// middleware
const { auth, checkRole } = require("../middleware/auth");

const upload = multer();

router.get("/docexports", auth, checkRole([12]), list);
router.get("/docexports/:docexportId", auth, checkRole([12]), getById);
router.put(
  "/docexports/:docexportId",
  upload.none(),
  auth,
  checkRole([12]),
  update
);

module.exports = router;
