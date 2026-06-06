const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Use /tmp for Railway ephemeral filesystem, fallback to local data dir
const DB_PATH = process.env.DB_PATH || (
    process.env.RAILWAY_ENVIRONMENT
        ? '/tmp/app.db'
        : path.join(__dirname, '..', 'data', 'app.db')
);

let db = null;
let SQL = null;

async function init() {
    SQL = await initSqlJs();

    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            permissions TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            dob TEXT DEFAULT '',
            gender TEXT DEFAULT '',
            address TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Đang học',
            discount_type TEXT DEFAULT '',
            discount_value REAL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            instructor TEXT NOT NULL,
            month INTEGER,
            fee REAL NOT NULL DEFAULT 0,
            max_students INTEGER DEFAULT 30,
            status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            date TEXT NOT NULL,
            discount_type TEXT DEFAULT '',
            discount_value REAL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS attendances (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            date TEXT NOT NULL,
            present INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS payment_records (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            month TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Chưa thanh toán',
            method TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        );
    `);

    const superAdmin = db.exec("SELECT id FROM admins WHERE role = 'super' LIMIT 1");
    if (superAdmin.length === 0 || superAdmin[0].values.length === 0) {
        const id = 'super_' + Date.now();
        db.run('INSERT INTO admins (id, username, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
            [id, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Super Admin', 'super', '{}']);
    }

    persist();
}

function persist() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
    return db;
}

module.exports = { init, getDb, persist };
