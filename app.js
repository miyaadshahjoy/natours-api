const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

//////////////////////////////////////

// middlewares

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public/`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

///////////////////////////////////////

// Routes
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/users/', userRouter);

app.all('*', (req, res, next) => {
  // const err = new Error();
  // err.statusCode = 404;
  // err.status = 'fail';
  // err.message = `Can't find ${req.originalUrl} on this server!⛔🚫⛔`;
  // next(err);

  next(
    new AppError(`Can't find ${req.originalUrl} on this server!⛔🚫⛔`, 404)
  );
});

// Global Error Handling Middlware
app.use(globalErrorHandler);
module.exports = app;
