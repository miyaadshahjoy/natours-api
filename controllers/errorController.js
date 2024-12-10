const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.keyValue.name;
  const message = `Duplicate field value: ${value}. Use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = `Validation Error: ${Object.values(err.errors)
    .map((el) => el.message)
    .join('. ')}`;
  return new AppError(message, 400);
};
const sendErrorDev = function (err, res) {
  res.status(err.statusCode);
  res.json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode);
    res.json({
      status: err.status,
      message: err.message,
    });
    // programming or other unknown err: don't leak error details
  } else {
    // 1) log error
    console.error('Error', err);
    // 2) Send generic message
    res.status(500);
    res.json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// Global Error Handler
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
