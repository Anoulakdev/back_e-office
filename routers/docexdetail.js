const express = require("express");
const router = express.Router();

// controllers
const {
  listhead,
  listemployee,
  getById,
  create,
  update,
  remove,
} = require("../controllers/docexdetail");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexhead", auth, listhead);
router.get("/docexemployee", auth, listemployee);
// router.post("/docexternals", auth, getById);
router.post("/docexdetails", auth, create);
// router.put("/docexternals/:docexternalId", auth, update);
// router.delete("/docexternals/:docexternalId", remove);

module.exports = router;