const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/outsider");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/outsiders", list);

router.get("/outsiders/:outsiderId", getById);

router.post("/outsiders", create);

router.put("/outsiders/:outsiderId", update);

router.delete("/outsiders/:outsiderId", remove);

module.exports = router;