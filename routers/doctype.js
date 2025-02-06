const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/doctype");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/doctypes", list);

router.get("/doctypes/:doctypeId", getById);

router.post("/doctypes", create);

router.put("/doctypes/:doctypeId", update);

router.delete("/doctypes/:doctypeId", remove);

module.exports = router;