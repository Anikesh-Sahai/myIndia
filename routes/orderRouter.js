const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  createOrder,
  getOrdersByUser,
  updateOrderStatus,
  getOrderById,
  getAdminOrders,
} = require("../controllers/orderController");

const router = express.Router();

router
  .route("/")
  .get(protect, restrictTo("user"), getOrdersByUser)
  .post(protect, restrictTo("admin"), createOrder);

router.route("/adminOrders").get(protect, getAdminOrders);

router
  .route("/:id")
  .get(protect, getOrderById)
  .put(protect, restrictTo("admin"), updateOrderStatus);

module.exports = router;
