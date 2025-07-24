#!/usr/bin/env node

// Test HTML generation with REAL audio files from sample directory
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing HTML generation with REAL audio files...\n');

try {
    // Parser functions
    const MESSAGE_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$/;
    const AUDIO_ATTACHMENT_REGEX = /‏<מצורף: (.*?\.(opus|mp3))>/;

    function parseMessage(line) {
        const match = line.match(MESSAGE_REGEX);
        if (!match) return null;
        
        const [, date, time, sender, text] = match;
        return {
            timestamp: `${date}, ${time}`,
            sender: sender.trim(),
            text: text.trim(),
            originalLine: line
        };
    }

    function parseChatContent(content) {
        const lines = content.split('\n');
        const messages = [];
        let currentMessage = null;
        
        for (const line of lines) {
            const message = parseMessage(line);
            if (message) {
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                currentMessage = message;
            } else if (currentMessage && line.trim()) {
                const audioMatch = line.trim().match(AUDIO_ATTACHMENT_REGEX);
                if (audioMatch) {
                    if (currentMessage) {
                        messages.push(currentMessage);
                    }
                    currentMessage = {
                        timestamp: currentMessage.timestamp,
                        sender: currentMessage.sender,
                        text: line.trim(),
                        originalLine: line
                    };
                } else {
                    currentMessage.text += '\n' + line.trim();
                }
            }
        }
        
        if (currentMessage) {
            messages.push(currentMessage);
        }
        
        return messages;
    }

    function detectAudioAttachment(message) {
        const hebrewMatch = message.text.match(AUDIO_ATTACHMENT_REGEX);
        if (hebrewMatch) {
            return {
                filename: hebrewMatch[1],
                extension: hebrewMatch[2]
            };
        }
        return null;
    }

    // Real file to base64 conversion
    function fileToBase64(filePath) {
        try {
            const fileBuffer = readFileSync(filePath);
            return fileBuffer.toString('base64');
        } catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error.message);
            return null;
        }
    }

    // Get file size in KB
    function getFileSizeKB(filePath) {
        try {
            const stats = readFileSync(filePath);
            return (stats.length / 1024).toFixed(1);
        } catch (error) {
            return 'unknown';
        }
    }

    // HTML generation with real audio files
    function generateRealAudioHTML(messages, audioFiles) {
        let htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>WhatsApp Chat - Real Audio Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .message { margin: 10px 0; padding: 15px; border-radius: 8px; background: white; }
        .audio-message { background-color: #e3f2fd; border-left: 4px solid #2196f3; }
        .sender { font-weight: bold; color: #1976d2; }
        .timestamp { font-size: 12px; color: #666; }
        .text { margin: 5px 0; line-height: 1.4; }
        audio { width: 100%; max-width: 400px; margin: 10px 0; }
        .audio-info { font-size: 11px; color: #666; margin-top: 5px; }
        .test-info { background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="test-info">
        <h1>🎵 WhatsApp Chat - Real Audio Test</h1>
        <p><strong>Test Status:</strong> Using actual .opus files from sample directory</p>
        <p><strong>Available Audio Files:</strong> ${audioFiles.size}</p>
    </div>
`;

        let embeddedCount = 0;
        let totalSize = 0;
        
        messages.forEach((msg, index) => {
            const audioInfo = detectAudioAttachment(msg);
            const hasAudio = audioInfo !== null;
            
            htmlContent += `
    <div class="message ${hasAudio ? 'audio-message' : ''}">
        <div class="sender">${msg.sender}</div>
        <div class="timestamp">${msg.timestamp}</div>
        <div class="text">${msg.text.replace(/\n/g, '<br>')}</div>
`;
            
            if (hasAudio) {
                const audioFilePath = join(__dirname, 'sample', audioInfo.filename);
                const base64Data = fileToBase64(audioFilePath);
                
                if (base64Data) {
                    embeddedCount++;
                    const sizeKB = getFileSizeKB(audioFilePath);
                    totalSize += parseFloat(sizeKB);
                    
                    htmlContent += `
        <div style="margin-top: 10px; padding: 10px; background: rgba(33, 150, 243, 0.1); border-radius: 4px;">
            <audio controls preload="metadata">
                <source src="data:audio/opus;base64,${base64Data}" type="audio/opus">
                <source src="data:audio/ogg;base64,${base64Data}" type="audio/ogg">
                Your browser does not support audio playback
            </audio>
            <div class="audio-info">
                🎵 <strong>${audioInfo.filename}</strong> (${sizeKB} KB)
                <br>📊 Embedded as base64 - Click play to test!
            </div>
        </div>
`;
                } else {
                    htmlContent += `
        <div style="margin-top: 10px; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 4px;">
            <div class="audio-info">
                ❌ <strong>${audioInfo.filename}</strong> - File not found or unreadable
            </div>
        </div>
`;
                }
            }
            
            htmlContent += `    </div>`;
        });
        
        htmlContent += `
    <div class="test-info" style="margin-top: 30px;">
        <h2>📊 Test Results</h2>
        <p><strong>Total Messages:</strong> ${messages.length}</p>
        <p><strong>Audio Messages:</strong> ${messages.filter(m => detectAudioAttachment(m)).length}</p>
        <p><strong>Successfully Embedded:</strong> ${embeddedCount}</p>  
        <p><strong>Total Audio Size:</strong> ${totalSize.toFixed(1)} KB</p>
        <p><strong>HTML File Size:</strong> ~${(htmlContent.length / 1024).toFixed(0)} KB</p>
        <hr>
        <p><strong>🎯 Instructions:</strong></p>
        <ul>
            <li>Click the play button on any audio control above</li>
            <li>If audio plays, the embedding works perfectly!</li>
            <li>If not, your browser may not support .opus format</li>
            <li>The audio controls use the actual audio files from your sample directory</li>
        </ul>
    </div>
</body>
</html>`;

        return { htmlContent, embeddedCount, totalSize };
    }

    // Run the test
    console.log('📝 Step 1: Loading sample files...');
    const sampleDir = join(__dirname, 'sample');
    
    // Read chat file
    const chatPath = join(sampleDir, '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    const messages = parseChatContent(chatContent);
    
    // Get available audio files
    const { readdirSync } = await import('fs');
    const files = readdirSync(sampleDir);
    const audioFileNames = files.filter(f => f.includes('AUDIO') && f.endsWith('.opus'));
    
    // Create audio files map
    const audioFiles = new Map();
    audioFileNames.forEach(filename => {
        const filePath = join(sampleDir, filename);
        audioFiles.set(filename, filePath);
    });
    
    console.log(`✅ Chat file: ${chatPath}`);
    console.log(`✅ Messages parsed: ${messages.length}`);
    console.log(`✅ Audio files found: ${audioFiles.size}`);
    audioFileNames.forEach(name => console.log(`   - ${name}`));
    
    console.log('\n🎵 Step 2: Generating HTML with real audio embedding...');
    const { htmlContent, embeddedCount, totalSize } = generateRealAudioHTML(messages, audioFiles);
    
    // Write the HTML file
    const outputPath = join(__dirname, 'real-audio-test.html');
    writeFileSync(outputPath, htmlContent);
    
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`✅ HTML size: ${(htmlContent.length / 1024).toFixed(1)} KB`);
    console.log(`✅ Audio files embedded: ${embeddedCount}`);
    console.log(`✅ Total audio size: ${totalSize.toFixed(1)} KB`);
    
    // Analysis
    const audioElementCount = (htmlContent.match(/<audio/g) || []).length;
    const base64Count = (htmlContent.match(/data:audio.*base64/g) || []).length;
    
    console.log('\n📊 HTML Analysis:');
    console.log(`   <audio> elements: ${audioElementCount}`);
    console.log(`   Base64 audio sources: ${base64Count}`);
    console.log(`   File size with embedded audio: ${(htmlContent.length / 1024).toFixed(1)} KB`);
    
    if (embeddedCount > 0) {
        console.log('\n✅ SUCCESS: Real audio files embedded in HTML!');
        console.log(`🎵 ${embeddedCount} audio files are now playable in the HTML`);
        console.log(`📂 Open ${outputPath} in your browser to test REAL audio playback!`);
        
        // Show which files were embedded
        console.log('\n🔍 Embedded files:');
        const audioMessages = messages.filter(m => detectAudioAttachment(m));
        audioMessages.forEach(msg => {
            const audioInfo = detectAudioAttachment(msg);
            const exists = audioFiles.has(audioInfo.filename);
            console.log(`   ${exists ? '✅' : '❌'} ${audioInfo.filename}`);
        });
        
    } else {
        console.log('\n❌ ISSUE: No audio files were successfully embedded');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}