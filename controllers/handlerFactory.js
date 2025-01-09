const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.readAllDocuments = (Model) => {
  return catchAsync(async (req, res, next) => {
    // EXECUTING QUERY
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // SENDING RESPONSE
    res.status(200);
    res.json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
};

exports.readDocument = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    let filter = { _id: id };
    if (req.params.reviewId) {
      filter = { _id: req.params.reviewId };
      if (req.params.tourId) filter.tour = req.params.tourId;
    }
    ///////////////////////////////////
    let query = Model.find(filter);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document for this ID', 404));
    }
    res.status(200);
    res.json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201);
    res.json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document for this ID', 404));
    }
    res.status(200);
    res.json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError('No document for this ID', 404));
    }
    res.status(204);
    res.json({
      status: 'success',
      data: null,
    });
  });
};
