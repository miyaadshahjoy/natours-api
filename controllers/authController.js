const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode);
  res.json({
    status: 'success',
    token,
    data: {
      user,
    },
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
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.hostname}:3000/account`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the email and password exist
  if (!email || !password)
    return next(new AppError('Please enter the email and the password!', 400));

  // 2) Check if the user exist and the password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password!', 401));

  // 3) If everything is ok create the JWT token and return it
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200);
  res.json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(-1);
  } else {
    token = req.cookies.jwt;
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
  res.locals.user = currentUser;
  req.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          'You do not have the permission to perform this action.',
          403
        )
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed Email

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(
        'Incorrect Email. User with the provided Email does not exist.',
        404
      )
    );
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });
  // 3) Send the reset token to user's email
  try {
    // TODO: We have to create a function to send emails
    const resetUrl = `${req.protocol}://${req.hostname}/api/v1/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200);
    res.json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    await user.save({ validateBeforeSave });
    return next(
      new AppError(
        'There was an error sending the email. Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async function (req, res, next) {
  // TODO: 1) Get user based on the token
  const resetToken = req.params.resetToken;
  const encryptedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const user = await User.findOne({ passwordResetToken: encryptedToken });

  if (!user || !(Date.now() < user.passwordResetTokenExpire))
    return next(new AppError('Token is invalid or has expired.'));
  // TODO: 2) If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  await user.save();
  // TODO: 3) Update passwordChangedAt property for the user

  // TODO: 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // TODO: 1) Get user from the collection

  const currentUser = await User.findById(req.user.id).select('+password');

  // TODO: 2) Check if POSTed current password is correct
  if (
    !currentUser ||
    !(await currentUser.correctPassword(
      req.body.currentPassword,
      currentUser.password
    ))
  )
    return next(new AppError('Incorrect password.', 401));
  // TODO: 3) If current password is correct, update the password
  currentUser.password = req.body.newPassword;
  currentUser.passwordConfirm = req.body.newPasswordConfirm;
  await currentUser.save({
    validateBeforeSave: true,
  });

  // TODO: 4) Log user in, send JWT
  createSendToken(currentUser, 200, res);
});

exports.isLoggedIn = async (req, res, next) => {
  let token;
  try {
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      if (!token) return next();
      // Verification of token
      const decodedDocument = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_KEY
      );
      // Check if user still exists

      const currentUser = await User.findById(decodedDocument.id);
      if (!currentUser) return next();

      // Check if user changed password after the token was issued
      if (currentUser.passwordChangedAfter(decodedDocument.iat)) return next();
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    next();
  }
  next();
};
