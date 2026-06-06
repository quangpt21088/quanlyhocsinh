const express = require('express');
const { getDb, persist } = require('../database');
const { login, createAdmin, updateAdmin, deleteAdmin, changePassword, getAdmins, getAdminById } = require('../auth');
const { authMiddleware, superOnly, checkPermission } = require('../middleware');

const router = express.Router();

const all = (sql, params = []) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
};

const get = (sql, params = []) => {
    const rows = all(sql, params);
    return rows[0] || null;
};

const run = (sql, params = []) => {
    const db = getDb();
    db.run(sql, params);
    persist();
};

router.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }
    const result = login(username, password);
    if (!result) {
        return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    res.json(result);
});

router.get('/students', authMiddleware, (req, res) => {
    const students = all('SELECT * FROM students ORDER BY name');
    res.json(students);
});

router.post('/students', authMiddleware, checkPermission('students', 'add'), (req, res) => {
    const { id, name, phone, email, dob, gender, address, status, discountType, discountValue, createdAt } = req.body;
    if (!name) return res.status(400).json({ error: 'Thiếu tên học viên' });
    run('INSERT OR REPLACE INTO students (id, name, phone, email, dob, gender, address, status, discount_type, discount_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id || 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), name, phone || '', email || '', dob || '', gender || '', address || '', status || 'Đang học', discountType || '', discountValue || 0, createdAt || new Date().toISOString()]);
    res.json({ success: true });
});

router.post('/students/batch', authMiddleware, checkPermission('students', 'add'), (req, res) => {
    const students = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const db = getDb();
    const stmt = db.prepare('INSERT OR REPLACE INTO students (id, name, phone, email, dob, gender, address, status, discount_type, discount_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const s of students) {
            stmt.run([s.id || 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), s.name, s.phone || '', s.email || '', s.dob || '', s.gender || '', s.address || '', s.status || 'Đang học', s.discountType || s.discount_type || '', s.discountValue || s.discount_value || 0, s.createdAt || s.created_at || new Date().toISOString()]);
        }
        db.exec('COMMIT');
        persist();
    } catch (err) {
        db.exec('ROLLBACK');
        return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, count: students.length });
});

router.put('/students/:id', authMiddleware, checkPermission('students', 'edit'), (req, res) => {
    const { name, phone, email, dob, gender, address, status, discountType, discountValue } = req.body;
    const student = get('SELECT id FROM students WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy học viên' });
    run('UPDATE students SET name = ?, phone = ?, email = ?, dob = ?, gender = ?, address = ?, status = ?, discount_type = ?, discount_value = ?, updated_at = ? WHERE id = ?',
        [name, phone, email, dob, gender, address, status, discountType || '', discountValue || 0, new Date().toISOString(), req.params.id]);
    res.json({ success: true });
});

router.delete('/students/:id', authMiddleware, checkPermission('students', 'delete'), (req, res) => {
    run('DELETE FROM enrollments WHERE student_id = ?', [req.params.id]);
    run('DELETE FROM attendances WHERE student_id = ?', [req.params.id]);
    run('DELETE FROM payment_records WHERE student_id = ?', [req.params.id]);
    run('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.get('/courses', authMiddleware, (req, res) => {
    const courses = all('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(courses);
});

router.post('/courses', authMiddleware, checkPermission('courses', 'add'), (req, res) => {
    const { id, name, instructor, month, fee, maxStudents, status, createdAt } = req.body;
    if (!name) return res.status(400).json({ error: 'Thiếu tên khóa học' });
    if (!instructor) return res.status(400).json({ error: 'Thiếu tên giảng viên' });
    run('INSERT OR REPLACE INTO courses (id, name, instructor, month, fee, max_students, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id || 'co_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), name, instructor, month || null, fee || 0, maxStudents || 30, status || 'Chưa bắt đầu', createdAt || new Date().toISOString()]);
    res.json({ success: true });
});

