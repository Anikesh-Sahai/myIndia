const { ERROR, FAIL } = require("./constants")

class AppError extends Error {
  constructor(message, statusCode, fieldError = {}, type = ERROR) {
    super(message)

    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? FAIL : ERROR
    this.fieldError = fieldError
    this.type = type
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError