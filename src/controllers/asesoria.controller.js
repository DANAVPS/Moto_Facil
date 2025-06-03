import { pool } from '../database/connection.js';

export const recibirAsesoria = async (req, res) => {
    try {
        const {
            edad_recomendada,
            nivel_experiencia,
            uso_previsto,
            presupuesto_rango,
            transmission
        } = req.body;

        console.log('🧾 Datos recibidos:', req.body);

        // Validación robusta del rango de presupuesto
        let presupuestoMin = 0;
        let presupuestoMax = Number.MAX_SAFE_INTEGER;

        if (typeof presupuesto_rango === 'string' && presupuesto_rango.includes('-')) {
            const [minStr, maxStr] = presupuesto_rango.split('-');
            presupuestoMin = Number(minStr.trim());
            presupuestoMax = Number(maxStr.trim());

            if (isNaN(presupuestoMin)) presupuestoMin = 0;
            if (isNaN(presupuestoMax)) presupuestoMax = Number.MAX_SAFE_INTEGER;
        }

        console.log('💰 Presupuesto procesado:', { presupuestoMin, presupuestoMax });

        // Parse age range from frontend (e.g., "30-50")
        let edadMin = 0;
        let edadMax = 100;

        if (typeof edad_recomendada === 'string' && edad_recomendada.includes('-')) {
            const [minAge, maxAge] = edad_recomendada.split('-');
            edadMin = Number(minAge.trim());
            edadMax = Number(maxAge.trim());
        }

        console.log('👤 Edad procesada:', { edadMin, edadMax });

        // ✅ CONSULTA MEJORADA - Más flexible y realista
        const query = `
            SELECT *, 
                   (CASE 
                    WHEN nivel_experiencia = ? THEN 3
                    WHEN nivel_experiencia = 'todos' THEN 2
                    ELSE 1
                   END) as experience_match,
                   (CASE 
                    WHEN uso_previsto LIKE ? THEN 3
                    WHEN uso_previsto LIKE '%todos%' THEN 2
                    ELSE 1
                   END) as usage_match,
                   (CASE 
                    WHEN transmission = ? THEN 2
                    ELSE 1
                   END) as transmission_match
            FROM motos
            WHERE
                price BETWEEN ? AND ? AND
                (
                    -- Age range overlap check
                    edad_recomendada IS NULL OR
                    edad_recomendada LIKE '%todos%' OR
                    (
                        CAST(SUBSTRING_INDEX(REPLACE(edad_recomendada, ' años', ''), '-', 1) AS UNSIGNED) <= ? AND
                        CAST(SUBSTRING_INDEX(REPLACE(edad_recomendada, ' años', ''), '-', -1) AS UNSIGNED) >= ?
                    )
                ) AND
                (
                    -- Experience level - exact match only
                    nivel_experiencia IS NULL OR
                    nivel_experiencia = 'todos' OR
                    nivel_experiencia = ?
                ) AND
                (
                    -- Usage type - more flexible matching
                    uso_previsto IS NULL OR
                    uso_previsto LIKE '%todos%' OR
                    uso_previsto LIKE ? OR
                    (? LIKE '%ciudad%' AND uso_previsto LIKE '%ciudad%') OR
                    (? LIKE '%viaje%' AND uso_previsto LIKE '%largo%') OR
                    (? LIKE '%deportivo%' AND uso_previsto LIKE '%deporti%')
                ) AND
                (
                    -- Transmission
                    transmission IS NULL OR
                    transmission = ? OR
                    ? = 'cualquiera'
                )
            ORDER BY 
                experience_match DESC,
                usage_match DESC,
                transmission_match DESC,
                price ASC
            LIMIT 20
        `;

        const usagePattern = `%${uso_previsto}%`;

        const [motos] = await pool.query(query, [
            // Experience scoring
            nivel_experiencia,
            // Usage scoring  
            usagePattern,
            // Transmission scoring
            transmission,
            // Price range
            presupuestoMin,
            presupuestoMax,
            // Age range overlap
            edadMax,
            edadMin,
            // Experience conditions
            nivel_experiencia,
            // Usage conditions
            usagePattern,
            uso_previsto,
            uso_previsto,
            uso_previsto,
            // Transmission conditions
            transmission,
            transmission
        ]);

        console.log('✅ Motos encontradas:', motos.length);
        console.log('📋 Top 3 motos recomendadas:', motos.slice(0, 3));

        // Si no hay resultados exactos, hacer búsqueda más amplia
        let motosFinales = motos;

        if (motos.length === 0) {
            console.log('🔍 Búsqueda ampliada...');

            const queryAmplia = `
                SELECT *, 
                       ABS(price - ?) as price_diff
                FROM motos
                WHERE price BETWEEN ? AND ?
                ORDER BY price_diff ASC
                LIMIT 10
            `;

            const precioPromedio = (presupuestoMin + presupuestoMax) / 2;
            const [motosAmplia] = await pool.query(queryAmplia, [
                precioPromedio,
                presupuestoMin * 0.8, // 20% más flexible hacia abajo
                presupuestoMax * 1.2   // 20% más flexible hacia arriba
            ]);

            motosFinales = motosAmplia;
            console.log('📈 Búsqueda ampliada encontró:', motosFinales.length, 'motos');
        }

        // Respuesta mejorada con más información
        const mensaje = motosFinales.length > 0 ?
            `Se encontraron ${motosFinales.length} motos recomendadas para tu perfil` :
            'No se encontraron motos que coincidan con tu perfil. Intenta ajustar tu presupuesto o criterios.';

        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.json({
                success: true,
                recomendaciones: motosFinales,
                mensaje: mensaje,
                criterios: {
                    edad_recomendada,
                    nivel_experiencia,
                    uso_previsto,
                    transmission,
                    presupuesto: { min: presupuestoMin, max: presupuestoMax }
                }
            });
        } else {
            res.render('users/Asesoria', {
                title: 'MotoApp - Asesoría',
                user: req.user || null,
                recomendaciones: motosFinales,
                mensaje: mensaje
            });
        }

    } catch (error) {
        console.error('❌ Error al procesar asesoría:', error);

        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.status(500).json({
                success: false,
                error: 'Error al procesar la asesoría',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } else {
            res.status(500).render('users/Asesoria', {
                title: 'MotoApp - Error',
                user: req.user || null,
                error: 'Error al procesar la asesoría'
            });
        }
    }
};

export const mostrarDetallesMoto = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== DEBUG DETALLE MOTO ===');
        console.log('ID solicitado:', id);
        console.log('Headers Accept:', req.headers.accept);
        console.log('¿Es XHR?:', req.xhr);

        const [moto] = await pool.query('SELECT * FROM motos WHERE id = ?', [id]);

        console.log('Moto encontrada:', moto && moto.length > 0 ? 'SÍ' : 'NO');

        if (!moto || moto.length === 0) {
            console.log('Moto no encontrada, enviando error');
            return res.status(404).render('error', {
                message: 'Moto no encontrada'
            });
        }

        console.log('Renderizando vista users/infomoto');

        res.render('users/infomoto', {
            moto: moto[0],
            title: `${moto[0].brand} ${moto[0].model}`,
            user: req.user || null
        });

    } catch (error) {
        console.error('Error al obtener detalles de la moto:', error);
        res.status(500).render('error', {
            message: 'Error interno del servidor'
        });
    }
};