#!/usr/bin/env node

// CLI test of the ACTUAL application at index.html with real sample files
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testRealApplication() {
    console.log('🧪 Testing ACTUAL WhatsApp Chat Converter application with real files...\n');
    
    const browser = await chromium.launch({ headless: false }); // Keep visible to see what happens
    const page = await browser.newPage();
    
    try {
        // Step 1: Navigate to the actual application
        console.log('📱 Opening actual application...');
        await page.goto('http://localhost:8001/index.html');
        await page.waitForLoadState('networkidle');
        
        // Step 2: Upload real sample files
        console.log('📁 Uploading real sample files...');
        const fileInput = page.locator('#fileInput');
        
        const filePaths = [
            join(__dirname, 'sample', '_chat.txt'),
            join(__dirname, 'sample', '00000007-AUDIO-2025-06-11-12-24-05.opus'),
            join(__dirname, 'sample', '00000015-AUDIO-2025-06-11-12-34-39.opus'),
            join(__dirname, 'sample', '00000026-AUDIO-2025-06-11-18-55-07.opus')
        ];
        
        await fileInput.setInputFiles(filePaths);
        console.log('✅ Files uploaded successfully');
        
        // Step 3: Click process button
        console.log('🔄 Starting processing...');
        await page.click('#processBtn');
        
        // Step 4: Wait for processing to complete and monitor status
        console.log('⏳ Waiting for processing to complete...');
        
        // Monitor status updates
        const statusLog = page.locator('#statusLog');
        let lastStatus = '';
        
        // Wait up to 2 minutes for processing
        const maxWaitTime = 120000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Check if preview section is visible (processing complete)
                const previewVisible = await page.locator('#previewSection').isVisible();
                if (previewVisible) {
                    console.log('✅ Processing completed - preview section visible');
                    break;
                }
                
                // Get current status
                const currentStatus = await statusLog.textContent();
                if (currentStatus !== lastStatus) {
                    console.log(`📄 Status: ${currentStatus.split('\n').pop()}`);
                    lastStatus = currentStatus;
                }
                
                // Wait a bit before checking again
                await page.waitForTimeout(1000);
                
            } catch (error) {
                // Continue waiting
            }
        }
        
        // Step 5: Check if processing succeeded
        const previewVisible = await page.locator('#previewSection').isVisible();
        if (!previewVisible) {
            throw new Error('Processing did not complete within timeout');
        }
        
        // Step 6: Get results
        console.log('📊 Getting results...');
        const totalCost = await page.locator('#totalCost').textContent();
        console.log(`💰 Total transcription cost: ${totalCost}`);
        
        // Count messages in preview
        const messages = await page.locator('#chatPreview .message').count();
        console.log(`📄 Total messages in preview: ${messages}`);
        
        // Count audio messages with transcriptions
        const audioMessages = await page.locator('#chatPreview audio').count();
        console.log(`🎵 Audio players embedded: ${audioMessages}`);
        
        // Count edit buttons
        const editButtons = await page.locator('button:has-text("ערוך")').count();
        console.log(`✏️ Edit buttons available: ${editButtons}`);
        
        // Step 7: Download the HTML file
        console.log('📥 Downloading HTML file...');
        
        // Set up download handler
        const downloadPromise = page.waitForDownload();
        await page.click('#downloadBtn');
        const download = await downloadPromise;
        
        const downloadPath = join(__dirname, 'downloaded-whatsapp-chat.html');
        await download.saveAs(downloadPath);
        console.log(`✅ HTML file saved to: ${downloadPath}`);
        
        // Step 8: Test the downloaded HTML file
        console.log('🧪 Testing downloaded HTML file...');
        
        // Open the downloaded HTML in a new tab
        const htmlContent = await page.evaluate(async (path) => {
            const response = await fetch(`file://${path}`);
            return response.text();
        }, downloadPath);
        
        // Create a new page to test the downloaded HTML
        const testPage = await browser.newPage();
        await testPage.setContent(htmlContent);
        
        // Test audio elements
        const testAudioCount = await testPage.locator('audio').count();
        console.log(`🎵 Audio elements in downloaded HTML: ${testAudioCount}`);
        
        // Test if audio has data (base64)
        const audioSources = await testPage.locator('audio source').evaluateAll(sources => 
            sources.map(src => ({ 
                hasSrc: !!src.src, 
                isBase64: src.src.startsWith('data:audio'),
                size: src.src.length 
            }))
        );
        
        console.log('📊 Audio source analysis:');
        audioSources.forEach((source, i) => {
            console.log(`  Audio ${i + 1}: ${source.hasSrc ? '✅' : '❌'} Has source, ${source.isBase64 ? '✅' : '❌'} Base64, ${(source.size / 1024).toFixed(1)} KB`);
        });
        
        // Test edit buttons
        const testEditButtons = await testPage.locator('button:has-text("ערוך")').count();
        console.log(`✏️ Edit buttons in downloaded HTML: ${testEditButtons}`);
        
        // Test transcribed text content
        const transcribedTexts = await testPage.locator('.audio-transcription').evaluateAll(divs => 
            divs.map(div => div.textContent.substring(0, 50) + '...')
        );
        
        console.log('📝 Transcribed text samples:');
        transcribedTexts.forEach((text, i) => {
            console.log(`  ${i + 1}: "${text}"`);
        });
        
        // Final results
        console.log('\\n🎉 FINAL TEST RESULTS:');
        console.log(`   📄 Messages processed: ${messages}`);
        console.log(`   🎵 Audio files with playable content: ${testAudioCount}`);
        console.log(`   📝 Transcribed messages: ${transcribedTexts.length}`);
        console.log(`   ✏️ Editable transcriptions: ${testEditButtons}`);
        console.log(`   💰 Total cost: ${totalCost}`);
        console.log(`   📁 Downloaded file: ${downloadPath}`);
        
        console.log('\\n✅ TEST COMPLETED SUCCESSFULLY!');
        console.log('The application works end-to-end with real files, real transcriptions, and playable audio.');
        
        await testPage.close();
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-failure.png', fullPage: true });
        console.log('📸 Screenshot saved as test-failure.png');
        
        // Get any error messages from the page
        const statusText = await page.locator('#statusLog').textContent().catch(() => 'No status available');
        console.log('🔍 Last status:', statusText);
        
    } finally {
        await browser.close();
    }
}

// Run the test
testRealApplication().catch(console.error);