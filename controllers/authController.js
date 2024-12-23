const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const token = signToken(newUser._id);
  res.status(201);
  res.json({
    status: 'Success',
    token,
    data: {
      newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the email and password exist
  if (!email || !password)
    return next(new AppError('Please enter the email and the password!', 400));

  // 2) Check if the user exist and the password is correct
  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password!', 401));

  // 3) If everything is ok create the JWT token and return it
  const token = signToken(user._id);
  res.status(200);
  res.json({
    status: 'Success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(-1);
  }

  if (!token)
    return next(
      new AppError('You are not logged in. Log in to get access', 401)
    );
  // 2) Verification of token
  const decodedDocument = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  // 3) Check if user still exists

  const currentUser = await User.findById(decodedDocument.id);
  if (!currentUser)
    return next(
      new AppError(
        'The token belonging to the user does not exist. Please log in again!'
      )
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.passwordChangedAfter(decodedDocument.iat))
    return next(
      new AppError(
        'User changed the password recently. Please log in again.',
        401
      )
    );
  req.user = currentUser;
  next();
});
