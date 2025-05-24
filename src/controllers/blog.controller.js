import Blog from '../database/models/blog.js';
import { AppError } from '../helper/errorhandler.js';
import { query } from '../database/connection.js';


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
    // Obtener blogs
    async getBlogBySlug(req, res) {
        try {
            const [blogs] = await query('SELECT * FROM blogs ORDER BY created_at DESC');
            res.render('users/blogs', { blogs });
        } catch (error) {
            console.error('Error al obtener blogs:', error);
            res.status(500).send('Error interno del servidor');
        }
    },

    // Crear blog (POST)
    async createBlog(req, res) {
        try {
            const { title, content, excerpt, authorId, category, featuredImage } = req.body;

            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const result = await query(
                `INSERT INTO blogs 
                (title, slug, content, excerpt, author_id, featured_image, category) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title, slug, content, excerpt, authorId, category, featuredImage]
            );

            res.redirect('/blog');
        } catch (error) {
            console.error('Error al crear blog:', error);
            res.status(500).send('Error al crear el blog');
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