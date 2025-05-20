import { validationResult, body } from 'express-validator';
import { AppError } from '../helper/errorhandler.js';

// Validador genérico
// Este validador se puede usar para cualquier ruta que necesite validación
export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        next(new AppError('Datos inválidos', 400, errors.array()));
    };
};

// Esquemas de validación específicos
export const validateMoto = validate([
    body('marca').notEmpty().withMessage('La marca es requerida'),
    body('modelo').notEmpty().withMessage('El modelo es requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('categoria').isIn(['urbana', 'deportiva', 'todo-terreno', 'adventure', 'scooter'])
        .withMessage('Categoría inválida')
]);
// Validación para el registro de usuario
export const validateRegister = validate([
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('telefono').notEmpty().withMessage('El teléfono es requerido')
]);

// Validación para el inicio de sesión
export const validateLogin = validate([
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
]);