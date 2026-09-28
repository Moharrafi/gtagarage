import pg from 'pg'
import type { PoolClient, QueryResult } from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    const host = process.env.PGHOST
    const port = Number(process.env.PGPORT) || 21724
    const user = process.env.PGUSER
    const password = process.env.PGPASSWORD
    const database = process.env.PGDATABASE

    pool = new Pool({
      connectionString: connectionString || undefined,
      host: !connectionString ? host : undefined,
      port: !connectionString ? port : undefined,
      user: !connectionString ? user : undefined,
      password: !connectionString ? password : undefined,
      database: !connectionString ? database : undefined,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err)
    })
  }

  return pool
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
