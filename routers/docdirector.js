const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  getdocument,
  create,
  update,
  remove,
  assign,
} = require("../controllers/director/docdirectorController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docdirectors", auth, list);
router.get("/docdirectors/:docdirectorId", auth, getById);
router.get("/docdirectors/getdocument/:docdirectorId", auth, getdocument);
router.post("/docdirectors", auth, create);
router.post("/docdirectors/assignto", auth, assign);
router.put("/docdirectors/:docdirectorId", auth, update);
router.delete("/docdirectors/:docdirectorId", auth, remove);

module.exports = router;
