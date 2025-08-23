import { test, expect } from '@playwright/test'

test.describe('New Game Flow', () => {
  test('should create a new game and navigate to dashboard', async ({ page }) => {
    // Go to home page
    await page.goto('/')
    
    // Check if home page loads
    await expect(page.locator('h1')).toContainText('FOOTMANAGER 98')
    
    // Click on New Game
    await page.click('text=NOVO JOGO')
    
    // Should navigate to new game page
    await expect(page).toHaveURL('/new-game')
    await expect(page.locator('h1')).toContainText('NOVO JOGO')
    
    // Fill manager name
    await page.fill('input[name="managerName"]', 'Test Manager')
    
    // Select first club (radio button)
    await page.locator('input[name="clubId"]').first().click()
    
    // Start game
    await page.click('text=INICIAR JOGO')
    
    // Should navigate to game page
    await expect(page).toHaveURL(/\/game\?managerId=/)
    
    // Check if dashboard loads
    await expect(page.locator('text=DASHBOARD')).toBeVisible()
    
    // Check if menu is visible
    await expect(page.locator('text=INÍCIO')).toBeVisible()
    await expect(page.locator('text=ELENCO')).toBeVisible()
    await expect(page.locator('text=TABELA')).toBeVisible()
  })

  test('should navigate between game views', async ({ page }) => {
    // Use quick start for faster test
    await page.goto('/')
    
    // Click quick start if available
    const quickStartButton = page.locator('text=JOGAR COM').first()
    if (await quickStartButton.isVisible()) {
      await quickStartButton.click()
      
      // Should navigate to game
      await expect(page).toHaveURL(/\/game\?managerId=/)
      
      // Navigate to Squad
      await page.click('text=ELENCO')
      await expect(page).toHaveURL(/view=squad/)
      await expect(page.locator('h1')).toContainText('ELENCO')
      
      // Navigate to Table
      await page.click('text=TABELA')
      await expect(page).toHaveURL(/view=table/)
      await expect(page.locator('h1')).toContainText('CLASSIFICAÇÃO')
      
      // Navigate back to Home
      await page.click('text=INÍCIO')
      await expect(page).toHaveURL(/view=home/)
      await expect(page.locator('text=DASHBOARD')).toBeVisible()
    }
  })

  test('should show save/load functionality', async ({ page }) => {
    // Use quick start
    await page.goto('/')
    const quickStartButton = page.locator('text=JOGAR COM').first()
    
    if (await quickStartButton.isVisible()) {
      await quickStartButton.click()
      await expect(page).toHaveURL(/\/game\?managerId=/)
      
      // Navigate to saves
      await page.click('text=SALVAR/CARREGAR')
      await expect(page).toHaveURL(/view=saves/)
      
      // Check save interface
      await expect(page.locator('h1')).toContainText('SALVAR/CARREGAR')
      await expect(page.locator('text=SALVAR JOGO')).toBeVisible()
      await expect(page.locator('text=CARREGAR JOGO')).toBeVisible()
      
      // Try to save without name
      await page.click('button:has-text("SALVAR")')
      await expect(page.locator('text=Digite um nome para o save')).toBeVisible()
      
      // Save with name
      await page.fill('input[placeholder="Nome do save"]', 'Test Save')
      await page.click('button:has-text("SALVAR")')
      
      // Should show success message
      await expect(page.locator('text=Jogo salvo com sucesso!')).toBeVisible()
    }
  })
})