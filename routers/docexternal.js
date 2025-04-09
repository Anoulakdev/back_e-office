const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
  assign,
} = require("../controllers/external/docexternalController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexternals", auth, list);
router.get("/docexternals/:docexternalId", auth, getById);
router.post("/docexternals", auth, create);
router.post("/docexternals/assignto", auth, assign);
router.put("/docexternals/:docexternalId", auth, update);
router.delete("/docexternals/:docexternalId", auth, remove);

module.exports = router;
