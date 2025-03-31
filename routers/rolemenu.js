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
// const { auth } = require("../middleware/auth");

router.get("/rolemenus", list);

router.get("/rolemenus/:rolemenuId", getById);

router.post("/rolemenus", create);

router.put("/rolemenus/:rolemenuId", update);

router.delete("/rolemenus/:rolemenuId", remove);

module.exports = router;