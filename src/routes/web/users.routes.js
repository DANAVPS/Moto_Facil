import express from 'express';
import {enviarFormularioContacto} from '../../controllers/contacto.controller.js';
import { recibirAsesoria, mostrarDetallesMoto } from '../../controllers/asesoria.controller.js';
import motoController from '../../controllers/moto.controller.js';

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
router.post('/enviar-contacto', enviarFormularioContacto);


router.get('/Asesoria', (req, res) => {
    // Podríamos obtener motos destacadas y blogs recientes para mostrar en el home
    res.render('users/Asesoria', {
        title: 'MotoApp - Tu comunidad de motocicletas',
        user: req.user || null
    });
});
router.post('/Asesoria', recibirAsesoria);

router.get('/motos/:id', mostrarDetallesMoto);

router.get('/motos', (req, res) => {
    // Podríamos obtener motos destacadas y blogs recientes para mostrar en el home
    res.render('users/motos', {
        title: 'MotoApp - Tu comunidad de motocicletas',
        user: req.user || null
    });
});
router.post('/motos', motoController.getAllMotos);

// Página de acerca de
router.get('/Multimedia', (req, res) => {
    res.render('users/multimedia', {
        title: 'Acerca de Nosotros',
        user: req.user || null
    });
});

export default router;

// import userController from '../../controllers/user.controller.js';
// import authController from '../../controllers/auth.controller.js';
// import blogController from '../../controllers/blog.controller.js';
// import { auth } from '../../middleware/auth.js';
// // Sección de blogs
// router.get('/blog', (req, res) => {
//     blogController.getAllBlogs(req, res, (err, blogs) => {
//         if (err) {
//             return res.status(500).render('error', {
//                 message: 'Error al cargar el blog',
//                 error: err
//             });
//         }

//         res.render('users/blogs', {
//             title: 'Blog de Motocicletas',
//             blogs: blogs || [],
//             user: req.user || null
//         });
//     });
// });


// // Ver artículo individual del blog
// router.get('/blog/:slug', (req, res, next) => {
//     blogController.getBlogBySlug(req, res, (err, blog) => {
//         if (err) return next(err);

//         if (!blog) {
//             return res.status(404).render('404', {
//                 message: 'Artículo no encontrado'
//             });
//         }

//         res.render('blog/detail', {
//             title: blog.title || 'Artículo del Blog',
//             blog,
//             user: req.user || null
//         });
//     });
// });
// // Mostrar blogs
// router.get('/blog', blogController.getBlogBySlug);

// // Crear blog (desde un formulario o API)
// router.post('/blog', blogController.createBlog);