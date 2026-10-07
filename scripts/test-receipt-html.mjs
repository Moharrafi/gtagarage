import { generateThermalReceiptHtml } from "../lib/print-receipt.ts"
import { invoices } from "../lib/data.ts"

const profile = {
  name: "GTA GARAGE",
  slogan: "Motorcycle Studio & Garage\nSpesialis Restorasi & Vapor Blasting",
  phone: "0812-8888-9102",
  address: "Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur",
  hours: "Senin - Sabtu: 08.30 - 18.00 WIB",
  owner: "Budi Santoso",
  receiptWarranty: "Garansi servis 7 hari / 500 km",
  receiptWebsite: "www.gtagarage.id",
  receiptFooterMsg: "*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***",
}

console.log("Testing with", invoices.length, "invoices");
for (const inv of invoices) {
  const html = generateThermalReceiptHtml(inv, profile)
  if (!html.includes(inv.number)) {
    throw new Error(`Receipt HTML missing invoice number ${inv.number}`)
  }
  if (!html.includes("GTA GARAGE")) {
    throw new Error(`Receipt HTML missing workshop name for ${inv.number}`)
  }
  if (!html.includes("STATUS PEMBAYARAN")) {
    throw new Error(`Receipt HTML missing payment status for ${inv.number}`)
  }
}
console.log("ALL", invoices.length, "INVOICE RECEIPTS GENERATED SUCCESSFULLY WITH HTML & CSS STYLING!");
