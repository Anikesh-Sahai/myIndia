const Product = require("../models/productModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError')

const {
  OK_CODE,
  CREATED_CODE,
  SUCCESS,
  NOT_FOUND_CODE,
} = require("../utils/constants");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await feature.query;

  res.status(OK_CODE).json({
    status: SUCCESS,
    results: products.length,
    data: {
      products,
    },
  });
});

// Create Product
exports.createProduct = catchAsync(async (req, res, next) => {
  req.body.user = req.user._id;
  const product = await Product.create(req.body);

  res.status(CREATED_CODE).json({
    success: SUCCESS,
    product,
  });
});

// Get Product Details
exports.getProductDetails = catchAsync(async (req, res, next) => {
  const product = await Product.find({ _id: req.params.id, active: true });

  if (!product) {
    return next(new AppError("Product not found", NOT_FOUND_CODE));
  }

  res.status(OK_CODE).json({
    success: SUCCESS,
    product,
  });
});

// Get All Product (Admin)
exports.getAdminProducts = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(
    Product.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await feature.query;

  res.status(OK_CODE).json({
    success: SUCCESS,
    results: products.length,
    data: {
      products,
    }
  });
});

// Delete Product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }
 
  product.active = false;
  await product.save();

  res.status(OK_CODE).json({
    success: SUCCESS,
    message: "Product Delete Successfully",
  });
});

// Update Product
exports.updateProduct = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(OK_CODE).json({
    status: SUCCESS,
    product,
  });
});
