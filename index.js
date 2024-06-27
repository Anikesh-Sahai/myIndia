const { createServer } = require("http");
const express = require("express");
const mongoose = require("mongoose");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");

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

app.use(express.json());

app.use(`/users`, userRouter);
app.use(`/products`, productRouter);

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