router.post('/courses/batch', authMiddleware, checkPermission('courses', 'add'), (req, res) => {
    const courses = req.body;
    if (!Array.isArray(courses)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const db = getDb();
    const stmt = db.prepare('INSERT OR REPLACE INTO courses (id, name, instructor, month, fee, max_students, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const c of courses) {
            stmt.run([c.id || 'co_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), c.name, c.instructor, c.month || null, c.fee || 0, c.maxStudents || c.max_students || 30, c.status || 'Chưa bắt đầu', c.createdAt || c.created_at || new Date().toISOString()]);
        }
        db.exec('COMMIT');
        persist();
    } catch (err) {
        db.exec('ROLLBACK');
        return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, count: courses.length });
});

router.put('/courses/:id', authMiddleware, checkPermission('courses', 'edit'), (req, res) => {
    const { name, instructor, month, fee, maxStudents, status } = req.body;
    const course = get('SELECT id FROM courses WHERE id = ?', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
    run('UPDATE courses SET name = ?, instructor = ?, month = ?, fee = ?, max_students = ?, status = ?, updated_at = ? WHERE id = ?',
        [name, instructor, month, fee, maxStudents, status, new Date().toISOString(), req.params.id]);
    res.json({ success: true });
});

router.delete('/courses/:id', authMiddleware, checkPermission('courses', 'delete'), (req, res) => {
    run('DELETE FROM enrollments WHERE course_id = ?', [req.params.id]);
    run('DELETE FROM attendances WHERE course_id = ?', [req.params.id]);
    run('DELETE FROM payment_records WHERE course_id = ?', [req.params.id]);
    run('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.get('/enrollments', authMiddleware, (req, res) => {
    const enrollments = all('SELECT * FROM enrollments ORDER BY created_at DESC');
    res.json(enrollments);
});

router.post('/enrollments', authMiddleware, checkPermission('enrollment', 'add'), (req, res) => {
    const { id, studentId, courseId, date, discountType, discountValue, createdAt } = req.body;
    if (!studentId || !courseId || !date) return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
    run('INSERT OR REPLACE INTO enrollments (id, student_id, course_id, date, discount_type, discount_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id || 'en_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), studentId, courseId, date, discountType || '', discountValue || 0, createdAt || new Date().toISOString()]);
    res.json({ success: true });
});

router.post('/enrollments/batch', authMiddleware, checkPermission('enrollment', 'add'), (req, res) => {
    const enrollments = req.body;
    if (!Array.isArray(enrollments)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const db = getDb();
    const stmt = db.prepare('INSERT OR REPLACE INTO enrollments (id, student_id, course_id, date, discount_type, discount_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const e of enrollments) {
            stmt.run([e.id || 'en_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), e.studentId || e.student_id, e.courseId || e.course_id, e.date, e.discountType || e.discount_type || '', e.discountValue || e.discount_value || 0, e.createdAt || e.created_at || new Date().toISOString()]);
        }
        db.exec('COMMIT');
        persist();
    } catch (err) {
        db.exec('ROLLBACK');
        return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, count: enrollments.length });
});

router.put('/enrollments/:id', authMiddleware, checkPermission('enrollment', 'edit'), (req, res) => {
    const { studentId, courseId, date, discountType, discountValue } = req.body;
    run('UPDATE enrollments SET student_id = ?, course_id = ?, date = ?, discount_type = ?, discount_value = ? WHERE id = ?',
        [studentId, courseId, date, discountType || '', discountValue || 0, req.params.id]);
    res.json({ success: true });
});

router.delete('/enrollments/:id', authMiddleware, checkPermission('enrollment', 'delete'), (req, res) => {
    run('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.get('/attendances', authMiddleware, (req, res) => {
    const attendances = all('SELECT * FROM attendances ORDER BY date DESC');
    res.json(attendances);
});

router.post('/attendances', authMiddleware, checkPermission('attendance', 'add'), (req, res) => {
    const { id, courseId, studentId, date, present, createdAt } = req.body;
    if (!courseId || !studentId || !date) return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
    run('INSERT OR REPLACE INTO attendances (id, course_id, student_id, date, present, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id || 'at_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), courseId, studentId, date, present ? 1 : 0, createdAt || new Date().toISOString()]);
    res.json({ success: true });
});

router.post('/attendances/batch', authMiddleware, checkPermission('attendance', 'add'), (req, res) => {
    const attendances = req.body;
    if (!Array.isArray(attendances)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const db = getDb();
    const stmt = db.prepare('INSERT OR REPLACE INTO attendances (id, course_id, student_id, date, present, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const a of attendances) {
            stmt.run([a.id || 'at_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), a.courseId || a.course_id, a.studentId || a.student_id, a.date, a.present ? 1 : 0, a.createdAt || a.created_at || new Date().toISOString()]);
        }
        db.exec('COMMIT');
        persist();
    } catch (err) {
        db.exec('ROLLBACK');
        return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, count: attendances.length });
});

router.put('/attendances/:id', authMiddleware, checkPermission('attendance', 'edit'), (req, res) => {
    const { courseId, studentId, date, present } = req.body;
    run('UPDATE attendances SET course_id = ?, student_id = ?, date = ?, present = ? WHERE id = ?',
        [courseId, studentId, date, present ? 1 : 0, req.params.id]);
    res.json({ success: true });
});

router.delete('/attendances/:id', authMiddleware, checkPermission('attendance', 'delete'), (req, res) => {
    run('DELETE FROM attendances WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.get('/payments', authMiddleware, (req, res) => {
    const payments = all('SELECT * FROM payment_records ORDER BY created_at DESC');
    res.json(payments);
});

router.post('/payments', authMiddleware, checkPermission('payment', 'add'), (req, res) => {
    const { id, studentId, courseId, month, status, method, createdAt } = req.body;
    if (!studentId || !courseId || !month) return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
    run('INSERT OR REPLACE INTO payment_records (id, student_id, course_id, month, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id || 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), studentId, courseId, month, status || 'Chưa thanh toán', method || '', createdAt || new Date().toISOString()]);
    res.json({ success: true });
});

router.post('/payments/batch', authMiddleware, checkPermission('payment', 'add'), (req, res) => {
    const payments = req.body;
    if (!Array.isArray(payments)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const db = getDb();
    const stmt = db.prepare('INSERT OR REPLACE INTO payment_records (id, student_id, course_id, month, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN TRANSACTION');
    try {
        for (const p of payments) {
            stmt.run([p.id || 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), p.studentId || p.student_id, p.courseId || p.course_id, p.month, p.status || 'Chưa thanh toán', p.method || '', p.createdAt || p.created_at || new Date().toISOString()]);
        }
        db.exec('COMMIT');
        persist();
    } catch (err) {
        db.exec('ROLLBACK');
        return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, count: payments.length });
});

router.put('/payments/:id', authMiddleware, checkPermission('payment', 'edit'), (req, res) => {
    const { studentId, courseId, month, status, method } = req.body;
    run('UPDATE payment_records SET student_id = ?, course_id = ?, month = ?, status = ?, method = ?, updated_at = ? WHERE id = ?',
        [studentId, courseId, month, status, method, new Date().toISOString(), req.params.id]);
    res.json({ success: true });
});

router.delete('/payments/:id', authMiddleware, checkPermission('payment', 'delete'), (req, res) => {
    run('DELETE FROM payment_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

router.get('/admins', authMiddleware, superOnly, (req, res) => {
    res.json(getAdmins());
});

router.post('/admins', authMiddleware, superOnly, (req, res) => {
    try {
        const admin = createAdmin(req.body);
        res.json(admin);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/admins/:id', authMiddleware, superOnly, (req, res) => {
    const admin = updateAdmin(req.params.id, req.body);
    if (!admin) return res.status(404).json({ error: 'Không tìm thấy admin' });
    res.json(admin);
});

router.delete('/admins/:id', authMiddleware, superOnly, (req, res) => {
    try {
        deleteAdmin(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/admins/:id/change-password', authMiddleware, superOnly, (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự' });
    }
    changePassword(req.params.id, password);
    res.json({ success: true });
});

module.exports = router;
