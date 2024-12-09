const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/external/docexternal");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexternals", list);
router.get("/docexternals/:docexternalId", getById);
router.post("/docexternals", auth, create);
router.put("/docexternals/:docexternalId", auth, update);
router.delete("/docexternals/:docexternalId", remove);

module.exports = router;
