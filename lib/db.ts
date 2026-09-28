import pg from 'pg'
import type { PoolClient, QueryResult } from 'pg'

const { Pool } = pg

const globalForPg = globalThis as unknown as {
  _pgPool?: pg.Pool
}

export function getPool(): Pool {
  if (!globalForPg._pgPool) {
    const rawConn = process.env.DATABASE_URL
    const connectionString = rawConn ? rawConn.replace(/[?&]sslmode=[^&]+/g, '') : undefined
    const host = process.env.PGHOST
    const port = Number(process.env.PGPORT) || 21724
    const user = process.env.PGUSER
    const password = process.env.PGPASSWORD
    const database = process.env.PGDATABASE

    globalForPg._pgPool = new Pool({
      connectionString: connectionString || undefined,
      host: !connectionString ? host : undefined,
      port: !connectionString ? port : undefined,
      user: !connectionString ? user : undefined,
      password: !connectionString ? password : undefined,
      database: !connectionString ? database : undefined,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 2, // Conservative limit to avoid exhausting Aiven connection slots
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 5000,
    })

    globalForPg._pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err)
    })
  }

  return globalForPg._pgPool
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool()
  return p.query<T>(text, params)
}

export async function getClient(): Promise<PoolClient> {
  const p = getPool()
  return p.connect()
}
