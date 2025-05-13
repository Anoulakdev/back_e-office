const express = require("express");
const multer = require("multer");
const router = express.Router();

// controllers
const {
  list,
  listemployee,
  listorganize,
  listinternalorganize,
  getById,
  create,
  update,
  remove,
} = require("../controllers/userController");
// middleware
// const { auth } = require("../middleware/auth");

const upload = multer();

router.get("/users", list);
router.get("/employees", listemployee);
router.get("/users/organize", listorganize);
router.get("/users/internalorganize", listinternalorganize);
router.get("/users/:userId", getById);
router.post("/users", upload.none(), create);
router.put("/users/:userId", upload.none(), update);
router.delete("/users/:userId", remove);

module.exports = router;
