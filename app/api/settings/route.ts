import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'
import type { WorkshopProfile, MidtransConfig } from '@/lib/store'

export async function GET() {
  try {
    const [pRes, mRes, cRes] = await Promise.all([
      query('SELECT * FROM workshop_profile WHERE id = $1', ['default']),
      query('SELECT * FROM midtrans_config WHERE id = $1', ['default']),
      query('SELECT name FROM categories ORDER BY name ASC'),
    ])

    let profile: WorkshopProfile | null = null
    if (pRes.rows.length > 0) {
      const r = pRes.rows[0]
      profile = {
        name: r.name,
        slogan: r.slogan || '',
        phone: r.phone || '',
        address: r.address || '',
        hours: r.hours || '',
        owner: r.owner || '',
        receiptWarranty: r.receipt_warranty || '',
        receiptWebsite: r.receipt_website || '',
        receiptFooterMsg: r.receipt_footer_msg || '',
      }
    }

    let midtransConfig: MidtransConfig | null = null
    if (mRes.rows.length > 0) {
      const r = mRes.rows[0]
      midtransConfig = {
        enabled: r.enabled ?? true,
        environment: r.environment || 'sandbox',
        clientKey: r.client_key || '',
        serverKey: r.server_key || '',
        merchantId: r.merchant_id || '',
        chargeAdminFeeToCustomer: r.charge_admin_fee_to_customer ?? true,
        vaAdminFee: Number(r.va_admin_fee) || 4000,
        qrisAdminFee: Number(r.qris_admin_fee) || 0,
      }
    }

    const categories = cRes.rows.map((row) => row.name)

    return NextResponse.json({
      success: true,
      data: {
        profile,
        midtransConfig,
        categories,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()

    if (body.profile) {
      const p: Partial<WorkshopProfile> = body.profile
      await query(
        `UPDATE workshop_profile SET
           name = COALESCE($1, name),
           slogan = COALESCE($2, slogan),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           hours = COALESCE($5, hours),
           owner = COALESCE($6, owner),
           receipt_warranty = COALESCE($7, receipt_warranty),
           receipt_website = COALESCE($8, receipt_website),
           receipt_footer_msg = COALESCE($9, receipt_footer_msg),
           updated_at = NOW()
         WHERE id = 'default'`,
        [
          p.name,
          p.slogan,
          p.phone,
          p.address,
          p.hours,
          p.owner,
          p.receiptWarranty,
          p.receiptWebsite,
          p.receiptFooterMsg,
        ]
      )
    }

    if (body.midtransConfig) {
      const m: Partial<MidtransConfig> = body.midtransConfig
      await query(
        `UPDATE midtrans_config SET
           enabled = COALESCE($1, enabled),
           environment = COALESCE($2, environment),
           client_key = COALESCE($3, client_key),
           server_key = COALESCE($4, server_key),
           merchant_id = COALESCE($5, merchant_id),
           charge_admin_fee_to_customer = COALESCE($6, charge_admin_fee_to_customer),
           va_admin_fee = COALESCE($7, va_admin_fee),
           qris_admin_fee = COALESCE($8, qris_admin_fee),
           updated_at = NOW()
         WHERE id = 'default'`,
        [
          m.enabled,
          m.environment,
          m.clientKey,
          m.serverKey,
          m.merchantId,
          m.chargeAdminFeeToCustomer,
          m.vaAdminFee,
          m.qrisAdminFee,
        ]
      )
    }

    return NextResponse.json({ success: true, message: 'Settings updated.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, name } = await req.json()
    if (action === 'add-category' && name) {
      const id = `cat-${name.toLowerCase().replace(/\s+/g, '-')}`
      await query(
        'INSERT INTO categories (id, name, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (name) DO NOTHING',
        [id, name]
      )
      return NextResponse.json({ success: true, message: 'Kategori ditambahkan.' })
    }
    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    if (category) {
      await query('DELETE FROM categories WHERE name = $1', [category])
      return NextResponse.json({ success: true, message: 'Kategori dihapus.' })
    }
    return NextResponse.json({ success: false, message: 'Missing parameter' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
