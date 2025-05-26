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

        const [presupuestoMin, presupuestoMax] = presupuesto_rango.split('-').map(Number);

        let query = `SELECT * FROM motos WHERE 
            edad_recomendada LIKE ? AND 
            nivel_experiencia LIKE ? AND 
            uso_previsto LIKE ? AND 
            presupuesto_minimo <= ? AND 
            presupuesto_maximo >= ?`;

        const params = [
            `%${edad}%`,
            `%${experiencia}%`,
            `%${usoPrevisto}%`,
            presupuestoMin,
            presupuestoMax
        ];

        if (transmision) {
            query += ` AND transmission = ?`;
            params.push(transmision);
        }

        const [motos] = await pool.query(query, params);

        // Filtrado adicional por características si se enviaron como array
        let motosFiltradas = motos;
        if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
            motosFiltradas = motos.filter(moto =>
                caracteristicas.every(c => moto.description.toLowerCase().includes(c.toLowerCase()))
            );
        }

        console.log('Motos recomendadas:', motosFiltradas);
        res.json({ recomendaciones: motosFiltradas });

    } catch (error) {
        console.error('Error al procesar asesoría:', error);
        res.status(500).json({ error: 'Error al procesar asesoría' });
    }
};
