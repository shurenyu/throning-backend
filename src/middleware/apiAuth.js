const authAndPayApi = (req, res, next) => {
  if (!req.session.userId) {
    res.status = 401;
    res.send('Unauthorized');
    return;
  }

  next();
};

module.exports = authAndPayApi;
