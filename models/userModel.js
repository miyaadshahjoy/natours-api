const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
const User = mongoose.model('User', userSchema);
module.exports = User;
