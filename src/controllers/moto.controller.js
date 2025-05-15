import path from 'path';
import { fileURLToPath } from 'url';
import Moto from '../database/models/moto.js';
import { AppError } from '../helper/errorhandler.js';

// Configuración para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const motoController = {
    // Obtener todas las motos
    getAllMotos: async (req, res, next) => {
        try {
            const { category, minPrice, maxPrice, limit = 10, page = 1 } = req.query;

            const motos = await Moto.findAll({
                category,
                minPrice: parseFloat(minPrice),
                maxPrice: parseFloat(maxPrice),
                limit: parseInt(limit),
                page: parseInt(page)
            });

            res.json({
                status: 'success',
                results: motos.length,
                data: { motos }
            });

        } catch (error) {
            next(error);
        }
    },

    // Obtener una moto por ID
    getMotoById: async (req, res, next) => {
        try {
            const moto = await Moto.findById(req.params.id);

            if (!moto) {
                throw new AppError('No se encontró la moto con ese ID', 404);
            }

            res.json({
                status: 'success',
                data: { moto }
            });

        } catch (error) {
            next(error);
        }
    },



    // Crear una nueva moto (solo admin)
    createMoto: async (req, res, next) => {
        try {
            const { brand, model, price, category, engineCc, transmission, description } = req.body;

            // Validación del archivo
            if (!req.file) {
                throw new AppError('Por favor sube una imagen principal', 400);
            }

            const mainImage = req.file;
            const uploadPath = path.join(__dirname, '../public/uploads', mainImage.originalname);

            // Mover el archivo
            await mainImage.mv(uploadPath);

            const newMoto = await Moto.create({
                brand,
                model,
                price: parseFloat(price),
                category,
                engineCc: parseInt(engineCc),
                transmission,
                description,
                mainImage: `/uploads/${mainImage.originalname}`
            });

            res.status(201).json({
                status: 'success',
                data: { moto: newMoto }
            });

        } catch (error) {
            next(error);
        }
    },

    // Actualizar una moto (solo admin)
    updateMoto: async (req, res, next) => {
        try {
            const { brand, model, price, category, engineCc, transmission, description } = req.body;

            const updateData = {
                brand,
                model,
                price: parseFloat(price),
                category,
                engine_cc: parseInt(engineCc),
                transmission,
                description
            };

            if (req.files?.mainImage) {
                const mainImage = req.files.mainImage;
                const uploadPath = path.join(__dirname, '../public/uploads', mainImage.name);
                await mainImage.mv(uploadPath);
                updateData.main_image = `/uploads/${mainImage.name}`;
            }

            await Moto.update(req.params.id, updateData);
            const updatedMoto = await Moto.findById(req.params.id);

            res.json({
                status: 'success',
                data: { moto: updatedMoto }
            });

        } catch (error) {
            next(error);
        }
    },

    // Eliminar una moto (solo admin)
    deleteMoto: async (req, res, next) => {
        try {
            await Moto.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    },

    // Añadir imagen adicional a moto
    addMotoImages: async (req, res, next) => {
        try {
            if (!req.files || req.files.length === 0) {
                throw new AppError('Por favor sube al menos una imagen', 400);
            }

            const uploadedPaths = [];

            for (const file of req.files) {
                const uploadPath = path.join(__dirname, '../public/uploads', file.originalname);
                await file.mv(uploadPath);
                await Moto.addImage(req.params.id, `/uploads/${file.originalname}`);
                uploadedPaths.push(`/uploads/${file.originalname}`);
            }

            res.status(201).json({
                status: 'success',
                data: { images: uploadedPaths }
            });

        } catch (error) {
            next(error);
        }
    },


    // Añadir tecnología a moto
    addTechnologyToMoto: async (req, res, next) => {
        try {
            const { technologyId } = req.body;
            await Moto.addTechnology(req.params.id, technologyId);

            res.status(201).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    }
};

export default motoController;