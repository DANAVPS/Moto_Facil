export const blogQueries = {
    create: `
        INSERT INTO blogs 
        (titulo, contenido, imagen, autor_id, categoria, fecha_publicacion) 
        VALUES (?, ?, ?, ?, ?, NOW())
    `,
    findById: `
        SELECT b.*, u.name as autor_nombre 
        FROM blogs b
        JOIN users u ON b.autor_id = u.id
        WHERE b.id = ?
    `,
    findAll: `
        SELECT b.*, u.name as autor_nombre 
        FROM blogs b
        JOIN users u ON b.autor_id = u.id
        ORDER BY b.fecha_publicacion DESC
        LIMIT ? OFFSET ?
    `,
    findByCategory: `
        SELECT b.*, u.name as autor_nombre 
        FROM blogs b
        JOIN users u ON b.autor_id = u.id
        WHERE b.categoria = ?
        ORDER BY b.fecha_publicacion DESC
    `,
    update: `
        UPDATE blogs SET 
        titulo = ?, 
        contenido = ?, 
        imagen = ?, 
        categoria = ?,
        fecha_actualizacion = NOW()
        WHERE id = ?
    `,
    delete: 'DELETE FROM blogs WHERE id = ?',
    count: 'SELECT COUNT(*) as total FROM blogs'
};