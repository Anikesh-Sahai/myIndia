const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError')

const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
  UNAUTHORIZED_CODE,
  BAD_REQUEST_CODE,
  CREATED_CODE,
  SUCCESS,
  OK_CODE,
  NO_CONTENT_CODE,
} = require("../utils/constants");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const signTokenAndSendResponse = async (id, code, res) => {
  const token = signToken(id);
  const jwtHashToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findByIdAndUpdate(id, {
    verificationToken: jwtHashToken,
  });
  res.status(code).json({
    status: SUCCESS,
    data: {
      user,
      token,
    },
  });
};

const getTokenFromAuthorizationHeader = (authorizationHeader) => {
  let token;
  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    const tokenArr = authorizationHeader.split(" ");
    if (tokenArr.length !== 2) {
      throw new AppError(
        "You are not logged in. Please log in.",
        UNAUTHORIZED_CODE
      );
    }
    token = tokenArr[1];
  }
  return token;
};

const jwtTokenValidation = (authorizationHeader) => {
  const token = getTokenFromAuthorizationHeader(authorizationHeader);
  if (!token)
    throw new AppError(
      "You are not logged in. Please log in.",
      UNAUTHORIZED_CODE
    );

  return token;
};

const getUserFromToken = async (token) => {
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const jwtHashToken = crypto.createHash("sha256").update(token).digest("hex");

  const currentUser = await User.findOne({
    _id: decode.id,
    verificationToken: jwtHashToken,
  }).select("+role");

  if (!currentUser)
    throw new AppError(
      "The user belonging to this token no longer exists.",
      UNAUTHORIZED_CODE
    );

  return currentUser;
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  return signTokenAndSendResponse(user.id, CREATED_CODE, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new AppError(
        "Please provide valid email/username and password",
        BAD_REQUEST_CODE
      )
    );

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(
      new AppError("Invalid email/username or password", UNAUTHORIZED_CODE)
    );

  signTokenAndSendResponse(user.id, OK_CODE, res);
});

exports.restrictTo = (...roles) => [
  exports.protect,
  catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perfom this action",
          FORBIDDEN_CODE
        )
      );
    }
    next();
  }),
];

exports.logout = catchAsync(async (req, res, next) => {
  const currUser = req.user;
  currUser.verificationToken = undefined;
  await currUser.save({ validateBeforeSave: false });
  res.status(NO_CONTENT_CODE).json({
    status: SUCCESS,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const token = jwtTokenValidation(req.headers.authorization);
  req.user = await getUserFromToken(token);

  next();
});
