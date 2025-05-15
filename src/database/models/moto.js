import { query } from '../connection.js';

class Moto {
    // Obtener todas las motos
    static async findAll({ category, minPrice, maxPrice, limit = 10, page = 1 }) {
        let sql = 'SELECT * FROM motos WHERE 1=1';
        const values = [];

        if (category) {
            sql += ' AND category = ?';
            values.push(category);
        }

        if (minPrice) {
            sql += ' AND price >= ?';
            values.push(minPrice);
        }

        if (maxPrice) {
            sql += ' AND price <= ?';
            values.push(maxPrice);
        }

        sql += ' LIMIT ? OFFSET ?';
        values.push(limit, (page - 1) * limit);

        return await query(sql, values);
    }

    // Obtener por ID con imágenes y tecnologías
    static async findById(id) {
        const [moto] = await query('SELECT * FROM motos WHERE id = ?', [id]);

        if (!moto) return null;

        // Obtener imágenes adicionales
        moto.images = await query('SELECT image_url FROM moto_images WHERE moto_id = ?', [id]);

        // Obtener tecnologías
        moto.technologies = await query(`
            SELECT t.id, t.name 
            FROM technologies t
            JOIN moto_technologies mt ON t.id = mt.technology_id
            WHERE mt.moto_id = ?
        `, [id]);

        return moto;
    }

    // Crear nueva moto
    static async create(motoData) {
        const { brand, model, price, category, engineCc, transmission, description, mainImage } = motoData;

        const result = await query(
            `INSERT INTO motos 
            (brand, model, price, category, engine_cc, transmission, description, main_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [brand, model, price, category, engineCc, transmission, description, mainImage]
        );

        return result.insertId;
    }

    // Actualizar moto
    static async update(id, updateData) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }

        values.push(id);

        await query(
            `UPDATE motos SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }
}

export default Moto;