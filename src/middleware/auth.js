import jwt from 'jsonwebtoken';
import { AppError } from '../helper/errorhandler.js';
import User from '../database/models/user.js';

export const auth = async (req, res, next) => {
    try {
        // 1. Obtener token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new AppError(401, 'Acceso no autorizado, token no proporcionado');
        }

        // 2. Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Buscar usuario
        const user = await User.findOne({
            _id: decoded.id,
            'tokens.token': token
        });

        if (!user) {
            throw new AppError(401, 'Usuario no encontrado');
        }

        // 4. Adjuntar usuario y token al request
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        next(new AppError(401, 'Por favor autentícate'));
    }
};

// Middleware para roles de administrador
export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        next(new AppError(403, 'Acceso denegado, se requieren privilegios de administrador'));
    }
};