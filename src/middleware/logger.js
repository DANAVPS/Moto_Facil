import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const requestLogger = (req, res, next) => {
    const logEntry = `
        ${new Date().toISOString()}
        Método: ${req.method}
        Ruta: ${req.path}
        IP: ${req.ip}
        User-Agent: ${req.get('User-Agent')}
        ----------------------------------------
    `;

    fs.appendFile(
        path.join(__dirname, '../logs/requests.log'),
        logEntry,
        (err) => { if (err) console.error('Error escribiendo log:', err) }
    );

    next();
};