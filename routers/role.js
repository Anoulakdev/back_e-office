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

router.get("/roles/:role_id", getById);

router.post("/roles", create);

router.put("/roles/:role_id", update);

router.delete("/roles/:role_id", remove);

module.exports = router;