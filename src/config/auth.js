const authConfig = {
    jwt: {
        secret: process.env.JWT_SECRET || 'secret_key_motofacil',
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
        cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 30
    },
    password: {
        minLength: 8,
        resetTokenExpires: 3600000 // 1 hora en milisegundos
    },
    roles: {
        user: 'user',
        admin: 'admin',
        mechanic: 'mechanic'
    },
    oauth: { // Configuración opcional para OAuth
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
    }
};

export default authConfig;