import jwt from 'jsonwebtoken';
import User from '../database/models/user.js';
import { AppError } from '../helper/errorhandler.js';

const authController = {
    // Registro de usuario
    register: async (req, res, next) => {
        try {
            const { name, email, password } = req.body;

            // Validar si el usuario ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new AppError('El email ya está registrado', 400);
            }

            // Crear usuario
            const userId = await User.create({ name, email, password });

            // Generar token
            const token = jwt.sign(
                { id: userId, email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({
                status: 'success',
                token,
                data: { userId }
            });

        } catch (error) {
            next(error);
        }
    },

    // Login de usuario
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            // 1. Verificar si el usuario existe
            const user = await User.findByEmail(email);
            if (!user) {
                throw new AppError('Credenciales incorrectas', 401);
            }

            // 2. Verificar contraseña
            const isCorrect = await User.verifyPassword(password, user.password);
            if (!isCorrect) {
                throw new AppError('Credenciales incorrectas', 401);
            }

            // 3. Generar token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // 4. Enviar respuesta
            res.json({
                status: 'success',
                token,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    },

    // Proteger rutas
    protect: async (req, res, next) => {
        try {
            let token;

            // 1. Obtener token del header
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (!token) {
                throw new AppError('No estás autenticado. Por favor inicia sesión.', 401);
            }

            // 2. Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Verificar si el usuario aún existe
            const currentUser = await User.findByEmail(decoded.email);
            if (!currentUser) {
                throw new AppError('El usuario ya no existe.', 401);
            }

            // 4. Adjuntar usuario al request
            req.user = currentUser;
            next();

        } catch (error) {
            next(error);
        }
    },

    // Restringir a ciertos roles
    restrictTo: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return next(
                    new AppError('No tienes permiso para realizar esta acción', 403)
                );
            }
            next();
        };
    }
};

export default authController;