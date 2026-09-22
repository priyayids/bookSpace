import { chromium } from 'playwright'
import { execSync } from 'child_process'
import fs from 'fs'

async function capture() {
  execSync('pnpm --filter backend db:seed', { stdio: 'ignore' })
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  // 1. Reservation Page
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'screenshots/1-reservation-page.png' })
  console.log('Saved 1-reservation-page.png')

  // 2. Room Booking Form
  await page.locator('button:has-text("Archipelago")').first().click()
  await page.waitForSelector('text=Availability —')
  await page.screenshot({ path: 'screenshots/2-room-booking-form.png' })
  console.log('Saved 2-room-booking-form.png')

  // 2b. Submit Booking -> Pending Confirmation
  await page.fill('input[placeholder*="Planning Review"]', 'Product Strategy Workshop')
  await page.fill('input[placeholder="Full name"]', 'Sarah Jenkins')
  await page.fill('input[placeholder="you@company.co"]', 'sarah@company.co')
  const startSelect = page.locator('select').first()
  await startSelect.selectOption('16:00')
  const endSelect = page.locator('select').nth(1)
  await endSelect.selectOption('17:00')
  await page.click('button:has-text("Confirm Booking")')
  await page.waitForSelector('text=Booking Requested')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/2b-pending-requested.png' })
  console.log('Saved 2b-pending-requested.png')

  // 3. Room Status / Occupancy
  await page.goto('http://localhost:5173')
  await page.click('button:has-text("Room Status")')
  await page.waitForSelector('h1:has-text("Room Status")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/3-occupancy-status.png' })
  console.log('Saved 3-occupancy-status.png')

  // 4. Admin Login & Overview
  await page.click('button:has-text("Admin")')
  await page.waitForSelector('h1:has-text("Admin Access")')
  await page.fill('input[type="password"]', 'admin')
  await page.click('button:has-text("Sign In")')
  await page.waitForSelector('h1:has-text("Admin Dashboard")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/5-admin-overview.png' })
  console.log('Saved 5-admin-overview.png')

  // 5. Admin Bookings - Pending state with Approve / Reject buttons
  await page.click('button:has-text("Bookings")')
  await page.waitForSelector('th:has-text("Title")')
  const statusSelect = page.locator('select').nth(1)
  await statusSelect.selectOption('pending')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/4-admin-bookings-pending.png' })
  console.log('Saved 4-admin-bookings-pending.png')

  // 6. Admin Bookings - Approve verification
  const pendingRow = page.locator('tr:has-text("Product Strategy Workshop")')
  const approveBtn = pendingRow.locator('button:has-text("Approve")')
  if (await approveBtn.count() > 0) {
    await approveBtn.click()
    await page.waitForTimeout(500)
  }
  await statusSelect.selectOption('confirmed')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/5b-admin-bookings-approved.png' })
  console.log('Saved 5b-admin-bookings-approved.png')

  // 7. Admin Rooms
  await page.click('button:has-text("Rooms")')
  await page.waitForSelector('button:has-text("+ Add Room")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/6-admin-rooms.png' })
  console.log('Saved 6-admin-rooms.png')

  // 8. Admin Settings
  await page.click('button:has-text("Settings")')
  await page.waitForSelector('h3:has-text("Operating Hours")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/8-admin-settings.png' })
  console.log('Saved 8-admin-settings.png')

  await browser.close()
  console.log('All screenshots captured successfully!')
}

capture().catch(err => {
  console.error(err)
  process.exit(1)
})
