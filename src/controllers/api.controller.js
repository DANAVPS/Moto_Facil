import { AppError } from '../helper/errorhandler.js';
import Moto from '../database/models/moto.js';
import Blog from '../database/models/blog.js';
import User from '../database/models/user.js';

const apiController = {
    // Búsqueda global
    search: async (req, res, next) => {
        try {
            const { q } = req.query;

            if (!q || q.length < 3) {
                throw new AppError('La búsqueda debe tener al menos 3 caracteres', 400);
            }

            const [motos, blogs] = await Promise.all([
                Moto.search(q),
                Blog.search(q)
            ]);

            res.json({
                status: 'success',
                data: {
                    motos,
                    blogs
                }
            });

        } catch (error) {
            next(error);
        }
    },

    // Estadísticas generales
    getStats: async (req, res, next) => {
        try {
            const [motoCount, userCount, blogCount] = await Promise.all([
                Moto.getCount(),
                User.getCount(),
                Blog.getCount()
            ]);

            res.json({
                status: 'success',
                data: {
                    stats: {
                        motos: motoCount,
                        users: userCount,
                        blogs: blogCount
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }
};

export default apiController;