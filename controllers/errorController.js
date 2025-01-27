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
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);
const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again', 401);

const sendErrorDev = function (err, req, res) {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode);
    return res.json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE
  res.status(err.statusCode);
  res.render('error', {
    title: 'Something went wrong!',
    message: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) operational, trusted error: send message to client
  if (err.isOperational) {
    // A.i) API
    if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode);
      return res.json({
        status: err.status,
        message: err.message,
      });
    }
    // A.ii) RENDERED WEBSITE
    res.status(err.statusCode);
    return res.render('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
  } else {
    // B) programming or other unknown err: don't leak error details
    // B.i) API
    if (req.originalUrl.startsWith('/api')) {
      // 1) log error
      console.error('Error', err);
      // 2) Send generic message
      res.status(500);
      return res.json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    } else {
      // B.ii) RENDERED WEBSITE
      // 1) log error
      console.error('Error', err);
      // 2) Send generic message
      res.status(500);
      return res.render({
        title: 'Something went wrong!',
        message: 'Try again later',
      });
    }
  }
};

// Global Error Handler
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
    sendErrorProd(error, req, res);
  }
};
