import { pool } from '../database/connection.js';

export const recibirAsesoria = async (req, res) => {
    try {
        const {
            edad,
            experiencia,
            usoPrevisto,
            presupuesto_rango,
            transmision,
            caracteristicas
        } = req.body;

        // ✅ Mapeo de edades del formulario al formato de la BD
        const edadMap = {
            '16-25': '16-30 años',
            '18-30': '18-35 años',
            '25-35': '25-40 años',
            '30-45': '30-50 años'
        };
        const edadFinal = edadMap[edad] || edad;

        // ✅ Convertir presupuesto
        const [presupuestoMin, presupuestoMax] = presupuesto_rango.split('-').map(Number);

        // ✅ Construcción del query dinámico
        let query = `
            SELECT * FROM motos
            WHERE presupuesto_minimo <= ? AND presupuesto_maximo >= ?
        `;
        const params = [presupuestoMax, presupuestoMin];

        if (edadFinal) {
            query += ` AND edad_recomendada LIKE ?`;
            params.push(`%${edadFinal}%`);
        }
        if (experiencia) {
            query += ` AND nivel_experiencia LIKE ?`;
            params.push(`%${experiencia}%`);
        }
        if (usoPrevisto) {
            query += ` AND uso_previsto LIKE ?`;
            params.push(`%${usoPrevisto}%`);
        }
        if (transmision) {
            query += ` AND transmission = ?`;
            params.push(transmision);
        }

        const [motos] = await pool.query(query, params);

        // ✅ Filtrado adicional por características
        let motosFiltradas = motos;
        if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
            motosFiltradas = motos.filter(moto =>
                caracteristicas.every(c =>
                    moto.description.toLowerCase().includes(c.toLowerCase())
                )
            );
        }

        console.log('Motos recomendadas:', motosFiltradas);

        // ✅ CAMBIO: Devolver JSON en lugar de render
        res.json({
            status: 'success',
            recomendaciones: motosFiltradas
        });

    } catch (error) {
        console.error('Error al procesar asesoría:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al procesar asesoría'
        });
    }
};

export const mostrarDetallesMoto = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== DEBUG DETALLE MOTO ===');
        console.log('ID solicitado:', id);
        console.log('Headers Accept:', req.headers.accept);
        console.log('¿Es XHR?:', req.xhr);

        // Consultar la moto específica
        const [moto] = await pool.query('SELECT * FROM motos WHERE id = ?', [id]);

        console.log('Moto encontrada:', moto && moto.length > 0 ? 'SÍ' : 'NO');

        if (!moto || moto.length === 0) {
            console.log('Moto no encontrada, enviando error');
            return res.status(404).render('error', {
                message: 'Moto no encontrada'
            });
        }
        
        console.log('Renderizando vista users/infomoto');

        // Renderizar la vista infomoto.pug con los datos de la moto
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