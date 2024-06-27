const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Pre middleware to populate product in products array
OrderSchema.pre("find", function (next) {
  this.populate("products.product");
  next();
});

OrderSchema.pre("findOne", function (next) {
  this.populate("products.product");
  next();
});
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
