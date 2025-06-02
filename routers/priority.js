const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/priorityController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/prioritys", auth, list);

router.get("/prioritys/:priorityId", auth, getById);

router.post("/prioritys", auth, create);

router.put("/prioritys/:priorityId", auth, update);

router.delete("/prioritys/:priorityId", auth, remove);

module.exports = router;
