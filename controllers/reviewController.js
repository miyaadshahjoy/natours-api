const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

/*
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  // Executing Query
  const reviews = await Review.find(filter);

  // Sending Response
  res.status(200);
  res.json({
    status: 'success',
    requestedAt: reviews.requestedAt,
    results: reviews.length,
    data: {
      reviews,
    },
  });
});
*/
exports.getAllReviews = factory.readAllDocuments(Review);

exports.getReview = factory.readDocument(Review);
exports.getTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
/*
exports.getReview = catchAsync(async (req, res, next) => {
  // Executing Query
  let filter = { _id: req.params.reviewId };
  if (req.params.tourId) filter.tour = req.params.tourId;
  const review = await Review.find(filter);

  // Sending Response
  res.status(200);
  res.json({
    status: 'success',

    data: {
      review,
    },
  });
});
*/
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
