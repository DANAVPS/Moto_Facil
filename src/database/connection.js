import mysql from 'mysql2/promise';
import { AppError } from '../helper/errorhandler.js';

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'motofacil',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'local'
});

// Verificar conexión al iniciar
const verifyConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a MySQL correctamente');
        connection.release();
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        throw new AppError('Error al conectar con la base de datos', 500);
    }
};

// Ejecutar consultas con manejo de errores
const query = async (sql, values) => {
    try {
        const [rows] = await pool.execute(sql, values);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error.message);
        throw new AppError('Error en la operación de base de datos', 500);
    }
};

export { pool, verifyConnection, query };
