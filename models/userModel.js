const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { ROLE_USER, ROLE_ADMIN, MIN_EIGHT_CHARACTER } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      validate: [validator.isEmail, "Email is invalid"],
    },
    password: {
      type: String,
      required: [true, "Please provide a Password"],
      minlength: [
        MIN_EIGHT_CHARACTER,
        "Password must have at least 8 character",
      ],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your Password"],
      validate: {
        validator(el) {
          return el === this.password;
        },
        message: "Password not match with confirm password",
      },
    },
    role: {
      type: String,
      enum: [ROLE_USER, ROLE_ADMIN],
      default: ROLE_USER,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
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

userSchema.pre("save", async function (next) {
  // this function works only when the password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  return next();
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  // compairing the password at time of login
  const compareResult = await bcrypt.compare(candidatePassword, userPassword);
  return compareResult;
};

const User = mongoose.model("User", userSchema);

module.exports = User;