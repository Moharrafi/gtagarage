import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      orderId,
      amount,
      customerName,
      customerPhone,
      serverKey,
      environment = "sandbox",
    } = body

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: "Order ID dan nominal tagihan wajib disertakan." },
        { status: 400 }
      )
    }

    // Clean server key
    const cleanKey = (serverKey || "").trim()

    if (!cleanKey) {
      return NextResponse.json({
        success: false,
        isMock: true,
        message: "Server Key Midtrans belum diisi. Masukkan Server Key di menu Pengaturan Bengkel > Midtrans Gateway untuk menghubungkan API langsung.",
      })
    }

    const host =
      environment === "production"
        ? "https://api.midtrans.com"
        : "https://api.sandbox.midtrans.com"

    const authHeader = `Basic ${Buffer.from(cleanKey + ":").toString("base64")}`

    // Safe transaction order_id (alphanumeric, dash, underscore only, with timestamp)
    const sanitizedOrderId = `${orderId.replace(/[^a-zA-Z0-9-_]/g, "-")}-${Date.now().toString().slice(-6)}`

    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: sanitizedOrderId,
        gross_amount: Math.round(Number(amount)),
      },
      customer_details: {
        first_name: customerName || "Pelanggan",
        phone: customerPhone || undefined,
      },
      qris: {
        acquirer: "gopay",
      },
    }

    const midtransRes = await fetch(`${host}/v2/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    const data = await midtransRes.json()

    if (midtransRes.ok && (data.status_code === "201" || data.status_code === "200")) {
      const qrAction = (data.actions || []).find(
        (a: { name: string; url: string }) => a.name === "generate-qr-code"
      )

      return NextResponse.json({
        success: true,
        isMock: false,
        transactionId: data.transaction_id,
        orderId: data.order_id,
        grossAmount: data.gross_amount,
        status: data.transaction_status,
        qrImageUrl: qrAction ? qrAction.url : null,
        qrString: data.qr_string || null,
        data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          isMock: false,
          message: data.status_message || "Gagal membuat transaksi di Midtrans API.",
          data,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Midtrans Charge Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal saat menghubungi Midtrans.",
      },
      { status: 500 }
    )
  }
}
