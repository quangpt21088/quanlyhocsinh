const { Pool } = require('pg');
let pool = null;

// Expected schema for each table: column name -> { type, nullable, default }
const SCHEMA = {
    admins: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            username: { type: 'TEXT', nullable: false, default: null, isUnique: true },
            password_hash: { type: 'TEXT', nullable: false, default: null },
            name: { type: 'TEXT', nullable: false, default: null },
            role: { type: 'TEXT', nullable: false, default: "'admin'" },
            permissions: { type: 'TEXT', nullable: false, default: "'{}'" },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
    students: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            name: { type: 'TEXT', nullable: false, default: null },
            phone: { type: 'TEXT', nullable: true, default: "''" },
            email: { type: 'TEXT', nullable: true, default: "''" },
            dob: { type: 'TEXT', nullable: true, default: "''" },
            gender: { type: 'TEXT', nullable: true, default: "''" },
            address: { type: 'TEXT', nullable: true, default: "''" },
            status: { type: 'TEXT', nullable: false, default: "'Đang học'" },
            discount_type: { type: 'TEXT', nullable: true, default: "''" },
            discount_value: { type: 'REAL', nullable: true, default: '0' },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
    courses: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            name: { type: 'TEXT', nullable: false, default: null },
            instructor: { type: 'TEXT', nullable: false, default: null },
            month: { type: 'INTEGER', nullable: true, default: null },
            fee: { type: 'REAL', nullable: false, default: '0' },
            max_students: { type: 'INTEGER', nullable: true, default: '30' },
            status: { type: 'TEXT', nullable: false, default: "'Chưa bắt đầu'" },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
    enrollments: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            student_id: { type: 'TEXT', nullable: false, default: null },
            course_id: { type: 'TEXT', nullable: false, default: null },
            date: { type: 'TEXT', nullable: false, default: null },
            discount_type: { type: 'TEXT', nullable: true, default: "''" },
            discount_value: { type: 'REAL', nullable: true, default: '0' },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
    attendances: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            course_id: { type: 'TEXT', nullable: false, default: null },
            student_id: { type: 'TEXT', nullable: false, default: null },
            date: { type: 'TEXT', nullable: false, default: null },
            present: { type: 'INTEGER', nullable: false, default: '0' },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
    payment_records: {
        columns: {
            id: { type: 'TEXT', nullable: false, default: null, isPK: true },
            student_id: { type: 'TEXT', nullable: false, default: null },
            course_id: { type: 'TEXT', nullable: false, default: null },
            month: { type: 'TEXT', nullable: false, default: null },
            status: { type: 'TEXT', nullable: false, default: "'Chưa thanh toán'" },
            method: { type: 'TEXT', nullable: true, default: "''" },
            created_at: { type: 'TIMESTAMPTZ', nullable: false, default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', nullable: true, default: null },
        }
    },
};

const TABLES = Object.keys(SCHEMA);

async function tableExists(client, tableName) {
    const result = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [tableName]
    );
    return result.rows[0].exists;
}

async function getExistingColumns(client, tableName) {
    const result = await client.query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [tableName]
    );
    const cols = {};
    for (const row of result.rows) {
        cols[row.column_name] = {
            type: row.data_type.toUpperCase(),
            nullable: row.is_nullable === 'YES',
            default: row.column_default,
        };
    }
    return cols;
}

async function migrateTable(client, tableName) {
    const expected = SCHEMA[tableName].columns;
    const exists = await tableExists(client, tableName);

    if (!exists) {
        // Create table from scratch
        const colDefs = [];
        for (const [name, spec] of Object.entries(expected)) {
            let def = `"${name}" ${spec.type}`;
            if (!spec.nullable) def += ' NOT NULL';
            if (spec.default !== null) def += ` DEFAULT ${spec.default}`;
            if (spec.isPK) def += ' PRIMARY KEY';
            if (spec.isUnique) def += ' UNIQUE';
            colDefs.push(def);
        }
        await client.query(`CREATE TABLE "${tableName}" (${colDefs.join(', ')})`);
        console.log(`  ✓ Created table: ${tableName}`);
        return;
    }

    // Table exists — check for missing columns
    const existing = await getExistingColumns(client, tableName);
    const missing = [];
    for (const [name, spec] of Object.entries(expected)) {
        if (!(name in existing)) {
            missing.push({ name, spec });
        }
    }

    if (missing.length === 0) {
        console.log(`  ✓ Table OK: ${tableName}`);
        return;
    }

    for (const { name, spec } of missing) {
        let alter = `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${spec.type}`;
        if (!spec.nullable) alter += ' NOT NULL';
        if (spec.default !== null) alter += ` DEFAULT ${spec.default}`;
        await client.query(alter);
        console.log(`  ✓ Added column "${name}" to ${tableName}`);
    }
}

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
        console.log('Running database migrations...');
        for (const tableName of TABLES) {
            await migrateTable(client, tableName);
        }
        console.log('Migrations complete.');

        // Always ensure default super admin exists (upsert on username)
        const id = 'super_default_001';
        await client.query(
            'INSERT INTO admins (id, username, password_hash, name, role, permissions) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO UPDATE SET id=$1, password_hash=$3, role=$5',
            [id, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Super Admin', 'super', '{}']
        );
        console.log('Default super admin ensured: admin / admin');
    } finally {
        client.release();
    }
}

function getPool() { return pool; }

module.exports = { init, getPool };