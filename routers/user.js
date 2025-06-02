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
const { auth } = require("../middleware/auth");

const upload = multer();

router.get("/users", auth, list);
router.get("/employees", auth, listemployee);
router.get("/users/organize", auth, listorganize);
router.get("/users/internalorganize", auth, listinternalorganize);
router.get("/users/:userId", auth, getById);
router.post("/users", auth, upload.none(), create);
router.put("/users/:userId", auth, upload.none(), update);
router.delete("/users/:userId", auth, remove);

module.exports = router;
