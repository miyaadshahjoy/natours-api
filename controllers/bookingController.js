const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('./../models/tourModel');
const Booking = require('../models/bookingModel');
const handler = require('../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tour.id,
    /*
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
    */
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  // 3) Send checkout session as response
  res.status(200);
  res.json({
    status: 'success',
    session,
  });
});

exports.createBookingFromCheckout = catchAsync(async (req, res, next) => {
  const { user, tour, price } = req.query;
  if (!user || !tour || !price) return next();
  await Booking.create({ tour, user, price });
  res.status(200);
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = handler.readAllDocuments(Booking);
exports.getBooking = handler.readDocument(Booking);
exports.createBooking = handler.createOne(Booking);
exports.updateBooking = handler.updateOne(Booking);
exports.deleteBooking = handler.deleteOne(Booking);
