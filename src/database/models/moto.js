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

    // Obtener por ID con cálculo de impuestos
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

            // Calcular impuestos
            moto.impuestos = await this.calculateTaxes(moto.price, moto.engine_cc, moto.category);
            moto.precio_total = moto.price + moto.impuestos.total_impuestos;

            return moto;
        } catch (error) {
            console.error('Error en findById:', error);
            throw new Error('Error obteniendo la moto');
        }
    }

    // Obtener múltiples motos por IDs para comparación
    static async findByIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }

        try {
            const placeholders = ids.map(() => '?').join(',');
            const sql = `SELECT * FROM motos WHERE id IN (${placeholders})`;

            const motos = await query(sql, ids);

            // Calcular impuestos para cada moto
            for (let moto of motos) {
                moto.impuestos = await this.calculateTaxes(moto.price, moto.engine_cc, moto.category);
                moto.precio_total = moto.price + moto.impuestos.total_impuestos;

                // Obtener imágenes adicionales
                try {
                    const images = await query('SELECT image_url FROM moto_images WHERE moto_id = ?', [moto.id]);
                    moto.images = images || [];
                } catch (error) {
                    moto.images = [];
                }

                // Obtener tecnologías
                try {
                    const technologies = await query(`
                        SELECT t.id, t.name 
                        FROM technologies t
                        INNER JOIN moto_technologies mt ON t.id = mt.technology_id
                        WHERE mt.moto_id = ?
                    `, [moto.id]);
                    moto.technologies = technologies || [];
                } catch (error) {
                    moto.technologies = [];
                }
            }

            return motos;
        } catch (error) {
            console.error('Error en findByIds:', error);
            throw new Error('Error obteniendo las motos para comparar');
        }
    }

    // Calcular impuestos según cilindraje y categoría
    static async calculateTaxes(precio, cilindraje, categoria) {
        try {
            const impuestos = await query('SELECT * FROM impuestos WHERE es_activo = TRUE');

            let detalleImpuestos = [];
            let totalImpuestos = 0;

            for (let impuesto of impuestos) {
                let aplicaImpuesto = false;
                let montoImpuesto = 0;

                // Verificar si aplica según el tipo
                if (impuesto.aplica_a === 'todas_las_motos') {
                    aplicaImpuesto = true;
                } else if (impuesto.aplica_a === 'por_cilindraje') {
                    if (cilindraje >= impuesto.cilindraje_min_aplicable &&
                        cilindraje <= impuesto.cilindraje_max_aplicable) {
                        aplicaImpuesto = true;
                    }
                } else if (impuesto.aplica_a === 'por_categoria') {
                    if (categoria === impuesto.aplica_a_categoria_moto) {
                        aplicaImpuesto = true;
                    }
                }

                if (aplicaImpuesto) {
                    if (impuesto.porcentaje) {
                        montoImpuesto = precio * impuesto.porcentaje;
                    } else if (impuesto.monto_fijo) {
                        montoImpuesto = impuesto.monto_fijo;
                    }

                    detalleImpuestos.push({
                        nombre: impuesto.nombre_impuesto,
                        monto: montoImpuesto,
                        tipo: impuesto.porcentaje ? 'porcentaje' : 'fijo',
                        valor_referencia: impuesto.porcentaje || impuesto.monto_fijo
                    });

                    totalImpuestos += montoImpuesto;
                }
            }

            return {
                detalle: detalleImpuestos,
                total_impuestos: totalImpuestos
            };
        } catch (error) {
            console.error('Error calculando impuestos:', error);
            return {
                detalle: [],
                total_impuestos: 0
            };
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

    // Obtener motos básicas para el selector del comparador
    static async getBasicMotos() {
        try {
            const result = await query(
                'SELECT id, brand, model, price, category, engine_cc, main_image,nivel_experiencia, freno_trasero, capacidad_del_tanque, potencia, freno_delantero, peso, caja_de_velocidades, garantia FROM motos ORDER BY brand, model',
                []
            );
            return result;
        } catch (error) {
            console.error('Error obteniendo motos básicas:', error);
            return [];
        }
    }
}

export default Moto;