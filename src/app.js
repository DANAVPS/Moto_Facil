import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';

// Configuración de rutas ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importaciones de configuración
import config from './config/config.js';
import { connectDB } from './database/connection.js';
import { globalErrorHandler } from './helper/errorhandler.js';

// Importaciones de rutas
import apiRoutes from './routes/api/user.routes.js';
import webRoutes from './routes/web/users.routes.js';

// Crear aplicación Express
const app = express();

// 1. Middlewares globales
app.use(cors(config.cors)); // Configuración CORS
app.use(helmet()); // Seguridad HTTP
app.use(morgan('dev')); // Logging de requests
app.use(express.json({ limit: '10kb' })); // Parsear JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parsear URL encoded
app.use(cookieParser()); // Parsear cookies

// 2. Subida de archivos
app.use(fileUpload({
    useTempFiles: false,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    abortOnLimit: true,
    createParentPath: true
}));

// 3. Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// 4. Limitar peticiones (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
    message: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente más tarde'
});
app.use('/api', limiter);

// 5. Rutas
app.use('/api/v1', apiRoutes); // API Routes
app.use('/', webRoutes); // Web Routes

// 6. Manejo de rutas no encontradas
app.all('*', (req, res, next) => {
    next(new AppError(`No se pudo encontrar ${req.originalUrl} en este servidor`, 404));
});

// 7. Manejo global de errores
app.use(globalErrorHandler);

// 8. Iniciar servidor
const startServer = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();

        // Iniciar servidor
        app.listen(config.app.port, () => {
            console.log(`🚀 Servidor ${config.app.name} corriendo en puerto ${config.app.port}`);
            console.log(`📚 Documentación API: http://localhost:${config.app.port}${config.api.documentationPath}`);
        });

    } catch (error) {
        console.error('❌ No se pudo iniciar la aplicación:', error);
        process.exit(1);
    }
};

// Iniciar la aplicación
startServer();

export default app;