const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: 'http://localhost:5173/login-failed',
    successRedirect: 'http://localhost:5173/',
}));

// @desc    Get current logged in user
// @route   GET /auth/user
router.get('/user', authController.getCurrentUser);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', authController.logoutUser);

module.exports = router;