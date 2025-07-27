import { test, expect } from '@playwright/test'

test.describe('Revenue Flow - Booking to Payment', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'briek.seynaeve@hotmail.com')
    await page.fill('input[type="password"]', 'Dessaro5667!')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard')
  })

  test('Complete booking creates invoice and allows payment registration', async ({ page }) => {
    // Navigate to appointments page
    await page.goto('http://localhost:3000/appointments')
    
    // Wait for appointments to load
    await page.waitForSelector('text=Agenda', { timeout: 10000 })
    
    // Create a new appointment
    await page.click('button:has-text("Nieuwe Afspraak")')
    
    // Fill in appointment details
    await page.waitForSelector('text=Nieuwe afspraak', { timeout: 5000 })
    
    // Select a client
    await page.click('button:has-text("Selecteer klant")')
    await page.click('text=Aagje Verwerft', { timeout: 5000 })
    
    // Select a service
    await page.click('button:has-text("Selecteer service")')
    await page.click('text=Haircut', { timeout: 5000 })
    
    // Select today's date and time
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"]', today)
    await page.fill('input[type="time"]', '14:00')
    
    // Save the appointment
    await page.click('button:has-text("Afspraak Inplannen")')
    
    // Wait for appointment to be created
    await page.waitForSelector('text=Afspraak succesvol ingepland', { timeout: 5000 })
    
    // Find the created appointment in the calendar
    await page.waitForTimeout(2000) // Wait for UI to update
    
    // Click on the appointment to open details
    await page.click('text=Aagje Verwerft')
    
    // Mark appointment as completed
    await page.waitForSelector('text=Status wijzigen', { timeout: 5000 })
    await page.click('button:has-text("Markeer als Voltooid")')
    
    // Wait for completion flow
    await page.waitForSelector('text=Afspraak voltooien...', { timeout: 5000 })
    
    // Wait for invoice creation confirmation
    await page.waitForSelector('text=Factuur is automatisch aangemaakt', { timeout: 10000 })
    
    // Wait for payment modal
    await page.waitForSelector('text=Betaling Registreren', { timeout: 5000 })
    
    // Select cash payment
    await page.click('text=Contant')
    
    // Add a note
    await page.fill('textarea[placeholder*="Klant betaalt"]', 'Test betaling')
    
    // Confirm payment
    await page.click('button:has-text("Betaling Bevestigen")')
    
    // Wait for modal to close
    await page.waitForTimeout(2000)
    
    // Navigate to dashboard to check revenue
    await page.goto('http://localhost:3000/dashboard')
    
    // Check if revenue chart is displayed
    await page.waitForSelector('text=Omzet', { timeout: 10000 })
    
    // Verify the revenue is updated (the chart should show some revenue)
    const revenueElement = await page.locator('h2:has-text("€")').first()
    const revenueText = await revenueElement.textContent()
    
    // Revenue should not be €0.00
    expect(revenueText).not.toBe('€0.00')
    expect(revenueText).toMatch(/€[\d,]+\.\d{2}/)
  })

  test('Invoice appears in invoices list after booking completion', async ({ page }) => {
    // Navigate to invoices page
    await page.goto('http://localhost:3000/invoices')
    
    // Wait for invoices to load
    await page.waitForSelector('text=Facturen', { timeout: 10000 })
    
    // Check if there are paid invoices
    const paidInvoices = await page.locator('text=Betaald').count()
    expect(paidInvoices).toBeGreaterThan(0)
    
    // Click on a paid invoice to view details
    await page.click('tr:has-text("Betaald")', { timeout: 5000 })
    
    // Verify invoice details page loads
    await page.waitForSelector('text=Factuurdetails', { timeout: 5000 })
    
    // Check for payment information
    await page.waitForSelector('text=Betalingen', { timeout: 5000 })
    const paymentInfo = await page.locator('text=Contant').or(page.locator('text=Pin/Creditcard')).count()
    expect(paymentInfo).toBeGreaterThan(0)
  })
})