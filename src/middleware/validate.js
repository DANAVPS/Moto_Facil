import { validationResult, body } from 'express-validator';
import { AppError } from '../helper/errorhandler.js';

// Validador genérico
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

export const validateUser = validate([
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
]);
