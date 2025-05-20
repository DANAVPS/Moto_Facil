import express from 'express';
import blogController from '../../controllers/blog.controller.js';
import { auth } from '../../middleware/auth.js';
import { uploadImage } from '../../helper/upload.js';

const router = express.Router();

// Públicas
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogBySlug);

// Protegidas
router.post('/', auth, uploadImage.single('imagen'), blogController.createBlog);
router.post('/:id',auth, uploadImage.single('imagen'), blogController.publishBlog);
router.put('/:id', auth, uploadImage.single('imagen'), blogController.updateBlog);
router.delete('/:id', auth, blogController.deleteBlog);

export default router;