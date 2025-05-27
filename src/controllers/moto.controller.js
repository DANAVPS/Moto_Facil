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
            const { category, minPrice, maxPrice, transmission, query, limit = 10, page = 1 } = req.query;

            // Construir los filtros para la consulta a la base de datos
            const filters = {};
            if (category) filters.category = category;
            if (transmission) filters.transmission = transmission;
            if (minPrice) filters.minPrice = parseFloat(minPrice);
            if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

            // Si hay un query de búsqueda, puedes pasarlo a tu método findAll o search
            // Dependiendo de cómo lo maneje tu modelo `Moto`.
            // Por simplicidad, aquí lo incluyo en los filtros que se pasan a `findAll`.
            if (query) filters.query = query;

            const motos = await Moto.findAll({
                ...filters, // Pasa los filtros construidos
                limit: parseInt(limit),
                page: parseInt(page)
            });

            // Puedes obtener todas las categorías y transmisiones disponibles para los filtros en la vista
            // Esto es opcional, pero mejora la experiencia del usuario.
            const allCategories = await Moto.getDistinctCategories(); // Necesitarás implementar este método en tu modelo
            const allTransmissions = await Moto.getDistinctTransmissions(); // Necesitarás implementar este método en tu modelo


            // Renderiza la vista 'users/motos.pug' y pasa la lista de motos y los filtros activos
            res.render('users/motos', {
                motos: motos,
                currentCategory: category || '', // Para marcar el filtro activo en la UI
                currentTransmission: transmission || '',
                currentMinPrice: minPrice || '',
                currentMaxPrice: maxPrice || '',
                allCategories: allCategories, // Pasa las categorías para el filtro
                allTransmissions: allTransmissions // Pasa las transmisiones para el filtro
            });

        } catch (error) {
            console.error('Error al obtener todas las motos para la vista:', error);
            next(error); // Pasa el error al middleware de manejo de errores
        }
    },

    // Obtener una moto por ID
    getMotoById: async (req, res, next) => {
        try {
            const moto = await Moto.findById(req.params.id);

            if (!moto) {
                // Si la moto no se encuentra, renderiza una página de error 404
                // Asegúrate de tener una vista '404.pug' o la que uses para errores.
                return res.status(404).render('404', { message: 'La moto que buscas no fue encontrada.' });
            }

            // Renderiza la vista 'infomoto.pug' y pasa el objeto 'moto'
            res.render('users/infomoto', { moto: moto });

        } catch (error) {
            console.error('Error al obtener la moto por ID para la vista:', error);
            // Pasa el error al middleware de manejo de errores si lo tienes configurado,
            // o renderiza una página de error genérica.
            next(error);
            // O directamente: res.status(500).render('error', { message: 'Error interno del servidor al cargar la moto.' });
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
    },
    // Eliminar tecnología de moto
    removeTechnologyFromMoto: async (req, res, next) => {
        try {
            const { techId } = req.params;
            await Moto.removeTechnology(req.params.id, techId);

            res.status(204).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    },
    // Buscar motos
    searchMotos: async (req, res, next) => {
        try {
            const { query } = req.query;

            const motos = await Moto.search(query);

            res.json({
                status: 'success',
                results: motos.length,
                data: { motos }
            });

        } catch (error) {
            next(error);
        }
    }
};

export default motoController;