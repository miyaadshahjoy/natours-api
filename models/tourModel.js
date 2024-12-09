const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const validator = require('validator');

//creating a Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // validator
      unique: true, // not a validator
      trim: true,
      maxlength: [40, 'a name must not contain more than 40 characters'],
      minlength: [10, 'a name must contain atleast 10 characters'],
      validate: [validator.isAlpha, 'the name should only contain alphabets'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty must have [easy, medium and difficult] these 3 values',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'ratings must be atleast 1.0 or above'],
      max: [5, 'ratings must not be more than 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) is more than the actual price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: true,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    price: {
      type: Number,
      required: true,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// defining virtual properties
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Document middleware

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.post('save', function (docs, next) {
  console.log(docs);
  next();
});

// Query middleware

tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(docs);
  console.log(`Time taken ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregate middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  // console.log(this.pipeline());
  next();
});
// creating a Model
const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
