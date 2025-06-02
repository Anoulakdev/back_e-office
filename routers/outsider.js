const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/outsiderController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/outsiders", auth, list);

router.get("/outsiders/:outsiderId", auth, getById);

router.post("/outsiders", auth, create);

router.put("/outsiders/:outsiderId", auth, update);

router.delete("/outsiders/:outsiderId", auth, remove);

module.exports = router;
