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
} = require("../controllers/internal/docinternalController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docinternals", auth, list);
router.get("/docinternals/:docinternalId", auth, getById);
router.post("/docinternals", auth, create);
router.post("/docinternals/assignto", auth, assign);
router.put("/docinternals/:docinternalId", auth, update);
router.delete("/docinternals/:docinternalId", auth, remove);

module.exports = router;
