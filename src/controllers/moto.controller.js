import path from 'path';
import { fileURLToPath } from 'url';
import Moto from '../database/models/moto.js';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const motoController = {
    // Mostrar todas las motos (ruta: /motos)
    getAllMotos: async (req, res, next) => {
        try {
            console.log('🚀 Accediendo a /motos');
            console.log('Query params:', req.query);
            const {
                category,
                transmission,
                minPrice,
                maxPrice,
                limit = 12,
                page = 1
            } = req.query;

            console.log('Query params recibidos:', req.query);

            const filters = {
                limit: parseInt(limit) || 12,
                page: parseInt(page) || 1
            };

            if (category) filters.category = category;
            if (transmission) filters.transmission = transmission;
            if (minPrice && !isNaN(parseFloat(minPrice))) filters.minPrice = parseFloat(minPrice);
            if (maxPrice && !isNaN(parseFloat(maxPrice))) filters.maxPrice = parseFloat(maxPrice);
            console.log('Filtros enviados al modelo:', filters);

            const [motos, allTransmissions, allCategories] = await Promise.all([
                Moto.findAll(filters),
                Moto.getDistinctTransmissions(),
                Moto.getDistinctCategories()
            ]);

            console.log('Motos obtenidas:', motos.length);

            res.render('users/motos', {
                title: 'Catálogo de Motocicletas',
                motos,
                allTransmissions,
                allCategories,
                currentTransmission: transmission || '',
                currentCategory: category || '',
                user: req.user || null
            });
            console.log('✅ Vista renderizada correctamente');
        } catch (err) {
            console.error('Error al obtener todas las motos para la vista:', err);
            next(err);
        }
    },

    // Filtrar por categoría específica (rutas: /motos/todoterreno, /motos/deportivas, etc.)
    getMotosByCategory: async (req, res, next) => {
        try {
            const { category } = req.params;
            const { limit = 12, page = 1 } = req.query;

            // Mapeo de URLs a nombres de categorías en la base de datos
            const categoryMap = {
                'automaticassemiautomaticas': 'scooter',
                'urbanastrabajo': 'urbana',
                'todoterreno': 'todo-terreno',
                'deportivas': 'deportiva',
                'adventure': 'adventure'
            };

            const categoryName = categoryMap[category];

            if (!categoryName) {
                return res.status(404).render('404', {
                    message: 'Categoría no encontrada.'
                });
            }

            const filters = {
                category: categoryName,
                limit: parseInt(limit) || 12,
                page: parseInt(page) || 1
            };

            const [motos, allTransmissions, allCategories] = await Promise.all([
                Moto.findAll(filters),
                Moto.getDistinctTransmissions(),
                Moto.getDistinctCategories()
            ]);

            res.render('users/motos', {
                title: `Motos ${categoryName}`,
                motos,
                allTransmissions,
                allCategories,
                currentTransmission: '',
                currentCategory: categoryName,
                user: req.user || null
            });
        } catch (error) {
            console.error('Error al obtener motos por categoría:', error);
            next(error);
        }
    },

    // Filtrar por transmisión (ruta: /motos/transmission/:transmission)
    getMotosByTransmission: async (req, res, next) => {
        try {
            const { transmission } = req.params;
            const { limit = 12, page = 1 } = req.query;

            const transmissionMap = {
                'manual': 'manual',
                'automaticas': 'automatic',
                'semi automaticas': 'semi-automatica',

            };

            const transmissionName = transmissionMap[transmission];

            if (!transmissionName) {
                return res.status(404).render('404', {
                    message: 'Categoría no encontrada.'
                });
            }

            const filters = {
                transmission,
                limit: parseInt(limit) || 12,
                page: parseInt(page) || 1
            };

            const [motos, allTransmissions, allCategories] = await Promise.all([
                Moto.findAll(filters),
                Moto.getDistinctTransmissions(),
                Moto.getDistinctCategories()
            ]);

            res.render('users/motos', {
                title: `Motos ${transmission.charAt(0).toUpperCase() + transmission.slice(1)}`,
                motos,
                allTransmissions,
                allCategories,
                currentTransmission: transmission,
                currentCategory: '',
                user: req.user || null
            });
        } catch (error) {
            console.error('Error al obtener motos por transmisión:', error);
            next(error);
        }
    },

    // Obtener moto por ID
    getMotoById: async (req, res, next) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).render('404', {
                    message: 'ID de moto inválido.'
                });
            }

            const moto = await Moto.findById(parseInt(id));

            if (!moto) {
                return res.status(404).render('404', {
                    message: 'La moto que buscas no fue encontrada.'
                });
            }

            res.render('users/infomoto', {
                title: `${moto.brand} ${moto.model}`,
                moto,
                user: req.user || null
            });

        } catch (error) {
            console.error('Error al obtener la moto por ID para la vista:', error);
            next(error);
        }
    }
};

export default motoController;