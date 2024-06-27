const { createServer } = require("http");
const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const orderRouter = require("./routes/orderRouter");

const { UNHANDLED_REJECTION_EVENT } = require("./utils/constants");
const { urlNotFoundError } = require("./utils/errors");

require("dotenv").config({ path: "./config.env" });

const app = express();

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection succesfull");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

const server = createServer(app);

// Set security HTTP headers
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);

// Undefined routes handler
app.all("*", (req, res, next) => {
  next(urlNotFoundError(req.originalUrl));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT;

server.listen(PORT * 1, () => {
  console.log(`App running on port ${PORT}`);
});

process.on(UNHANDLED_REJECTION_EVENT, async (err) => {
  console.log("Unhandled rejection ");
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});
