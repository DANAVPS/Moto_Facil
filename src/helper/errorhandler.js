export class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log del error completo en desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR 💥', {
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    // Respuesta al cliente
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
    });
};