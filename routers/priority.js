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
// const { auth } = require("../middleware/auth");

router.get("/prioritys", list);

router.get("/prioritys/:priorityId", getById);

router.post("/prioritys", create);

router.put("/prioritys/:priorityId", update);

router.delete("/prioritys/:priorityId", remove);

module.exports = router;
