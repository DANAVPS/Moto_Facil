// src/database/models/moto.js

// Importa 'query' directamente desde tu archivo de conexión.
// Asegúrate de que la ruta sea correcta a tu conexión de MySQL.
import { query } from '../connection.js'; 
import { AppError } from '../../helper/errorhandler.js'; // Asegúrate de que esta ruta sea correcta

class Moto {
    // Obtener todas las motos con filtros y paginación
    static async findAll({ category, minPrice, maxPrice, transmission, query: searchTerm, limit = 10, page = 1 }) { // Renombré 'query' a 'searchTerm' para evitar conflicto con la función 'query' importada
        try {
            let sql = 'SELECT * FROM motos WHERE 1=1';
            const values = [];

            if (category) {
                sql += ' AND category = ?';
                values.push(category);
            }
            if (transmission) { // Añadido soporte para filtro de transmisión
                sql += ' AND transmission = ?';
                values.push(transmission);
            }
            if (minPrice) {
                sql += ' AND price >= ?';
                values.push(minPrice);
            }
            if (maxPrice) {
                sql += ' AND price <= ?';
                values.push(maxPrice);
            }
            if (searchTerm) { // Añadido soporte para búsqueda general
                sql += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
                values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
            }

            sql += ' LIMIT ? OFFSET ?';
            values.push(limit, (page - 1) * limit);

            return await query(sql, values); // Utiliza tu función query
        } catch (error) {
            console.error('Error en Moto.findAll:', error.message);
            throw new AppError('Error al obtener la lista de motos.', 500);
        }
    }

    // Obtener por ID con imágenes y tecnologías
    static async findById(id) {
        try {
            // Tu lógica original de destructuring es correcta para tu función 'query'
            const [moto] = await query('SELECT * FROM motos WHERE id = ?', [id]); 

            if (!moto) return null;

            // Obtener imágenes adicionales
            // Tu función 'query' devolverá un array de objetos { image_url: '...' }
            moto.images = await query('SELECT image_url FROM moto_images WHERE moto_id = ?', [id]);

            // Obtener tecnologías
            // Tu función 'query' devolverá un array de objetos { id: ..., name: '...' }
            moto.technologies = await query(`
                SELECT t.id, t.name 
                FROM technologies t
                JOIN moto_technologies mt ON t.id = mt.technology_id
                WHERE mt.moto_id = ?
            `, [id]);

            return moto;
        } catch (error) {
            console.error('Error en Moto.findById:', error.message);
            throw new AppError('Error al obtener los detalles de la moto.', 500);
        }
    }

    // Crear nueva moto
    static async create(motoData) {
        try {
            const { brand, model, price, category, engineCc, transmission, description, mainImage } = motoData;

            // Tu función 'query' para INSERT devuelve el objeto de resultados DML
            const result = await query(
                `INSERT INTO motos 
                (brand, model, price, category, engine_cc, transmission, description, main_image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [brand, model, price, category, engineCc, transmission, description, mainImage]
            );

            // 'result.insertId' será accesible porque tu función 'query' devuelve el objeto de resultados DML
            return result.insertId;
        } catch (error) {
            console.error('Error en Moto.create:', error.message);
            throw new AppError('Error al crear la moto.', 500);
        }
    }

    // Actualizar moto
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updateData)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }

            values.push(id);

            // Tu función 'query' para UPDATE devuelve el objeto de resultados DML
            await query(
                `UPDATE motos SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            // Retorna la moto actualizada después de la operación
            return await this.findById(id);
        } catch (error) {
            console.error('Error en Moto.update:', error.message);
            throw new AppError('Error al actualizar la moto.', 500);
        }
    }

    // Eliminar moto
    static async delete(id) {
        try {
            // Tu función 'query' para DELETE devuelve el objeto de resultados DML
            const result = await query(`DELETE FROM motos WHERE id = ?`, [id]);
            
            // 'result.affectedRows' será accesible
            if (result.affectedRows === 0) {
                throw new AppError('No se encontró la moto para eliminar.', 404);
            }
            return true;
        } catch (error) {
            console.error('Error en Moto.delete:', error.message);
            throw new AppError('Error al eliminar la moto.', 500);
        }
    }

    // Método para añadir una imagen adicional a una moto
    static async addImage(motoId, imageUrl) {
        try {
            const sql = `INSERT INTO moto_images (moto_id, image_url) VALUES (?, ?)`;
            await query(sql, [motoId, imageUrl]);
            return true;
        } catch (error) {
            console.error('Error en Moto.addImage:', error.message);
            throw new AppError('Error al añadir imagen.', 500);
        }
    }

    // Método para añadir tecnología a moto
    static async addTechnology(motoId, technologyId) {
        try {
            const sql = `INSERT INTO moto_technologies (moto_id, technology_id) VALUES (?, ?)`;
            await query(sql, [motoId, technologyId]);
            return true;
        } catch (error) {
            console.error('Error en Moto.addTechnology:', error.message);
            throw new AppError('Error al añadir tecnología.', 500);
        }
    }

    // Método para eliminar tecnología de moto
    static async removeTechnology(motoId, techId) {
        try {
            const sql = `DELETE FROM moto_technologies WHERE moto_id = ? AND technology_id = ?`;
            const result = await query(sql, [motoId, techId]);
            if (result.affectedRows === 0) {
                throw new AppError('Relación tecnología-moto no encontrada.', 404);
            }
            return true;
        } catch (error) {
            console.error('Error en Moto.removeTechnology:', error.message);
            throw new AppError('Error al eliminar tecnología.', 500);
        }
    }

    // Métodos para obtener valores distintivos para los filtros en la UI
    static async getDistinctCategories() {
        try {
            const rows = await query(`SELECT DISTINCT category FROM motos ORDER BY category`);
            return rows.map(row => row.category);
        } catch (error) {
            console.error('Error en Moto.getDistinctCategories:', error.message);
            throw new AppError('Error al obtener categorías.', 500);
        }
    }

    static async getDistinctTransmissions() {
        try {
            const rows = await query(`SELECT DISTINCT transmission FROM motos ORDER BY transmission`);
            return rows.map(row => row.transmission);
        } catch (error) {
            console.error('Error en Moto.getDistinctTransmissions:', error.message);
            throw new AppError('Error al obtener transmisiones.', 500);
        }
    }
}

export default Moto;