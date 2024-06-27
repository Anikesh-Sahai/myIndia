const AppError = require("./appError");
const { NOT_FOUND_CODE } = require("./constants");

exports.urlNotFoundError = (url) =>
    new AppError(`Can't find ${url ?? 'URL'}`, NOT_FOUND_CODE)