import express from 'express';
import authRoutes from '../api/auth.routes.js';
import motoRoutes from '../api/moto.routes.js';
import userRoutes from '../api/user.routes.js';
import blogRoutes from '../api/blog.routes.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */
router.use('/auth', authRoutes);

/**
 * @swagger
 * tags:
 *   name: Motos
 *   description: Operaciones con motocicletas
 */
router.use('/motos', motoRoutes);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Operaciones con usuarios
 */
router.use('/users', userRoutes);

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Artículos del blog
 */
router.use('/blogs', blogRoutes);

/**
 * @swagger
 * tags:
 *   name: API
 *   description: Operaciones generales de la API
 */
router.use('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running'
    });
});

export default router;