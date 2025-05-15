import express from 'express';
const router = express.Router();

router.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ruta no encontrada'
    });
});

export default router;