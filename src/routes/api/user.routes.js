import express from 'express';
import authController from '../../controllers/auth.controller.js';
import motoController from '../../controllers/moto.controller.js';
import userController from '../../controllers/user.controller.js';
import blogController from '../../controllers/blog.controller.js';
import apiController from '../../controllers/api.controller.js';

const router = express.Router();

// Autenticación
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Proteger todas las rutas siguientes
router.use(authController.protect);

// Perfil de usuario
router.get('/users/me', userController.getMe);
router.patch('/users/me', userController.updateMe);
router.delete('/users/me', userController.deleteMe);

// Favoritos
router.get('/users/favorites', userController.getFavorites);
router.post('/users/favorites/:motoId', userController.addFavorite);
router.delete('/users/favorites/:motoId', userController.removeFavorite);

// Motos
router.get('/motos', motoController.getAllMotos);
router.get('/motos/:id', motoController.getMotoById);

// Restringir las siguientes rutas a admin
router.use(authController.restrictTo('admin'));

router.post('/motos', motoController.createMoto);
router.patch('/motos/:id', motoController.updateMoto);
router.delete('/motos/:id', motoController.deleteMoto);
router.post('/motos/:id/images', motoController.addMotoImages);
router.post('/motos/:id/technologies', motoController.addTechnologyToMoto);

// Blogs
router.get('/blogs', blogController.getAllBlogs);
router.get('/blogs/:slug', blogController.getBlogBySlug);
router.post('/blogs', blogController.createBlog);
router.patch('/blogs/:id/publish', blogController.publishBlog);
router.patch('/blogs/:id', blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);

// API General
router.get('/search', apiController.search);
router.get('/stats', apiController.getStats);

export default router;