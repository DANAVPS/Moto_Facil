import express from 'express';
const router = express.Router();

router.use((req, res) => {
    // Si la solicitud espera JSON (API)
    if (req.accepts('json') && req.path.startsWith('/api')) {
        return res.status(404).json({
            status: 'error',
            message: 'Ruta no encontrada'
        });
    }

    // Si es una solicitud web normal, renderizar vista 404
    res.status(404).render('404', {
        title: 'Página no encontrada',
        user: req.user || null,
        message: 'Lo sentimos, la página que buscas no existe'
    });
});

export default router;