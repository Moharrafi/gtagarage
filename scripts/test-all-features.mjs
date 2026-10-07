async function runTests() {
  console.log('====================================================')
  console.log('🧪 RUNNING FULL SUITE OF FEATURE & API TESTS')
  console.log('====================================================\n')

  const baseUrl = 'http://localhost:3000'
  let passCount = 0
  let failCount = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passCount++
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`)
      failCount++
    }
  }

  // 1. TEST BOOTSTRAP ENDPOINT
  console.log('--- 1. Testing Bootstrap (App Shell Load) ---')
  const bootRes = await fetch(`${baseUrl}/api/bootstrap`).then(r => r.json())
  assert(bootRes.success === true, 'Bootstrap API returns success: true')
  assert(bootRes.data.workOrders.length >= 8, `Bootstrap contains ${bootRes.data.workOrders?.length} work orders (expected >= 8)`)
  assert(bootRes.data.invoices.length >= 6, `Bootstrap contains ${bootRes.data.invoices?.length} invoices (expected >= 6)`)
  assert(bootRes.data.inventory.parts.length >= 16, `Bootstrap contains ${bootRes.data.inventory.parts?.length} parts (expected >= 16)`)
  assert(bootRes.data.technicians.length >= 5, `Bootstrap contains ${bootRes.data.technicians?.length} technicians (expected >= 5)`)
  assert(bootRes.data.serviceRates.length >= 12, `Bootstrap contains ${bootRes.data.serviceRates?.length} service rates (expected >= 12)`)
  assert(bootRes.data.vouchers.length >= 7, `Bootstrap contains ${bootRes.data.vouchers?.length} vouchers (expected >= 7)`)
  assert(bootRes.data.settings.profile.name === 'GTA GARAGE', `Workshop profile name is "GTA GARAGE" (got "${bootRes.data.settings?.profile?.name}")`)
  assert(bootRes.data.notifications.length >= 6, `Bootstrap contains ${bootRes.data.notifications?.length} notifications (expected >= 6)`)

  // 2. TEST WORK ORDERS CRUD
  console.log('\n--- 2. Testing Work Orders (Pekerjaan) CRUD ---')
  const testWoId = `test-wo-${Date.now()}`
  const createWoRes = await fetch(`${baseUrl}/api/work-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testWoId,
      code: 'WO-TEST-99',
      customer: { id: 'c-test', name: 'Tester Budi', phone: '081233334444', initials: 'TB' },
      vehicle: { id: 'v-test', plate: 'B 9999 TST', brand: 'Yamaha', model: 'Aerox 155', year: 2022, color: 'Hitam' },
      service: 'Servis',
      complaint: 'Uji coba penambahan order baru',
      status: 'Antrian',
      technician: 'Bayu Saputra',
      laborCost: 80000,
      usedParts: [{ partId: 'p-8', name: 'Oli Motul 5100', qty: 1, price: 155000 }],
      estimatedDone: 'Besok',
    })
  }).then(r => r.json())
  assert(createWoRes.success === true, 'Create Work Order successful')

  // Read back
  const listWoRes = await fetch(`${baseUrl}/api/work-orders`).then(r => r.json())
  const foundWo = listWoRes.data.find(w => w.id === testWoId)
  assert(foundWo && foundWo.code === 'WO-TEST-99', 'Created Work Order found in GET list')

  // Update
  const updateWoRes = await fetch(`${baseUrl}/api/work-orders`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testWoId,
      status: 'Dikerjakan',
      progress: 60,
      laborCost: 95000,
    })
  }).then(r => r.json())
  assert(updateWoRes.success === true, 'Update Work Order status to Dikerjakan successful')

  // Delete
  const delWoRes = await fetch(`${baseUrl}/api/work-orders?id=${testWoId}`, { method: 'DELETE' }).then(r => r.json())
  assert(delWoRes.success === true, 'Delete Work Order successful')

  // 3. TEST INVENTORY (Stok Suku Cadang) & STOCK IN / STOCK OUT
  console.log('\n--- 3. Testing Inventory, Stock-In & Stock-Out ---')
  const invRes = await fetch(`${baseUrl}/api/inventory`).then(r => r.json())
  assert(invRes.success === true, 'Inventory list retrieved')
  const samplePart = invRes.data.find(p => p.sku === 'OIL-MTL-5100')
  assert(samplePart !== undefined, 'Sample part Motul 5100 found')

  const initialStock = samplePart.stock
  // Test Stock In (+5 units)
  const stockInRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'stock-in',
      id: samplePart.id,
      qty: 5,
      unitCost: 115000,
    })
  }).then(r => r.json())
  assert(stockInRes.success === true, 'Stock In action (+5 units) succeeded')

  // Verify stock increased
  const invAfterIn = await fetch(`${baseUrl}/api/inventory`).then(r => r.json())
  const partAfterIn = invAfterIn.data.find(p => p.id === samplePart.id)
  assert(partAfterIn.stock === initialStock + 5, `Stock increased correctly from ${initialStock} to ${partAfterIn.stock}`)

  // Test Stock Out (-5 units)
  const stockOutRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'stock-out',
      id: samplePart.id,
      qty: 5,
      reason: 'Uji Coba Pengurangan Stok'
    })
  }).then(r => r.json())
  assert(stockOutRes.success === true, 'Stock Out action (-5 units) succeeded')

  // Verify stock reverted
  const invAfterOut = await fetch(`${baseUrl}/api/inventory`).then(r => r.json())
  const partAfterOut = invAfterOut.data.find(p => p.id === samplePart.id)
  assert(partAfterOut.stock === initialStock, `Stock reverted correctly to ${partAfterOut.stock}`)

  // Check low stock count (expected >= 3)
  const lowStockParts = invAfterOut.data.filter(p => p.stock <= p.minStock)
  assert(lowStockParts.length >= 3, `Low stock filter detected ${lowStockParts.length} critical items (expected >= 3)`)

  // 4. TEST INVOICE & CASHIER
  console.log('\n--- 4. Testing Invoices & Cashier ---')
  const testInvId = `test-inv-${Date.now()}`
  const createInvRes = await fetch(`${baseUrl}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testInvId,
      number: 'INV/TEST/999',
      workOrderCode: 'WO-2401',
      customer: { id: 'c-test', name: 'Tester Budi', phone: '081233334444', initials: 'TB' },
      vehicle: { id: 'v-test', plate: 'B 9999 TST', brand: 'Yamaha', model: 'Aerox 155', year: 2022, color: 'Hitam' },
      service: 'Servis',
      items: [
        { label: 'Jasa Tune Up', qty: 1, price: 75000 },
        { label: 'Oli Mesin', qty: 1, price: 155000 }
      ],
      status: 'Belum Bayar',
      date: '7 Okt 2026',
      paidAmount: 0,
      discountAmount: 0,
    })
  }).then(r => r.json())
  assert(createInvRes.success === true, 'Create Invoice successful')

  // Update Invoice Payment (Simulate Cash Payment)
  const updateInvRes = await fetch(`${baseUrl}/api/invoices`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testInvId,
      status: 'Lunas',
      method: 'Tunai',
      paidAmount: 230000,
      paidAt: '10:30 WIB',
    })
  }).then(r => r.json())
  assert(updateInvRes.success === true, 'Update Invoice payment status to Lunas successful')

  // Verify Invoice in list
  const invList = await fetch(`${baseUrl}/api/invoices`).then(r => r.json())
  const foundInv = invList.data.find(i => i.id === testInvId)
  assert(foundInv && foundInv.status === 'Lunas' && foundInv.paidAmount === 230000, 'Paid invoice verified in database')

  // Clean up test invoice
  const delInvRes = await fetch(`${baseUrl}/api/invoices?id=${testInvId}`, { method: 'DELETE' }).then(r => r.json())
  assert(delInvRes.success === true, 'Delete Test Invoice successful')

  // 5. TEST TECHNICIANS, SERVICE RATES & VOUCHERS
  console.log('\n--- 5. Testing Settings (Technicians, Rates, Vouchers) ---')
  const techRes = await fetch(`${baseUrl}/api/technicians`).then(r => r.json())
  assert(techRes.success === true && techRes.data.length >= 5, `Technicians API returned ${techRes.data?.length} mechanics`)

  const ratesRes = await fetch(`${baseUrl}/api/service-rates`).then(r => r.json())
  assert(ratesRes.success === true && ratesRes.data.length >= 12, `Service Rates API returned ${ratesRes.data?.length} rates`)

  const vouchersRes = await fetch(`${baseUrl}/api/vouchers`).then(r => r.json())
  assert(vouchersRes.success === true && vouchersRes.data.length >= 7, `Vouchers API returned ${vouchersRes.data?.length} vouchers`)

  // Test voucher toggle
  const sampleVoucher = vouchersRes.data[0]
  const toggleRes = await fetch(`${baseUrl}/api/vouchers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sampleVoucher.id, action: 'toggle' })
  }).then(r => r.json())
  assert(toggleRes.success === true, `Toggle voucher ${sampleVoucher.code} successful`)
  // Toggle back
  await fetch(`${baseUrl}/api/vouchers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sampleVoucher.id, action: 'toggle' })
  })

  // 6. TEST NOTIFICATIONS
  console.log('\n--- 6. Testing Notifications ---')
  const notifRes = await fetch(`${baseUrl}/api/notifications`).then(r => r.json())
  assert(notifRes.success === true && notifRes.data.length >= 6, `Notifications API returned ${notifRes.data?.length} items`)

  // Mark all read
  const markReadRes = await fetch(`${baseUrl}/api/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark-all-read' })
  }).then(r => r.json())
  assert(markReadRes.success === true, 'Mark all notifications as read successful')

  console.log('\n====================================================')
  console.log(`🏁 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('====================================================\n')
  process.exit(failCount > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
