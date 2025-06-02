const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/doctypeController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/doctypes", auth, list);

router.get("/doctypes/:doctypeId", auth, getById);

router.post("/doctypes", auth, create);

router.put("/doctypes/:doctypeId", auth, update);

router.delete("/doctypes/:doctypeId", auth, remove);

module.exports = router;
