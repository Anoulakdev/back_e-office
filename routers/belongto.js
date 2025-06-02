const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
  remove,
} = require("../controllers/belongtoController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/belongtos", auth, list);

router.get("/belongtos/:belongId", auth, getById);

router.post("/belongtos", auth, create);

router.put("/belongtos/:belongId", auth, update);

router.delete("/belongtos/:belongId", auth, remove);

module.exports = router;
