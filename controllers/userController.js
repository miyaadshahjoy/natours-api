const User = require('../models/userModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200);
  res.json({
    status: 'Success',
    data: {
      users,
    },
  });
});
exports.createUser = (req, res) => {
  res.status(500);
  res.json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.getUser = (req, res) => {
  res.status(500);
  res.json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500);
  res.json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500);
  res.json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
