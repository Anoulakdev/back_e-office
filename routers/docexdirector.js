const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/external/docexdirector");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexdirectors", auth, list);
router.get("/docexdirectors/:docexdirectorId", getById);
router.post("/docexdirectors", auth, create);
router.put("/docexdirectors/:docexdirectorId", auth, update);
router.delete("/docexdirectors/:docexdirectorId", remove);

module.exports = router;
