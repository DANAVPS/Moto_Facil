import express from 'express';
import motoController from '../../controllers/moto.controller.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', showMotoCatalog);
router.get('/new', auth, showCreateForm);
router.get('/:id', showMotoDetail);
router.get('/:id/edit', auth, showEditForm);

router.post('/', (req, res, next) => {
    if (!req.files || !req.files.image) {
        return next(new AppError('Por favor sube una imagen principal', 400));
    }

    // Pasar el archivo al controlador
    req.body.mainImage = req.files.image;
    next();
}, motoController.createMoto);

router.post('/:id/image', (req, res, next) => {
    if (!req.files || !req.files.images) {
        return next(new AppError('Por favor sube al menos una imagen', 400));
    }

    req.body.image = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
    next();
}, motoController.addMotoImage);

export default router;