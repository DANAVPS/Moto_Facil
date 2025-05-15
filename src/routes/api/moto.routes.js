import express from 'express';
import motoController from '../../controllers/moto.controller.js';
import authController from '../../controllers/auth.controller.js';
import { upload } from '../../helper/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', motoController.getAllMotos);  // <-- Faltaba esta ruta
router.get('/:id', motoController.getMotoById);
router.get('/search', motoController.searchMotos);

// Rutas protegidas
router.use(authController.protect);

// Rutas restringidas a admin
router.use(authController.restrictTo('admin'));

// Crear moto con imagen principal
router.post('/', upload.single('mainImage'), motoController.createMoto);

// Actualizar y eliminar moto
router.patch('/:id', motoController.updateMoto);
router.delete('/:id', motoController.deleteMoto);

// Añadir imágenes adicionales
router.post('/:id/images', upload.array('images'), motoController.addMotoImages);

// Tecnologías
router.post('/:id/technologies', motoController.addTechnologyToMoto);
router.delete('/:id/technologies/:techId', motoController.removeTechnologyFromMoto);


router.post('/', (req, res, next) => {
    if (!req.files || !req.files.image) {
        return next(new AppError('Por favor sube una imagen principal', 400));
    }

    // Pasar el archivo al controlador
    req.body.mainImage = req.files.image;
    next();
}, motoController.createMoto);

router.post('/:id/images', (req, res, next) => {
    if (!req.files || !req.files.images) {
        return next(new AppError('Por favor sube al menos una imagen', 400));
    }

    req.body.images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
    next();
}, motoController.addMotoImages);

export default router;