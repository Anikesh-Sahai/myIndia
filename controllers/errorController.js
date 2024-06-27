const {
  VALIDATION_ERROR,
  ENV_DEVELOPMENT,
  ENV_PRODUCTION,
  ERROR,
  JSON_WEB_TOKEN_ERROR,
  BAD_REQUEST_CODE,
  FORBIDDEN_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  JSON_WEB_TOKEN_EXPIRED_ERROR,
  CAST_ERROR,
} = require("../utils/constants")

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.kind}, with value: "${err.value}" provided`
  return new AppError(message, BAD_REQUEST_CODE, {}, err.name)
}

const handleValidationErrorDb = (err) => {
  const fieldError = {}

  Object.keys(err.errors).forEach((key) => {
    fieldError[key] = {}
    fieldError[key].name = err.errors[key]?.name
    fieldError[key].message = err.errors[key]?.message
    fieldError[key].kind = err.errors[key]?.kind
    fieldError[key].path = err.errors[key]?.path
    fieldError[key].value = err.errors[key]?.value
  })

  return new AppError('', BAD_REQUEST_CODE, fieldError, err.name)
}

const handleJsonWebTokenError = (err) => {
  const message = 'Something went wrong. Please log in again.'
  return new AppError(message, FORBIDDEN_CODE, {}, err.name)
}

const handleJsonWebTokenExpiredError = (err) => {
  const message = 'Token expired please login again.'
  return new AppError(message, FORBIDDEN_CODE, {}, err.name)
}

const preProcessError = (err) => {
  let error = Object.assign(err)
  error.statusCode = error.statusCode || INTERNAL_SERVER_ERROR_CODE
  error.status = error.status || ERROR

  if (process.env.NODE_ENV === ENV_PRODUCTION) {
    if (error.name === VALIDATION_ERROR) error = handleValidationErrorDb(error)
    if (error.name === CAST_ERROR) error = handleCastErrorDb(error)
    if (error.name === JSON_WEB_TOKEN_ERROR)
      error = handleJsonWebTokenError(error)
    if (error.name === JSON_WEB_TOKEN_EXPIRED_ERROR)
      error = handleJsonWebTokenExpiredError(error)
  }
  return error
}

const createErrorForDev = (err) => {
  const error = preProcessError(err)
  return {
    status: error.status,
    type: error.name,
    error,
    message: error.message,
    stack: error.stack,
  }
}

const sendErrorDev = (err, res) => {
  res
    .status(err.statusCode || INTERNAL_SERVER_ERROR_CODE)
    .json(createErrorForDev(err))
}

const createErrorForProd = (err) => {
  const error = preProcessError(err)
  // operational error , trusted error : send message to client
  let prodErr
  if (error.isOperational) {
    prodErr = {
      status: error.status,
      type: error.type,
      fieldError: error.fieldError,
      nonFieldError: error.message,
    }
    // programming or other unknown error
  } else {
    console.error('error -> ', error)

    prodErr = {
      status: ERROR,
      nonFieldError: 'Oops it seems there is something wrong !!!',
    }
  }

  return prodErr
}

const sendErrorProd = (err, res) => {
  const error = preProcessError(err)
  res
    .status(error.isOperational ? error.statusCode : INTERNAL_SERVER_ERROR_CODE)
    .json(createErrorForProd(err))
}

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === ENV_DEVELOPMENT) {
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === ENV_PRODUCTION) {
    sendErrorProd(err, res)
  }
}

const errorModule = module.exports
errorModule.createErrorForDev = createErrorForDev
errorModule.createErrorForProd = createErrorForProd
