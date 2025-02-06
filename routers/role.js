const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/role");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/roles", list);

router.get("/roles/:roleId", getById);

router.post("/roles", create);

router.put("/roles/:roleId", update);

router.delete("/roles/:roleId", remove);

module.exports = router;