const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/unit");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/units", list);

router.get("/units/:unitId", getById);

// router.post("/units", create);

// router.put("/units/:unitId", update);

// router.delete("/units/:unitId", remove);

module.exports = router;