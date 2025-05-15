import { query } from '../connection.js';

class Blog {
    // Obtener todos los blogs
    static async findAll({ category, limit = 10, page = 1 }) {
        let sql = `
            SELECT b.*, u.name as author_name 
            FROM blogs b
            JOIN users u ON b.author_id = u.id
            WHERE published_at IS NOT NULL
        `;
        const values = [];

        if (category) {
            sql += ' AND category = ?';
            values.push(category);
        }

        sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
        values.push(limit, (page - 1) * limit);

        return await query(sql, values);
    }

    // Obtener por slug
    static async findBySlug(slug) {
        const [blog] = await query(`
            SELECT b.*, u.name as author_name 
            FROM blogs b
            JOIN users u ON b.author_id = u.id
            WHERE b.slug = ?
        `, [slug]);

        return blog;
    }

    // Crear nuevo blog
    static async create({ title, content, excerpt, authorId, category, featuredImage }) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await query(
            `INSERT INTO blogs 
            (title, slug, content, excerpt, author_id, category, featured_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, content, excerpt, authorId, category, featuredImage]
        );

        return result.insertId;
    }

    // Publicar blog
    static async publish(blogId) {
        await query(
            'UPDATE blogs SET published_at = CURRENT_TIMESTAMP WHERE id = ?',
            [blogId]
        );
    }
}

export default Blog;