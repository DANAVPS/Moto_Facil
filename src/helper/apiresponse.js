export const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

export const errorResponse = (res, message = 'Error en la operación', statusCode = 400, errors = null) => {
    res.status(statusCode).json({
        success: false,
        message,
        errors: errors?.array?.() || errors
    });
};

export const paginatedResponse = (res, data, pagination, message = 'Datos obtenidos') => {
    res.status(200).json({
        success: true,
        message,
        data,
        pagination
    });
};