import { query } from '../connection.js';

class Moto {
    // Obtener todas las motos
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM motos WHERE 1=1';
        const values = [];

        const { category, minPrice, maxPrice, transmission, limit = 10, page = 1 } = filters;

        if (category) {
            sql += ' AND category = ?';
            values.push(category);
        }

        if (transmission) {
            sql += ' AND transmission = ?';
            values.push(transmission);
        }

        if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
            sql += ' AND price >= ?';
            values.push(Number(minPrice));
        }

        if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
            sql += ' AND price <= ?';
            values.push(Number(maxPrice));
        }

        // Ordenar por fecha de creación
        sql += ' ORDER BY created_at DESC';

        // Paginación - VERSIÓN ALTERNATIVA SIN PLACEHOLDERS
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
        const safeOffset = Number.isInteger(parsedPage) && parsedPage > 0 ? (parsedPage - 1) * safeLimit : 0;

        // SOLUCIÓN ALTERNATIVA: Construir LIMIT y OFFSET directamente en el SQL
        sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

        try {
            console.log('SQL ejecutado:', sql);
            console.log('Valores:', values);
            console.log('Tipos de valores:', values.map(v => typeof v));
            
            const result = await query(sql, values);
            return result;
        } catch (error) {
            console.error('Error en findAll:', error);
            throw new Error('Error obteniendo las motos');
        }
    }

    // Obtener por ID
    static async findById(id) {
        try {
            console.log('Buscando moto con ID:', id);
            
            const result = await query('SELECT * FROM motos WHERE id = ?', [id]);
            
            if (!result || result.length === 0) {
                return null;
            }

            const moto = result[0];

            // Intentar obtener imágenes adicionales si existe la tabla
            try {
                const images = await query('SELECT image_url FROM moto_images WHERE moto_id = ?', [id]);
                moto.images = images || [];
            } catch (error) {
                console.log('Tabla moto_images no encontrada');
                moto.images = [];
            }

            // Intentar obtener tecnologías si existen las tablas
            try {
                const technologies = await query(`
                    SELECT t.id, t.name 
                    FROM technologies t
                    INNER JOIN moto_technologies mt ON t.id = mt.technology_id
                    WHERE mt.moto_id = ?
                `, [id]);
                moto.technologies = technologies || [];
            } catch (error) {
                console.log('Tablas de tecnologías no encontradas');
                moto.technologies = [];
            }

            return moto;
        } catch (error) {
            console.error('Error en findById:', error);
            throw new Error('Error obteniendo la moto');
        }
    }

    // Crear nueva moto
    static async create(motoData) {
        const { brand, model, price, category, engineCc, transmission, description, mainImage } = motoData;

        try {
            const result = await query(
                `INSERT INTO motos 
                (brand, model, price, category, engine_cc, transmission, description, main_image, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [brand, model, price, category, engineCc, transmission, description, mainImage]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creando moto:', error);
            throw new Error('Error creando nueva moto');
        }
    }

    // Actualizar moto
    static async update(id, updateData) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);

        try {
            await query(
                `UPDATE motos SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            return true;
        } catch (error) {
            console.error('Error actualizando moto:', error);
            throw new Error('Error actualizando moto');
        }
    }

    // Obtener categorías distintas
    static async getDistinctCategories() {
        try {
            const results = await query(
                'SELECT DISTINCT category FROM motos WHERE category IS NOT NULL ORDER BY category', 
                []
            );
            return results.map(row => row.category);
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return [];
        }
    }

    // Obtener transmisiones distintas
    static async getDistinctTransmissions() {
        try {
            const results = await query(
                'SELECT DISTINCT transmission FROM motos WHERE transmission IS NOT NULL ORDER BY transmission', 
                []
            );
            return results.map(row => row.transmission);
        } catch (error) {
            console.error('Error obteniendo transmisiones:', error);
            return [];
        }
    }

    // Método específico para obtener por transmisión
    static async findByTransmission(transmission, limit = 10, page = 1) {
        return this.findAll({ transmission, limit, page });
    }

    // Contar motos con filtros
    static async countWithFilters(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM motos WHERE 1=1';
        const values = [];

        const { category, minPrice, maxPrice, transmission } = filters;

        if (category) {
            sql += ' AND category = ?';
            values.push(category);
        }

        if (transmission) {
            sql += ' AND transmission = ?';
            values.push(transmission);
        }

        if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
            sql += ' AND price >= ?';
            values.push(Number(minPrice));
        }

        if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
            sql += ' AND price <= ?';
            values.push(Number(maxPrice));
        }

        try {
            const result = await query(sql, values);
            return result[0].total;
        } catch (error) {
            console.error('Error contando motos:', error);
            return 0;
        }
    }
}

export default Moto;