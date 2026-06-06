const { Pool } = require('pg');
let pool = null;

async function init() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }
    pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS admins (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            permissions TEXT NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
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
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            instructor TEXT NOT NULL,
            month INTEGER,
            fee REAL NOT NULL DEFAULT 0,
            max_students INTEGER DEFAULT 30,
            status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            date TEXT NOT NULL,
            discount_type TEXT DEFAULT '',
            discount_value REAL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS attendances (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            date TEXT NOT NULL,
            present INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS payment_records (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            month TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Chưa thanh toán',
            method TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );`);
        const superAdmin = await client.query("SELECT id FROM admins WHERE role = 'super' LIMIT 1");
        if (superAdmin.rows.length === 0) {
            const id = 'super_' + Date.now();
            await client.query(
                'INSERT INTO admins (id, username, password_hash, name, role, permissions) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Super Admin', 'super', '{}']
            );
        }
    } finally {
        client.release();
    }
}

function getPool() { return pool; }

module.exports = { init, getPool };