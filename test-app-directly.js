// Direct test of the actual application with real files
import puppeteer from 'puppeteer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function testApplication() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the application
        await page.goto('http://localhost:8001');
        
        // Upload files
        const fileInput = await page.$('#fileInput');
        await fileInput.uploadFile(
            join(__dirname, 'sample/_chat.txt'),
            join(__dirname, 'sample/00000007-AUDIO-2025-06-11-12-24-05.opus'),
            join(__dirname, 'sample/00000015-AUDIO-2025-06-11-12-34-39.opus'),
            join(__dirname, 'sample/00000026-AUDIO-2025-06-11-18-55-07.opus')
        );
        
        // Click process button
        await page.click('#processBtn');
        
        // Wait for processing to complete
        await page.waitForSelector('#previewSection:not(.hidden)', { timeout: 60000 });
        
        console.log('✅ Processing completed successfully!');
        
        // Get the results
        const totalCost = await page.textContent('#totalCost');
        console.log(`💰 Total cost: ${totalCost}`);
        
        // Download the HTML
        await page.click('#downloadBtn');
        
        console.log('📥 HTML file downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testApplication();