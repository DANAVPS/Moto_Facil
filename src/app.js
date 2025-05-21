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
import { verifyConnection } from './database/connection.js';
import { globalErrorHandler } from './helper/errorhandler.js';

// Importaciones de rutas
// API Routes
import authRoutes from './routes/api/auth.routes.js';
import blogRoutes from './routes/api/blog.routes.js';
import motoRoutes from './routes/api/moto.routes.js';
import userRoutes from './routes/api/user.routes.js';

// Web Routes
import webMotoRoutes from './routes/web/moto.routes.js';
import webUsersRoutes from './routes/web/users.routes.js';
import notFoundRoutes from './routes/404.routes.js';

// Crear aplicación Express
const app = express();

// 1. Configuración del motor de vistas
app.set('view engine', 'pug'); // Usando EJS como motor de plantillas
app.set('views', path.join(__dirname, './views')); // Directorio de vistas

// 2. Middlewares globales
app.use(cors(config.cors)); // Configuración CORS
app.use(helmet({
    contentSecurityPolicy: false, // Para desarrollo, ajustar en producción
})); // Seguridad HTTP
app.use(morgan('dev')); // Logging de requests
app.use(express.json({ limit: '10kb' })); // Parsear JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parsear URL encoded
app.use(cookieParser()); // Parsear cookies

// 3. Subida de archivos
app.use(fileUpload({
    useTempFiles: false,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    abortOnLimit: true,
    createParentPath: true
}));

// 4. Servir archivos estáticos
// app.use('/uploads', express.static(path.join(__dirname, './public/uploads')));
app.use('/assets', express.static(path.join(__dirname, './public/assets')));
app.use(express.static(path.join(__dirname, '../public')));
app.set('views', path.join(__dirname, '../views')); // <-- sube un nivel
app.use(express.urlencoded({ extended: true })); // Para leer formularios tipo x-www-form-urlencoded



// 5. Limitar peticiones (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
    message: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente más tarde'
});
app.use('/api', limiter);

// 6. Rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/motos', motoRoutes);
app.use('/api/v1/users', userRoutes);

// 7. Rutas Web
app.use('/motos', webMotoRoutes);
app.use('/', webUsersRoutes);

// 8. Documentación API
app.use(config.api.documentationPath, express.static(path.join(__dirname, '../docs')));

// 9. Manejo de rutas no encontradas
app.use(notFoundRoutes);

// 10. Manejo global de errores
app.use(globalErrorHandler);

// 11. Iniciar servidor
const startServer = async () => {
    try {
        // Conectar a la base de datos
        await verifyConnection();

        // Iniciar servidor
        app.listen(config.app.port, () => {
            console.log(`🚀 Servidor ${config.app.name} corriendo en puerto ${config.app.port}`);
            console.log(`📚 Documentación API: http://localhost:${config.app.port}${config.api.documentationPath}`);
            console.log(`🏠 Sitio web: http://localhost:${config.app.port}`);
        });
    } catch (error) {
        console.error('❌ No se pudo iniciar la aplicación:', error);
        process.exit(1);
    }
};

// Iniciar la aplicación
startServer();

export default app;