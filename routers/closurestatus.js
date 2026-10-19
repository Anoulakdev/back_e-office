const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/closureStatusController");
const { auth } = require("../middleware/auth");

router.get("/closurestatus", auth, list);
router.get("/closurestatus/:closureId", auth, getById);
router.post("/closurestatus", auth, create);
router.put("/closurestatus/:closureId", auth, update);
router.delete("/closurestatus/:closureId", auth, remove);

module.exports = router;
