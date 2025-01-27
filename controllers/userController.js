const sharp = require('sharp');
const User = require('../models/userModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');

const filterObj = (obj, ...allowedFields) => {
  let filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) filteredObj[el] = obj[el];
  });
  return filteredObj;
};
//Multer configuration

/*
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `user-${req.user.id}-${Date.now()}.${file.mimetype.split('/').at(-1)}`
    );
  },
});
*/
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload an image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) next();
  const ext = req.file.mimetype.split('/').at(-1);
  req.file.filename = `user-${req.user.id}-${Date.now()}.${ext}`;
  new sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

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
exports.getUser = factory.readDocument(User);
exports.currentUser = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.updateUserAccount = catchAsync(async (req, res, next) => {
  // TODO: 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This router is not defined to update password. Please use /updatePassword endpoint to update password.'
      )
    );
  }
  // TODO: 2) Filter out unwanted fields names that are not allowed to be updated
  const filteredObject = filterObj(req.body, 'name', 'email');
  if (req.file) filteredObject.photo = req.file.filename;

  // TODO: 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredObject,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200);
  res.json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteUserAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204);
  res.json({
    status: 'success',
    data: null,
  });
});
