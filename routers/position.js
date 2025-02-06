const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/position");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/positions", list);

router.get("/positions/:positionId", getById);

// router.post("/positions", create);

// router.put("/positions/:position_id", update);

// router.delete("/positions/:position_id", remove);

module.exports = router;