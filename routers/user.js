const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/user");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/users", list);
router.get("/users/:userId", getById);
router.post("/users", create);
router.put("/users/:userId", update);
router.delete("/users/:userId", remove);

module.exports = router;
