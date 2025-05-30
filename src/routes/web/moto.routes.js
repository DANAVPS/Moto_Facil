import express from 'express';
import motoController from '../../controllers/moto.controller.js';

const router = express.Router();

// Ruta principal para mostrar todas las motos
router.get('/motos', motoController.getAllMotos);

// Rutas para categorías específicas (deben ir ANTES de la ruta con parámetro dinámico)
router.get('/motos/:category(automaticassemiautomaticas|urbanastrabajo|todoterreno|deportivas|superdeportivas|adventure)', motoController.getMotosByCategory);

// Ruta para filtrar por transmisión
router.get('/motos/transmission/:transmission', motoController.getMotosByTransmission);

// Ruta para obtener una moto específica por ID (debe ir al final)
router.get('/motos/:id', motoController.getMotoById);

export default router;