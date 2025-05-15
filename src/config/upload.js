import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadConfig = {
    directories: {
        uploads: path.join(__dirname, '../../public/uploads'),
        temp: path.join(__dirname, '../../temp')
    },
    images: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        resolutions: {
            thumb: { width: 200, height: 200 },
            medium: { width: 800, height: 600 }
        }
    },
    documents: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf']
    }
};

export default uploadConfig;