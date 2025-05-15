const corsConfig = {
    origin: [
        process.env.CLIENT_URL || 'http://localhost:8080',
        'https://motofacil.com',
        'https://www.motofacil.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: [
        'Content-Range',
        'X-Total-Count'
    ],
    credentials: true,
    maxAge: 86400 // 24 horas
};

export default corsConfig;