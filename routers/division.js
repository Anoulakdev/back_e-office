const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/division");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/divisions", list);

router.get("/divisions/:divisionId", getById);

// router.post("/divisions", create);

// router.put("/divisions/:divisionId", update);

// router.delete("/divisions/:divisionId", remove);

module.exports = router;