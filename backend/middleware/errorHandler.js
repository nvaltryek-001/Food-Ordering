export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found", path: req.originalUrl });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (process.env.NODE_ENV !== "production") console.error(error);
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === "production" ? "Internal server error" : (error.message || "Internal server error")
  });
}
