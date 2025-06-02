const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/permissionController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/permissions", auth, list);

router.get("/permissions/:permissionId", auth, getById);

router.post("/permissions", auth, create);

router.put("/permissions/:permissionId", auth, update);

router.delete("/permissions/:permissionId", auth, remove);

module.exports = router;
