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
// const { auth } = require("../middleware/auth");

router.get("/permissions", list);

router.get("/permissions/:permissionId", getById);

router.post("/permissions", create);

router.put("/permissions/:permissionId", update);

router.delete("/permissions/:permissionId", remove);

module.exports = router;
