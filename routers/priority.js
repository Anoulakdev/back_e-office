const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/priority");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/prioritys", list);

router.get("/prioritys/:priority_id", getById);

router.post("/prioritys", create);

router.put("/prioritys/:priority_id", update);

router.delete("/prioritys/:priority_id", remove);

module.exports = router;