const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

// Protect all routes from non-signedin users
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router.get('/currentUser', userController.currentUser, userController.getUser);

router.patch(
  '/updateUserAccount',
  authController.protect,
  userController.updateUserAccount
);

router.delete(
  '/deleteUserAccount',
  authController.protect,
  userController.deleteUserAccount
);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
