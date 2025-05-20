import express from 'express';
import motoController from '../../controllers/moto.controller.js';
import { auth } from '../../middleware/auth.js';
// import AppError from '../../helper/errorhandler.js';
import { AppError } from '../../helper/errorhandler.js';
const router = express.Router();

// Vista del catálogo de motos
router.get('/', (req, res) => {
    motoController.getAllMotos(req, res, (err, motos) => {
        if (err) return res.status(500).render('error', {
            message: 'Error al cargar el catálogo de motos',
            error: err
        });

        res.render('motos/index', {
            title: 'Catálogo de Motocicletas',
            motos: motos || [],
            user: req.user || null
        });
    });
});

// Vista del formulario de creación (protegida)
router.get('/new', auth, (req, res) => {
    res.render('motos/create', {
        title: 'Crear Nueva Motocicleta',
        user: req.user
    });
});

// Vista de detalle de moto
router.get('/:id', (req, res, next) => {
    motoController.getMotoById(req, res, (err, moto) => {
        if (err) return next(err);

        if (!moto) {
            return res.status(404).render('404', {
                message: 'Motocicleta no encontrada'
            });
        }

        res.render('motos/detail', {
            title: moto.name || 'Detalle de Motocicleta',
            moto,
            user: req.user || null
        });
    });
});

// Vista de edición (protegida)
router.get('/:id/edit', auth, (req, res, next) => {
    motoController.getMotoById(req, res, (err, moto) => {
        if (err) return next(err);

        if (!moto) {
            return res.status(404).render('404', {
                message: 'Motocicleta no encontrada'
            });
        }

        res.render('motos/edit', {
            title: `Editar ${moto.name || 'Motocicleta'}`,
            moto,
            user: req.user
        });
    });
});

// Procesar formulario de creación (POST)
router.post('/', auth, (req, res, next) => {
    if (!req.files || !req.files.mainImage) {
        return next(new AppError('Por favor sube una imagen principal', 400));
    }

    // Pasar el archivo al controlador
    req.body.mainImage = req.files.mainImage;

    motoController.createMoto(req, res);
});

// Procesar formulario de edición (POST)
router.post('/:id/update', auth, (req, res, next) => {
    if (req.files && req.files.mainImage) {
        req.body.mainImage = req.files.mainImage;
    }

    motoController.updateMoto(req, res);
});

// Agregar imágenes adicionales
router.post('/:id/images', auth, (req, res, next) => {
    if (!req.files || !req.files.images) {
        return next(new AppError('Por favor sube al menos una imagen', 400));
    }

    req.body.images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

    motoController.addMotoImages(req, res);
});

// Eliminar moto
router.post('/:id/delete', auth, (req, res) => {
    motoController.deleteMoto(req, res);
});

export default router;