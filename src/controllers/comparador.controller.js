import moto from '../database/models/moto.js';

class ComparatorController {

    // Mostrar la página del comparador
    static async showComparator(req, res) {
        console.log('ComparatorController: showComparator - Solicitud para mostrar la página del comparador.');
        try {
            // Obtener todas las motos para el selector
            const motos = await moto.getBasicMotos();
            console.log('ComparatorController: showComparator - Motos básicas obtenidas del modelo:', motos.length, 'motos.');

            res.render('users/comparador', {
                title: 'Comparador de Motos',
                motos: motos,
                motosSelected: []
            });
            console.log('ComparatorController: showComparator - Página "users/comparador" renderizada con motos.');
        } catch (error) {
            console.error('ComparatorController: showComparator - Error mostrando comparador:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error cargando el comparador de motos'
            });
        }
    }

    // Obtener datos de motos para comparar (AJAX)
    // Método corregido en ComparatorController
    static async getMotosForComparison(req, res) {
        console.log('ComparatorController: getMotosForComparison - Solicitud AJAX para obtener motos para comparar.');
        try {
            const { moto_ids } = req.body;
            console.log('ComparatorController: getMotosForComparison - IDs recibidos:', moto_ids);

            if (!moto_ids || !Array.isArray(moto_ids) || moto_ids.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren al menos 2 IDs de motos para comparar'
                });
            }

            if (moto_ids.length > 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Máximo 3 motos pueden compararse'
                });
            }

            // Obtener las motos con todos sus detalles
            const motos = await moto.findByIds(moto_ids.map(id => parseInt(id)));

            // CORRECCIÓN: Procesar las imágenes usando 'main_image' en lugar de 'imagen_principal'
            const motosConImagenes = motos.map(moto => ({
                ...moto,
                main_image: moto.main_image ? `img/${moto.main_image}` : null
            }));

            console.log('Motos con imágenes procesadas:', motosConImagenes.map(m => ({
                id: m.id,
                model: m.model,
                main_image: m.main_image
            })));

            res.json({
                success: true,
                motos: motosConImagenes
            });

        } catch (error) {
            console.error('Error en getMotosForComparison:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Comparar motos con redirección (método GET para URLs amigables)
    static async compareMotos(req, res) {
        console.log('ComparatorController: compareMotos - Solicitud GET para comparación de motos.');
        try {
            const { ids } = req.query;
            console.log('ComparatorController: compareMotos - IDs recibidos en req.query:', ids);

            if (!ids) {
                console.log('ComparatorController: compareMotos - No se proporcionaron IDs en la URL, redirigiendo a /comparador.');
                return res.redirect('/comparador');
            }

            // Parsear IDs desde query string (formato: ids=1,2,3)
            const motoIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            console.log('ComparatorController: compareMotos - IDs parseados de la URL:', motoIds);

            if (motoIds.length === 0 || motoIds.length > 3) {
                console.log('ComparatorController: compareMotos - IDs inválidos o más de 3, redirigiendo a /comparador.');
                return res.redirect('/comparador');
            }

            // Obtener las motos
            const motos = await moto.findByIds(motoIds);
            console.log('ComparatorController: compareMotos - Motos obtenidas por findByIds para renderizado:', motos);
            const allMotos = await moto.getBasicMotos(); // Esto es para llenar los selectores nuevamente en la vista
            console.log('ComparatorController: compareMotos - Todas las motos básicas obtenidas para los selectores:', allMotos.length, 'motos.');

            res.render('comparator/index', {
                title: 'Comparador de Motos',
                motos: allMotos, // Todas las motos para los selectores
                motosSelected: motos, // Las motos que realmente se están comparando
                selectedIds: motoIds
            });
            console.log('ComparatorController: compareMotos - Página "comparator/index" renderizada con motos seleccionadas.');

        } catch (error) {
            console.error('ComparatorController: compareMotos - Error en comparación de motos:', error);
            res.redirect('/comparador');
        }
    }

    // Obtener lista de motos para AJAX (búsqueda)
    static async searchMotos(req, res) {
        console.log('ComparatorController: searchMotos - Solicitud AJAX para búsqueda de motos.');
        try {
            const { q } = req.query;
            console.log('ComparatorController: searchMotos - Query de búsqueda (q):', q);

            let motos;
            if (q && q.trim() !== '') {
                // Búsqueda por marca, modelo o categoría
                const searchTerm = `%${q.trim()}%`;
                // NOTA: Tu moto.findAll() actual no tiene implementación de búsqueda.
                // Deberías pasar 'searchTerm' o un objeto de filtros a findAll para que busque.
                // Por ejemplo: motos = await moto.findAll({ searchTerm: searchTerm });
                console.warn('ComparatorController: searchMotos - La función moto.findAll() no parece implementar la búsqueda por texto. Considera añadirla.');
                motos = await moto.getBasicMotos(); // Por ahora, devuelve todas si la búsqueda no está implementada
            } else {
                motos = await moto.getBasicMotos();
            }
            console.log('ComparatorController: searchMotos - Motos encontradas para la búsqueda:', motos.length);

            res.json({
                success: true,
                motos: motos
            });
            console.log('ComparatorController: searchMotos - Respuesta JSON enviada para búsqueda.');

        } catch (error) {
            console.error('ComparatorController: searchMotos - Error buscando motos:', error);
            res.status(500).json({
                success: false,
                message: 'Error buscando motos'
            });
        }
    }

    // Obtener detalles de una moto específica
    static async getMotoDetails(req, res) {
        console.log('ComparatorController: getMotoDetails - Solicitud AJAX para obtener detalles de una moto.');
        try {
            const { id } = req.params;
            console.log('ComparatorController: getMotoDetails - ID de moto recibido en req.params:', id);

            if (!id || isNaN(parseInt(id))) {
                console.log('ComparatorController: getMotoDetails - Error: ID de moto inválido.');
                return res.status(400).json({
                    success: false,
                    message: 'ID de moto inválido'
                });
            }

            const motoDetails = await moto.findById(parseInt(id)); // Renombre la variable para evitar conflicto con 'moto' del import
            console.log('ComparatorController: getMotoDetails - Detalles de moto obtenidos por findById:', motoDetails);

            if (!motoDetails) {
                console.log('ComparatorController: getMotoDetails - Error: Moto no encontrada para el ID:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Moto no encontrada'
                });
            }

            res.json({
                success: true,
                moto: motoDetails
            });
            console.log('ComparatorController: getMotoDetails - Respuesta JSON enviada con detalles de la moto.');

        } catch (error) {
            console.error('ComparatorController: getMotoDetails - Error obteniendo detalles de moto:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo detalles de la moto'
            });
        }
    }
}

export default ComparatorController;