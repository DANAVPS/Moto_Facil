import Blog from '../database/models/blog.js';
import { AppError } from '../helper/errorhandler.js';

const blogController = {
    // Obtener todos los blogs publicados
    getAllBlogs: async (req, res, next) => {
        try {
            const { category, limit = 10, page = 1 } = req.query;

            const blogs = await Blog.findAll({
                category,
                limit: parseInt(limit),
                page: parseInt(page)
            });

            res.json({
                status: 'success',
                results: blogs.length,
                data: { blogs }
            });

        } catch (error) {
            next(error);
        }
    },

    // Obtener blog por slug
    getBlogBySlug: async (req, res, next) => {
        try {
            const blog = await Blog.findBySlug(req.params.slug);

            if (!blog) {
                throw new AppError('No se encontró el blog con ese slug', 404);
            }

            res.json({
                status: 'success',
                data: { blog }
            });

        } catch (error) {
            next(error);
        }
    },

    // Crear nuevo blog (solo admin/editor)
    createBlog: async (req, res, next) => {
        try {
            const { title, content, excerpt, category } = req.body;

            if (!req.file) {
                throw new AppError('Por favor sube una imagen destacada', 400);
            }

            const newBlog = await Blog.create({
                title,
                content,
                excerpt,
                authorId: req.user.id,
                category,
                featuredImage: req.file.filename
            });

            res.status(201).json({
                status: 'success',
                data: { blog: newBlog }
            });

        } catch (error) {
            next(error);
        }
    },

    // Publicar blog (solo admin/editor)
    publishBlog: async (req, res, next) => {
        try {
            await Blog.publish(req.params.id);

            const publishedBlog = await Blog.findById(req.params.id);

            res.json({
                status: 'success',
                data: { blog: publishedBlog }
            });

        } catch (error) {
            next(error);
        }
    },

    // Actualizar blog (solo admin/editor)
    updateBlog: async (req, res, next) => {
        try {
            const { title, content, excerpt, category } = req.body;

            const updateData = { title, content, excerpt, category };

            if (req.file) {
                updateData.featured_image = req.file.filename;
            }

            await Blog.update(req.params.id, updateData);

            const updatedBlog = await Blog.findById(req.params.id);

            res.json({
                status: 'success',
                data: { blog: updatedBlog }
            });

        } catch (error) {
            next(error);
        }
    },

    // Eliminar blog (solo admin/editor)
    deleteBlog: async (req, res, next) => {
        try {
            await Blog.delete(req.params.id);

            res.status(204).json({
                status: 'success',
                data: null
            });

        } catch (error) {
            next(error);
        }
    }
};

export default blogController;