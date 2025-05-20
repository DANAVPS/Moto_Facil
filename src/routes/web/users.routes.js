import express from 'express';
import userController from '../../controllers/user.controller.js';
import authController from '../../controllers/auth.controller.js';
import blogController from '../../controllers/blog.controller.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Página de inicio
router.get('/', (req, res) => {
    // Podríamos obtener motos destacadas y blogs recientes para mostrar en el home
    res.render('users/inicio', {
        title: 'MotoApp - Tu comunidad de motocicletas',
        user: req.user || null
    });
});

router.get('/Tecnologias', (req, res) => {
    // Podríamos obtener motos destacadas y blogs recientes para mostrar en el home
    res.render('users/tecnologias', {
        title: 'MotoApp - Tu comunidad de motocicletas',
        user: req.user || null
    });
});

router.get('/Contacto', (req, res) => {
    // Podríamos obtener motos destacadas y blogs recientes para mostrar en el home
    res.render('users/contacto', {
        title: 'MotoApp - Tu comunidad de motocicletas',
        user: req.user || null
    });
});

// Rutas de autenticación (web)
// Página de login
router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('auth/login', {
        title: 'Iniciar Sesión',
        user: null
    });
});

// Página de registro
router.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('auth/register', {
        title: 'Crear Cuenta',
        user: null
    });
});

// Procesar formulario de login
router.post('/login', (req, res, next) => {
    authController.login(req, res, (err, user) => {
        if (err) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión',
                error: err.message || 'Error al iniciar sesión',
                user: null
            });
        }

        res.redirect('/profile');
    });
});

// Procesar formulario de registro
router.post('/register', (req, res, next) => {
    authController.register(req, res, (err, user) => {
        if (err) {
            return res.render('auth/register', {
                title: 'Crear Cuenta',
                error: err.message || 'Error al crear la cuenta',
                user: null
            });
        }

        res.redirect('/profile');
    });
});

// Cerrar sesión
router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
});

// Rutas protegidas (requieren autenticación)
// Perfil de usuario
router.get('/profile', auth, (req, res) => {
    res.render('users/profile', {
        title: 'Mi Perfil',
        user: req.user
    });
});

// Editar perfil
router.get('/profile/edit', auth, (req, res) => {
    res.render('users/edit', {
        title: 'Editar Perfil',
        user: req.user
    });
});

// Procesar formulario de edición de perfil
router.post('/profile/update', auth, (req, res) => {
    userController.updateMe(req, res, (err, user) => {
        if (err) {
            return res.render('users/edit', {
                title: 'Editar Perfil',
                error: err.message || 'Error al actualizar el perfil',
                user: req.user
            });
        }

        res.redirect('/profile');
    });
});

// Motocicletas favoritas
router.get('/favorites', auth, (req, res) => {
    userController.getFavorites(req, res, (err, favorites) => {
        if (err) {
            return res.status(500).render('error', {
                message: 'Error al cargar favoritos',
                error: err
            });
        }

        res.render('users/favorites', {
            title: 'Mis Motocicletas Favoritas',
            favorites: favorites || [],
            user: req.user
        });
    });
});

// Sección de blogs
router.get('/blog', (req, res) => {
    blogController.getAllBlogs(req, res, (err, blogs) => {
        if (err) {
            return res.status(500).render('error', {
                message: 'Error al cargar el blog',
                error: err
            });
        }

        res.render('blog/index', {
            title: 'Blog de Motocicletas',
            blogs: blogs || [],
            user: req.user || null
        });
    });
});

// Ver artículo individual del blog
router.get('/blog/:slug', (req, res, next) => {
    blogController.getBlogBySlug(req, res, (err, blog) => {
        if (err) return next(err);

        if (!blog) {
            return res.status(404).render('404', {
                message: 'Artículo no encontrado'
            });
        }

        res.render('blog/detail', {
            title: blog.title || 'Artículo del Blog',
            blog,
            user: req.user || null
        });
    });
});

// Panel de administración (solo para administradores)
router.get('/admin', auth, (req, res, next) => {
    // Verificar si el usuario es administrador
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).render('error', {
            message: 'Acceso denegado',
            error: { status: 403, stack: 'No tienes permisos para acceder a esta página' }
        });
    }

    res.render('admin/dashboard', {
        title: 'Panel de Administración',
        user: req.user
    });
});

// Página de contacto
router.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contacto',
        user: req.user || null
    });
});

// Página de acerca de
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'Acerca de Nosotros',
        user: req.user || null
    });
});

export default router;