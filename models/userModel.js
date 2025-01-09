const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { token } = require('morgan');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'An user must have a name. Please provide your name.'],
  },
  email: {
    type: String,
    required: [
      true,
      'An user must have an email. Please provide a valid email',
    ],
    unique: true,
    validate: [
      validator.isEmail,
      'The email you provided is not a valid email',
    ],
  },
  photo: String,
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'guide', 'lead-guide'],
      message: 'Roles must be admin, user, guide or lead-guide',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must contain atleast 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You have to put in the password to confirm'],
    validate: {
      // This only works on CREATE and SAVE
      validator: function (el) {
        return this.password === el;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

//middleware for password encryption
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Encrypt the password
  this.password = await bcrypt.hash(this.password, 12);
  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;

  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp =
      Number.parseInt(this.passwordChangedAt.getTime()) / 1000;
    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  // Creating 32bits pseudo-random hex string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypting the reset token to store it in the Database
  const encryptedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetToken = encryptedToken;
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// query middlewares
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model('User', userSchema);
module.exports = User;
