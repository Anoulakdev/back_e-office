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
router.get("/users/:user_id", getById);
// router.post("/users", create);
router.put("/users/:user_id", update);
// router.delete("/users/:user_id", remove);

module.exports = router;
