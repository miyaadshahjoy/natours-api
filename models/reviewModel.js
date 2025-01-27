const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must not be empty.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'A review must belong to a tour!'],
      ref: 'Tour',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'A review must belong to a user'],
      ref: 'User',
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Indexes

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats.at(0).avgRating,
      ratingsQuantity: stats.at(0).nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

// document middileware
reviewSchema.post('save', function () {
  // Here, this.constructor = Model
  this.constructor.calcAverageRatings(this.tour);
});

// for update and deleting reviews

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to the current query
  this.r = await this.clone().findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() doesn't work here, because query is already executed
  // this points to the current query
  // Here this.r = current document
  // Here, this.r.constructor = Model

  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
