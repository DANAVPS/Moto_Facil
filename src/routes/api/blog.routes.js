import express from 'express';
import {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
} from '../../controllers/blog.controller.js';
import { auth } from '../../middleware/auth.js';
import { upload } from '../../helper/upload.js';

const router = express.Router();

// Públicas
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protegidas
router.post('/', auth, upload.single('imagen'), createBlog);
router.put('/:id', auth, upload.single('imagen'), updateBlog);
router.delete('/:id', auth, deleteBlog);

export default router;