const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/rankController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/ranks", list);

router.get("/ranks/:rankId", getById);

router.post("/ranks", create);

router.put("/ranks/:rankId", update);

router.delete("/ranks/:rankId", remove);

module.exports = router;
