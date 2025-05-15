export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof ErrorHandler) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            details: err.details || undefined
        });
    }

    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
};