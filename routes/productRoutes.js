const express = require("express");
const {
  getAllProducts,
  createProduct,
  getProductDetails,
  deleteProduct,
  updateProduct,
  getAdminProducts,
} = require("../controllers/productController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router.route("/").get(getAllProducts);
router.route("/").post(protect, restrictTo("admin"), createProduct);
router.route("/myProducts").get(protect, restrictTo("admin"), getAdminProducts);
router.route("/:id").get(getProductDetails);
router
  .route("/:id")
  .put(protect, restrictTo("admin"), updateProduct)
  .delete(protect, restrictTo("admin"), deleteProduct);

module.exports = router;
