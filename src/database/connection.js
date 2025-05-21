import mysql from 'mysql2/promise';
import { AppError } from '../helper/errorhandler.js';

// Configuración del pool de conexiones para Filess.io
const pool = mysql.createPool({
    host: "imy25.h.filess.io",
    port: 3307,
    user: "MOTOFACIL_settingfox",
    password: "c627ef71f7d00a6e211bea91b499354e6230be59", // 👈 reemplaza por la real
    database: "MOTOFACIL_settingfox",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z' // o 'local' si lo prefieres
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
