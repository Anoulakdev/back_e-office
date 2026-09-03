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
  listdepartment,
  departmentremove,
  removeall,
  documentByMe,
} = require("../controllers/internal/docinternalController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docinternals", auth, list);
router.get("/docinternals/documentbyme", auth, documentByMe);
router.get("/docinternals/departmentremove", auth, departmentremove);
router.get("/docinternals/listdepartment", auth, listdepartment);
router.get("/docinternals/:docinternalId", auth, getById);
router.get("/docinternals/getdocument/:docinternalId", auth, getdocument);
router.post("/docinternals", auth, create);
router.post("/docinternals/assignto", auth, assign);
router.put("/docinternals/:docinternalId", auth, update);
router.delete("/docinternals/removeall", auth, removeall);
router.delete("/docinternals/:docinternalId", auth, remove);

module.exports = router;
