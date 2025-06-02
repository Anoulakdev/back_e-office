const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/rolemenuController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/rolemenus", auth, list);

router.get("/rolemenus/:rolemenuId", auth, getById);

router.post("/rolemenus", auth, create);

router.put("/rolemenus/:rolemenuId", auth, update);

router.delete("/rolemenus/:rolemenuId", auth, remove);

module.exports = router;
