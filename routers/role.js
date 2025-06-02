const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/roleController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/roles", auth, list);

router.get("/roles/:roleId", auth, getById);

router.post("/roles", auth, create);

router.put("/roles/:roleId", auth, update);

router.delete("/roles/:roleId", auth, remove);

module.exports = router;
