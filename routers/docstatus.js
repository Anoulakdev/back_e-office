const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/docstatus");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/docstatus", list);

router.get("/docstatus/:docstatusId", getById);

router.post("/docstatus", create);

router.put("/docstatus/:docstatusId", update);

router.delete("/docstatus/:docstatusId", remove);

module.exports = router;