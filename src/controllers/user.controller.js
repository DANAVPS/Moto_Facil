import User from '../database/models/user.js';
import { AppError } from '../helper/errorhandler.js';

const userController = {
    // Obtener perfil del usuario actual
    getMe: async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);

            res.json({
                status: 'success',
                data: { user }
            });

        } catch (error) {
            next(error);
        }
    },

    //
    registerUser: async (req, res, next) => {
        try {
            const { name, email, password } = req.body;

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new AppError('El email ya está registrado', 400);
            }

            const newUser = await User.create({ name, email, password });

            res.status(201).json({
                status: 'success',
                data: { user: newUser }
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar perfil
    updateMe: async (req, res, next) => {
        try {
            const { name, email } = req.body;

            // Validar si el nuevo email ya existe
            if (email) {
                const existingUser = await User.findByEmail(email);
                if (existingUser && existingUser.id !== req.user.id) {
                    throw new AppError('El email ya está en uso', 400);
                }
            }

            await User.updateProfile(req.user.id, { name, email });

            const updatedUser = await User.findById(req.user.id);

            res.json({
                status: 'success',
                data: { user: updatedUser }
            });

        } catch (error) {
            next(error);
        }
    },

    // Eliminar cuenta
    deleteMe: async (req, res, next) => {
        try {
            await User.delete(req.user.id);

            res.status(204).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    },

    // Obtener motos favoritas
    getFavorites: async (req, res, next) => {
        try {
            const favorites = await User.getFavorites(req.user.id);

            res.json({
                status: 'success',
                results: favorites.length,
                data: { favorites }
            });

        } catch (error) {
            next(error);
        }
    },

    // Añadir a favoritos
    addFavorite: async (req, res, next) => {
        try {
            await User.addFavorite(req.user.id, req.params.motoId);

            res.status(201).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    },

    // Eliminar de favoritos
    removeFavorite: async (req, res, next) => {
        try {
            await User.removeFavorite(req.user.id, req.params.motoId);

            res.status(204).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    }
};

export default userController;