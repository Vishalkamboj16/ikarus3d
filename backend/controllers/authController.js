// Logic for getting current user
exports.getCurrentUser = (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Logic for logging out
exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    // Optionally clear the session cookie
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); // The default session cookie name
        res.redirect('http://localhost:5173');
    });
  });
};