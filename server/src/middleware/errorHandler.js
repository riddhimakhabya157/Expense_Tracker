/**
 * Centralized error handling middleware.
 * Formats errors consistently without leaking database internals or stack traces.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line @typescript-eslint/no-unused-vars
  console.error('[API Error]', err.message);

  // JSON parsing error (e.g., malformed body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body',
    });
  }

  // SQLite constraint violations (e.g. CHECK constraint or NOT NULL)
  if (err.message && err.message.includes('CHECK constraint failed')) {
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation: supplied data did not satisfy schema invariants',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const clientMessage =
    statusCode >= 500
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Request failed';

  return res.status(statusCode).json({
    success: false,
    error: clientMessage,
  });
}

/**
 * 404 handler for undefined API routes
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
}
