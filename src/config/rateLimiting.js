const rateLimitingConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.RATE_LIMIT_MAX || 100, // Límite por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente más tarde'
};

export default rateLimitingConfig;