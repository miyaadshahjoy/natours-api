const express = require('express');
// const crypto = require('crypto');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compressed = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//////////////////////////////////////
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global middlewares
// Reading static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        'https://js.stripe.com/v3/',
      ],
    },
  })
);

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowsMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);
// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Body Parser, Read data from body to req.body
app.use(express.json({ limit: '10kb' }));
// Cookie parser
app.use(cookieParser());
// Form Parser, parse data from form
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurifyInstance.sanitize(req.body[key]);
      }
    }
  }
  next();
};
app.use(sanitizeInput);
// FIXME:
// app.use(xss()); -> deprecated

// parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'maxGroupSize',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
    ],
  })
);

// app.use(compressed());

// Test middlewaress
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

///////////////////////////////////////

// Routes

app.use('/', viewsRouter);
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(`Can't find ${req.originalUrl} on this server!⛔🚫⛔`, 404)
  );
});

// Global Error Handling Middlware
app.use(globalErrorHandler);
module.exports = app;
