import { chromium } from 'playwright'
import { execSync } from 'child_process'

async function runTests() {
  console.log('🔄 Seeding database for clean E2E test run...')
  execSync('pnpm --filter backend db:seed', { stdio: 'ignore' })
  console.log('🚀 Starting E2E Manual & Automated UI/CRUD Testing...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (text.includes('401') || text.includes('/auth/login')) return
      console.error(`[Browser Console Error]`, text)
      consoleErrors.push(text)
    }
  })
  page.on('pageerror', err => {
    console.error(`[Uncaught Page Error]`, err.message)
    consoleErrors.push(err.message)
  })

  // 1. Visit Home
  console.log('\n--- Test 1: Load Homepage and Navigation ---')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')

  const title = await page.textContent('body')
  if (!title.includes('Reserve a Room')) {
    throw new Error('Homepage did not load expected header text')
  }
  if (title.includes('MeetSpace')) {
    throw new Error('MeetSpace logo and brand text should have been removed')
  }
  const docTitle = await page.title()
  if (docTitle !== 'BookSpace') {
    throw new Error(`Expected document title to be 'BookSpace', got '${docTitle}'`)
  }
  const faviconHref = await page.getAttribute('link[rel="icon"]', 'href')
  if (!faviconHref || !faviconHref.includes('favicon.png')) {
    throw new Error(`Expected favicon link to /favicon.png, got '${faviconHref}'`)
  }
  console.log(`✔ Homepage loaded: title "${docTitle}" and favicon "${faviconHref}" verified`)

  // Check room cards on Reservation Page
  const roomCardCount = await page.locator('button:has-text("Capacity")').count()
  console.log(`✔ Found ${roomCardCount} active room cards on Reservation Page`)
  if (roomCardCount === 0) throw new Error('No rooms rendered')

  // 2. Booking Flow
  // 2. Booking Flow (Default Pending Status)
  console.log('\n--- Test 2: Booking Form & Pending Default Status Flow ---')
  // Click on the first room (e.g. Archipelago)
  await page.locator('button:has-text("Archipelago")').first().click()
  await page.waitForSelector('text=Availability —')
  console.log('✔ Opened Archipelago room booking form')

  // Check form fields
  await page.fill('input[placeholder*="Planning Review"]', 'E2E Pending Approval Sync')
  await page.fill('input[placeholder="Full name"]', 'Antigravity Tester')
  await page.fill('input[placeholder="you@company.co"]', 'tester@company.co')
  await page.fill('input[placeholder*="Max"]', '6')
  await page.fill('textarea[placeholder*="special requirements"]', 'Need HDMI adapter')

  // Select a time slot that does not conflict (e.g. 16:00 - 17:00)
  const startSelect = page.locator('select').first()
  await startSelect.selectOption('16:00')
  const endSelect = page.locator('select').nth(1)
  await endSelect.selectOption('17:00')

  // Submit booking
  await page.click('button:has-text("Confirm Booking")')
  await page.waitForSelector('text=Booking Requested')
  console.log('✔ Booking Requested screen displayed (default status is pending, not auto-confirmed)!')

  const confirmText = await page.textContent('body')
  if (!confirmText.includes('E2E Pending Approval Sync') || !confirmText.includes('Antigravity Tester')) {
    throw new Error('Booking confirmation details mismatch')
  }
  if (!confirmText.includes('pending')) {
    throw new Error('Booking status badge on confirmation screen should be pending')
  }
  console.log('✔ Booking details and "pending" status badge verified on confirmation screen')

  // Book another room button
  await page.click('button:has-text("Book Another Room")')
  await page.waitForSelector('text=Reserve a Room')
  console.log('✔ Navigated back from confirmation screen to room list')

  // 3. My Bookings Lookup
  console.log('\n--- Test 3: My Bookings Lookup (Displays Pending Status) ---')
  await page.click('button:has-text("My Bookings")')
  await page.fill('input[type="email"]', 'tester@company.co')
  await page.click('button:has-text("Search")')
  await page.waitForSelector('text=E2E Pending Approval Sync')
  const myBookingRow = page.locator('div:has-text("E2E Pending Approval Sync")').first()
  const pendingBadgeCount = await myBookingRow.locator('.badge-pending').count()
  if (pendingBadgeCount === 0) {
    throw new Error('Expected booking in My Bookings to display pending badge')
  }
  console.log('✔ "My Bookings" lookup found the newly created booking with pending status badge')

  // 4. Room Status / Occupancy Page
  console.log('\n--- Test 4: Occupancy / Room Status Page ---')
  await page.click('button:has-text("Room Status")')
  await page.waitForSelector('h1:has-text("Room Status")')
  const occupancyText = await page.textContent('body')
  if (!occupancyText.includes('available') || !occupancyText.includes('occupied')) {
    throw new Error('Occupancy stats not rendered')
  }

  // Verify status shows "Free" for rooms with bookings today, and timeline bars have hour ticks
  await page.waitForSelector('div:has-text("Free")')
  const hasFreeLabel = await page.locator('div:has-text("Free")').count()
  if (hasFreeLabel === 0) {
    throw new Error('Expected at least one room to show "Free" status for partially booked rooms')
  }
  console.log('✔ Room Status page shows "Free" (instead of "Free all day") for rooms with bookings today')

  // Check timeline bar hour ticks exist on Room Status page
  const timelineTicks = await page.locator('span:has-text("08")').count()
  if (timelineTicks === 0) {
    throw new Error('Room timeline hour markers not found on Room Status page')
  }
  console.log('✔ Room Status page rendered unified timeline bar with hour ticks matching Book a Room')

  // 5. Admin Page Login & Dashboard
  console.log('\n--- Test 5: Admin Login & Overview ---')
  await page.click('button:has-text("Admin")')
  await page.waitForSelector('h1:has-text("Admin Access")')

  // Test invalid password
  await page.fill('input[type="password"]', 'wrongpass')
  await page.click('button:has-text("Sign In")')
  await page.waitForSelector('text=Incorrect password')
  console.log('✔ Invalid password rejected with proper error message')

  // Test correct password
  await page.fill('input[type="password"]', 'admin')
  await page.click('button:has-text("Sign In")')
  await page.waitForSelector('h1:has-text("Admin Dashboard")')
  console.log('✔ Signed in as Admin successfully')

  // Overview Tab
  await page.waitForSelector('text=Active rooms')
  await page.waitForSelector('text=Recent bookings')
  await page.waitForSelector('text=Most booked rooms')
  console.log('✔ Admin Overview tab loaded stats, recent bookings, and room usage')

  // 6. Admin Rooms Management CRUD
  console.log('\n--- Test 6: Admin Rooms Management CRUD ---')
  await page.click('button:has-text("Rooms")')
  await page.waitForSelector('button:has-text("+ Add Room")')

  // Create new room
  const testCode = 'EX-' + Math.floor(100 + Math.random() * 900)
  await page.click('button:has-text("+ Add Room")')
  await page.waitForSelector('text=New Room')
  await page.locator('input[type="text"]').nth(0).fill('Bromo Executive')
  await page.locator('input[type="text"]').nth(1).fill(testCode)
  await page.locator('input[type="text"]').nth(2).fill('Tower 2')
  await page.locator('input[type="number"]').nth(0).fill('16')
  await page.locator('input[type="number"]').nth(1).fill('5')
  // Check projector and tv
  await page.locator('label:has-text("Projector") input').check()
  await page.locator('label:has-text("TV Screen") input').check()
  await page.click('button:has-text("Save")')
  await page.waitForSelector('td:has-text("Bromo Executive")')
  console.log(`✔ Created new room "Bromo Executive" (${testCode})`)

  // Edit room
  const editBtn = page.locator(`tr:has-text("${testCode}") button:has-text("Edit")`)
  await editBtn.click()
  await page.waitForSelector('text=Edit Bromo Executive')
  await page.locator('input[type="text"]').nth(0).fill('Bromo Executive VIP')
  await page.click('button:has-text("Save")')
  await page.waitForSelector(`tr:has-text("${testCode}") td:has-text("Bromo Executive VIP")`)
  console.log('✔ Updated room name to "Bromo Executive VIP"')

  // Toggle room active state
  const statusToggleBtn = page.locator(`tr:has-text("${testCode}") button:has-text("Active")`)
  await statusToggleBtn.click()
  await page.waitForSelector(`tr:has-text("${testCode}") button:has-text("Inactive")`)
  console.log('✔ Deactivated room successfully (status changed to Inactive)')

  // Re-activate room
  await page.locator(`tr:has-text("${testCode}") button:has-text("Inactive")`).click()
  await page.waitForSelector(`tr:has-text("${testCode}") button:has-text("Active")`)
  console.log('✔ Reactivated room successfully')

  // 7. Admin Bookings Tab - Verification & Approval Flow
  console.log('\n--- Test 7: Admin Bookings Tab & Approve Verification Flow ---')
  await page.click('button:has-text("Bookings")')
  await page.waitForSelector('th:has-text("Title")')
  const bookingsRowCount = await page.locator('tbody tr').count()
  console.log(`✔ Bookings table rendered with ${bookingsRowCount} bookings`)

  // Test filter status: pending
  const statusSelect = page.locator('select').nth(1)
  await statusSelect.selectOption('pending')
  await page.waitForTimeout(500)
  await page.waitForSelector('tr:has-text("E2E Pending Approval Sync")')
  console.log('✔ Filtered bookings by "pending" status, found test booking')

  // Verify "Approve" and "Reject" buttons exist for pending booking
  const pendingRow = page.locator('tr:has-text("E2E Pending Approval Sync")')
  const approveBtn = pendingRow.locator('button:has-text("Approve")')
  const rejectBtn = pendingRow.locator('button:has-text("Reject")')
  if ((await approveBtn.count()) === 0 || (await rejectBtn.count()) === 0) {
    throw new Error('Approve or Reject button missing on pending booking row')
  }
  console.log('✔ Pending booking row contains both "Approve" and "Reject" buttons')

  // Click "Approve" as admin verification
  await approveBtn.click()
  await page.waitForTimeout(600)
  console.log('✔ Clicked "Approve" button to verify booking')

  // Switch filter to "confirmed" and verify booking status is now confirmed
  await statusSelect.selectOption('confirmed')
  await page.waitForTimeout(500)
  await page.waitForSelector('tr:has-text("E2E Pending Approval Sync")')
  const confirmedRow = page.locator('tr:has-text("E2E Pending Approval Sync")')
  const confirmedBadge = confirmedRow.locator('.badge-available:has-text("confirmed")')
  if ((await confirmedBadge.count()) === 0) {
    throw new Error('Booking status was not updated to confirmed after admin approval')
  }
  const cancelAfterApproveBtn = confirmedRow.locator('button:has-text("Cancel")')
  if ((await cancelAfterApproveBtn.count()) === 0) {
    throw new Error('Expected Cancel button after booking confirmed')
  }
  console.log('✔ Booking status successfully verified and updated to "confirmed" with Cancel option!')

  // Cancel booking to leave state clean
  await cancelAfterApproveBtn.click()
  await page.waitForTimeout(500)
  console.log('✔ Booking cancelled cleanly')

  // 8. Admin Settings Tab
  console.log('\n--- Test 8: Admin Settings Tab ---')
  await page.click('button:has-text("Settings")')
  await page.waitForSelector('h3:has-text("Operating Hours")')

  const minDurationInput = page.locator('input[type="number"]').first()
  await minDurationInput.fill('45')
  await page.click('button:has-text("Save Settings")')
  await page.waitForSelector('text=✓ Saved')
  console.log('✔ Settings updated and saved successfully')

  // Restore min duration to 60
  await minDurationInput.fill('60')
  await page.click('button:has-text("Save Settings")')
  await page.waitForSelector('text=✓ Saved')
  console.log('✔ Restored min duration setting to 60')

  // 9. Sign Out
  console.log('\n--- Test 9: Sign Out ---')
  await page.click('button:has-text("Sign out")')
  await page.waitForSelector('h1:has-text("Admin Access")')
  console.log('✔ Signed out successfully, returned to login screen')

  await browser.close()

  if (consoleErrors.length > 0) {
    console.error('\n⚠️ Console errors occurred during test:', consoleErrors)
    process.exit(1)
  }

  console.log('\n🎉 ALL UI & CRUD MANUAL/AUTOMATED TESTS PASSED WITH 0 ERRORS!')
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err)
  process.exit(1)
})
