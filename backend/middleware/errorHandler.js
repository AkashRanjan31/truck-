const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
