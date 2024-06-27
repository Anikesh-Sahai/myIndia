const { default: mongoose } = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const {
  NOT_FOUND_CODE,
  BAD_REQUEST_CODE,
  CREATED_CODE,
  SUCCESS,
  OK_CODE,
} = require("../utils/constants");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.createOrder = catchAsync(async (req, res, next) => {
  const { products, totalPrice } = req.body;

  try {
    const bulkOps = products.map((item) => ({
      updateOne: {
        filter: { _id: item.product, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    const bulkResult = await Product.bulkWrite(bulkOps);

    if (bulkResult.matchedCount !== products.length) {
      throw new AppError(
        "Some products have insufficient stock or do not exist",
        BAD_REQUEST_CODE
      );
    }

    const order = await Order.create({
      user: req.user._id,
      products,
      totalPrice,
    });

    res.status(CREATED_CODE).json({ status: SUCCESS, data: order });
  } catch (err) {
    return next(err);
  }
});

exports.getOrdersByUser = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Order.find({ user: req.user._id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await feature.query;

  res.status(OK_CODE).json({
    status: SUCCESS,
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not Found", NOT_FOUND_CODE));
  }

  order.status = status;
  await order.save();

  res.status(OK_CODE).json({
    success: SUCCESS,
    order,
  });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user");
  if (!order) {
    return next(new AppError("Order not Found", NOT_FOUND_CODE));
  }
  res.status(OK_CODE).json({
    success: SUCCESS,
    order,
  });
});

exports.getAdminOrders = catchAsync(async (req, res, next) => {
  const products = await Product.find({ user: req.user._id }).select("_id");
  const productIds = products.map((product) => product._id);
  const feature = new APIFeatures(
    Order.find({ "products.product": { $in: productIds } }).populate("user"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await feature.query;

  res.status(OK_CODE).json({
    status: SUCCESS,
    results: orders.length,
    data: {
      orders,
    },
  });
});
