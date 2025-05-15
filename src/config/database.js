const databaseConfig = {
    mysql: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'motofacil',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: 'local'
    },
    // Configuración para migraciones y semillas (opcional)
    migrations: {
        tableName: 'migrations',
        directory: './database/migrations'
    },
    seeds: {
        directory: './database/seeds'
    }
};

export default databaseConfig;