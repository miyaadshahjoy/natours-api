const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from our collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from step (1)
  res.status(200);
  res.render('overview', {
    tours,
    title: 'All Tours',
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the Data, for the requested Tour(including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews'
  );
  if (!tour) return next(new AppError('No tour with that name', 404));
  // 2) Build template
  // 3) Render template using data from step (1)
  res.status(200);
  res.render('tour', {
    tour,
    title: `${tour.name} Tour`,
  });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  // 1) Get all the bookings for the currently logged in user
  const userId = req.user.id;
  const bookings = await Booking.find({ user: userId });
  // 2) Then find all the tours from the bookings
  const tourIds = bookings.map((booking) => booking.tour);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200);
  res.render('overview', {
    tours,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200);
  res.render('login', {
    title: 'Log into your account',
  });
};

exports.getUserAccount = (req, res) => {
  res.status(200);
  res.render('account', {
    title: 'Your account',
    // user: req.user,
  });
};

exports.updateUserAccount = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200);
  res.render('account', {
    user: updatedUser,
  });
});
