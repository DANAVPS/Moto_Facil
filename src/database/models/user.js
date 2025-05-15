import bcrypt from 'bcryptjs';
import { query } from '../connection.js';

class User {
    // Crear usuario
    static async create({ name, email, password, role = 'user' }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        return result.insertId;
    }

    // Buscar por email
    static async findByEmail(email) {
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        return users[0];
    }

    // Verificar contraseña
    static async verifyPassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }

    // Actualizar perfil
    static async updateProfile(userId, { name, email }) {
        await query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, userId]
        );
    }

    // Añadir moto a favoritos
    static async addFavorite(userId, motoId) {
        await query(
            'INSERT IGNORE INTO favorites (user_id, moto_id) VALUES (?, ?)',
            [userId, motoId]
        );
    }
}

export default User;