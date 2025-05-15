const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        name: 'MotoFacil API'
    },
    api: {
        prefix: '/api/v1',
        version: '1.0.0',
        documentationPath: '/api-docs'
    },
    client: {
        url: process.env.CLIENT_URL || 'http://localhost:8080'
    }
};

export default config;