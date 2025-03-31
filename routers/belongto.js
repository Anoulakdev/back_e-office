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
// const { auth } = require("../middleware/auth");

router.get("/belongtos", list);

router.get("/belongtos/:belongId", getById);

router.post("/belongtos", create);

router.put("/belongtos/:belongId", update);

router.delete("/belongtos/:belongId", remove);

module.exports = router;