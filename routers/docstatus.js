const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/docstatusController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docstatus", auth, list);

router.get("/docstatus/:docstatusId", auth, getById);

router.post("/docstatus", auth, create);

router.put("/docstatus/:docstatusId", auth, update);

router.delete("/docstatus/:docstatusId", auth, remove);

module.exports = router;
