import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 21724,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
})

async function initDb() {
  const client = await pool.connect()
  console.log('🚀 Connected to PostgreSQL database: gtagarage')

  try {
    await client.query('BEGIN')

    // 1. Work Orders
    console.log('Creating table work_orders...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        customer JSONB NOT NULL,
        vehicle JSONB NOT NULL,
        service VARCHAR(100) NOT NULL,
        complaint TEXT,
        status VARCHAR(50) NOT NULL,
        technician VARCHAR(100),
        progress INT DEFAULT 0,
        labor_cost NUMERIC DEFAULT 0,
        used_parts JSONB DEFAULT '[]'::jsonb,
        estimated_done VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 2. Invoices
    console.log('Creating table invoices...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(100) PRIMARY KEY,
        number VARCHAR(100) UNIQUE NOT NULL,
        work_order_code VARCHAR(50),
        customer JSONB NOT NULL,
        vehicle JSONB NOT NULL,
        service VARCHAR(100) NOT NULL,
        items JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) NOT NULL,
        method VARCHAR(50),
        date VARCHAR(50),
        paid_amount NUMERIC DEFAULT 0,
        discount_type VARCHAR(50),
        discount_code VARCHAR(100),
        discount_amount NUMERIC DEFAULT 0,
        admin_fee NUMERIC DEFAULT 0,
        payment_ref VARCHAR(100),
        paid_at VARCHAR(50),
        bank_name VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 3. Parts (Inventory)
    console.log('Creating table parts...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS parts (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 0,
        price NUMERIC DEFAULT 0,
        used_in_orders JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 4. Service Rates
    console.log('Creating table service_rates...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_rates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC DEFAULT 0,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 5. Technicians
    console.log('Creating table technicians...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        initials VARCHAR(10),
        active_jobs INT DEFAULT 0,
        completed_this_month INT DEFAULT 0,
        avg_hours NUMERIC DEFAULT 0,
        efficiency INT DEFAULT 0,
        phone VARCHAR(50),
        specialty VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Aktif',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 6. Vouchers
    console.log('Creating table vouchers...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        value NUMERIC NOT NULL,
        max_discount NUMERIC,
        min_purchase NUMERIC DEFAULT 0,
        valid_until VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        target_service VARCHAR(100) DEFAULT 'Semua Layanan',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 7. Workshop Profile
    console.log('Creating table workshop_profile...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS workshop_profile (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slogan TEXT,
        phone VARCHAR(50),
        address TEXT,
        hours VARCHAR(150),
        owner VARCHAR(150),
        receipt_warranty TEXT,
        receipt_website TEXT,
        receipt_footer_msg TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 8. Midtrans Config
    console.log('Creating table midtrans_config...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS midtrans_config (
        id VARCHAR(50) PRIMARY KEY,
        enabled BOOLEAN DEFAULT TRUE,
        environment VARCHAR(20) DEFAULT 'sandbox',
        client_key VARCHAR(255),
        server_key VARCHAR(255),
        merchant_id VARCHAR(100),
        charge_admin_fee_to_customer BOOLEAN DEFAULT TRUE,
        va_admin_fee NUMERIC DEFAULT 4000,
        qris_admin_fee NUMERIC DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 9. Categories
    console.log('Creating table categories...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 10. Notifications
    console.log('Creating table notifications...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        time VARCHAR(50),
        channel VARCHAR(100),
        status VARCHAR(50) DEFAULT 'terkirim',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        link_tab VARCHAR(50)
      );
    `)

    // 11. Push Subscriptions (Web Push Devices)
    console.log('Creating table push_subscriptions...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        keys JSONB NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // 12. Users
    console.log('Creating table users...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await client.query('COMMIT')
    console.log('✅ All 12 tables created successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error initializing tables:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

initDb().catch((e) => {
  console.error(e)
  process.exit(1)
})
