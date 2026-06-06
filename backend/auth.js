const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getPool } = require('./database');
const JWT_SECRET = process.env.JWT_SECRET || 'kilo-academy-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
const generateToken = (admin) => jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
const verifyToken = (token) => { try { return jwt.verify(token, JWT_SECRET); } catch { return null; } };
const login = async (username, password) => {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) return null;
    const admin = result.rows[0];
    if (admin.password_hash !== hashPassword(password)) return null;
    const token = generateToken(admin);
    return { token, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role, permissions: JSON.parse(admin.permissions || '{}') } };
};
const getAdmins = async () => {
    const pool = getPool();
    const result = await pool.query('SELECT id, username, name, role, permissions, created_at, updated_at FROM admins ORDER BY created_at DESC');
    return result.rows.map(a => ({ ...a, permissions: JSON.parse(a.permissions || '{}') }));
};
const getAdminById = async (id) => {
    const pool = getPool();
    const result = await pool.query('SELECT id, username, name, role, permissions, created_at, updated_at FROM admins WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const a = result.rows[0];
    a.permissions = JSON.parse(a.permissions || '{}');
    return a;
};
const createAdmin = async (data) => {
    const pool = getPool();
    const id = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const permissions = data.permissions ? JSON.stringify(data.permissions) : '{}';
    await pool.query('INSERT INTO admins (id, username, password_hash, name, role, permissions) VALUES ($1,$2,$3,$4,$5,$6)', [id, data.username, hashPassword(data.password), data.name, data.role || 'admin', permissions]);
    return getAdminById(id);
};
const updateAdmin = async (id, data) => {
    const pool = getPool();
    const current = await getAdminById(id);
    if (!current) return null;
    const permissions = data.permissions ? JSON.stringify(data.permissions) : current.permissions;
    await pool.query('UPDATE admins SET username=$1, name=$2, role=$3, password_hash=$4, permissions=$5, updated_at=NOW() WHERE id=$6', [data.username || current.username, data.name || current.name, data.role || current.role, data.password ? hashPassword(data.password) : current.password_hash, permissions, id]);
    return getAdminById(id);
};
const deleteAdmin = async (id) => {
    const pool = getPool();
    const admin = await pool.query('SELECT role FROM admins WHERE id = $1', [id]);
    if (admin.rows.length === 0) return false;
    if (admin.rows[0].role === 'super') { const count = await pool.query('SELECT count(*) FROM admins WHERE role = $1', ['super']); if (parseInt(count.rows[0].count) <= 1) throw new Error('Không thể xóa Super Admin cuối cùng'); }
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    return true;
};
const changePassword = async (id, newPassword) => {
    const pool = getPool();
    const admin = await pool.query('SELECT id FROM admins WHERE id = $1', [id]);
    if (admin.rows.length === 0) return false;
    await pool.query('UPDATE admins SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hashPassword(newPassword), id]);
    return true;
};
module.exports = { hashPassword, generateToken, verifyToken, login, getAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin, changePassword };
