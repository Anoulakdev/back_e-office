const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/office");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/offices", list);

router.get("/offices/:office_id", getById);

// router.post("/offices", create);

// router.put("/offices/:officeId", update);

// router.delete("/offices/:officeId", remove);

module.exports = router;