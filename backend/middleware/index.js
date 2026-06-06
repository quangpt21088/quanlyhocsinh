const { verifyToken, getAdminById } = require('../auth');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const admin = getAdminById(decoded.id);
    if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
};

const superOnly = (req, res, next) => {
    if (req.admin.role !== 'super') {
        return res.status(403).json({ error: 'Chỉ Super Admin mới có quyền thực hiện' });
    }
    next();
};

const checkPermission = (tab, action) => {
    return (req, res, next) => {
        if (req.admin.role === 'super') return next();
        const perms = req.admin.permissions[tab];
        if (perms && perms[action]) return next();
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    };
};

module.exports = { authMiddleware, superOnly, checkPermission };
