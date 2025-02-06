const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  listuser,
  getById,
  create,
  update,
  remove,
} = require("../controllers/department");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/departments", list);
router.get("/departments/listuser", listuser);
router.get("/departments/:departmentId", getById);

// router.post("/departments", create);

// router.put("/departments/:departmentId", update);

// router.delete("/departments/:departmentId", remove);

module.exports = router;
