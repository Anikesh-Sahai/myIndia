const express = require("express");
const {
  signup,
  login,
  protect,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.route("/logout").post(protect, logout);

module.exports = router;
