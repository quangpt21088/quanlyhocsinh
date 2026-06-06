const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDb } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'kilo-academy-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const generateToken = (admin) => {
    return jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

const login = (username, password) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
    stmt.bind([username]);
    if (!stmt.step()) {
        stmt.free();
        return null;
    }
    const admin = stmt.getAsObject();
    stmt.free();

    const hashedInput = hashPassword(password);
    if (admin.password_hash !== hashedInput) return null;

    const token = generateToken(admin);
    return {
        token,
        admin: {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            role: admin.role,
            permissions: JSON.parse(admin.permissions || '{}')
        }
    };
};

const getAdmins = () => {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, name, role, permissions, created_at, updated_at FROM admins ORDER BY created_at DESC');
    const admins = [];
    while (stmt.step()) {
        const a = stmt.getAsObject();
        a.permissions = JSON.parse(a.permissions || '{}');
        admins.push(a);
    }
    stmt.free();
    return admins;
};

const getAdminById = (id) => {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, name, role, permissions, created_at, updated_at FROM admins WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
        stmt.free();
        return null;
    }
    const admin = stmt.getAsObject();
    stmt.free();
    admin.permissions = JSON.parse(admin.permissions || '{}');
    return admin;
};

const createAdmin = (data) => {
    const db = getDb();
    const id = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const permissions = data.permissions ? JSON.stringify(data.permissions) : '{}';
    db.run('INSERT INTO admins (id, username, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.username, hashPassword(data.password), data.name, data.role || 'admin', permissions]);
    return getAdminById(id);
};

const updateAdmin = (id, data) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM admins WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
        stmt.free();
        return null;
    }
    const admin = stmt.getAsObject();
    stmt.free();

    const updates = {
        username: data.username || admin.username,
        name: data.name || admin.name,
        role: data.role || admin.role,
        permissions: data.permissions ? JSON.stringify(data.permissions) : admin.permissions,
        updated_at: new Date().toISOString()
    };

    if (data.password) {
        updates.password_hash = hashPassword(data.password);
    } else {
        updates.password_hash = admin.password_hash;
    }

    db.run('UPDATE admins SET username = ?, name = ?, role = ?, password_hash = ?, permissions = ?, updated_at = ? WHERE id = ?',
        [updates.username, updates.name, updates.role, updates.password_hash, updates.permissions, updates.updated_at, id]);

    return getAdminById(id);
};

const deleteAdmin = (id) => {
    const db = getDb();
    const stmt = db.prepare('SELECT role FROM admins WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
        stmt.free();
        return false;
    }
    const admin = stmt.getAsObject();
    stmt.free();

    if (admin.role === 'super') {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM admins WHERE role = ?');
        countStmt.bind(['super']);
        countStmt.step();
        const result = countStmt.getAsObject();
        countStmt.free();
        if (result.count <= 1) throw new Error('Không thể xóa Super Admin cuối cùng');
    }
    db.run('DELETE FROM admins WHERE id = ?', [id]);
    return true;
};

const changePassword = (id, newPassword) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM admins WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
        stmt.free();
        return false;
    }
    stmt.free();
    db.run('UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?',
        [hashPassword(newPassword), new Date().toISOString(), id]);
    return true;
};

module.exports = {
    hashPassword,
    generateToken,
    verifyToken,
    login,
    getAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    changePassword
};
