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
const { auth } = require("../middleware/auth");

router.get("/ranks", auth, list);

router.get("/ranks/:rankId", auth, getById);

router.post("/ranks", auth, create);

router.put("/ranks/:rankId", auth, update);

router.delete("/ranks/:rankId", auth, remove);

module.exports = router;
