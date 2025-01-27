const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

router.get('/account', authController.protect, viewsController.getUserAccount);
// router.post(
//   '/account-settings',
//   authController.protect,
//   viewsController.updateUserAccount
// );

module.exports = router;
