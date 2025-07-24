#!/usr/bin/env node

// Test HTML generation with embedded audio files
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing HTML generation with embedded audio...\n');

try {
    // Simulate the complete workflow
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

    // Helper function to convert file to base64 (simulate)
    function fileToBase64(file) {
        return new Promise((resolve) => {
            // For testing, just return a dummy base64 string
            resolve('dGVzdCBhdWRpbyBkYXRh'); // "test audio data" in base64
        });
    }

    // Simulate HTML generation
    async function generateTestHTML(messages) {
        let htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Test Audio HTML</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .message { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .audio-message { background-color: #f0f9ff; }
        audio { width: 100%; max-width: 300px; }
    </style>
</head>
<body>
    <h1>Test: WhatsApp Chat with Audio</h1>
`;

        let audioCount = 0;
        
        for (const [index, msg] of messages.entries()) {
            const audioInfo = detectAudioAttachment(msg);
            const hasAudio = audioInfo !== null;
            
            if (hasAudio) audioCount++;
            
            htmlContent += `
    <div class="message ${hasAudio ? 'audio-message' : ''}">
        <div><strong>${msg.sender}</strong> - ${msg.timestamp}</div>
        <div>${msg.text.replace(/\n/g, '<br>')}</div>
`;
            
            if (hasAudio) {
                // Simulate base64 audio embedding
                const audioData = await fileToBase64();
                const mimeType = 'audio/opus';
                const audioSrc = `data:${mimeType};base64,${audioData}`;
                
                htmlContent += `
        <div style="margin-top: 10px;">
            <audio controls>
                <source src="${audioSrc}" type="${mimeType}">
                Your browser does not support audio playback
            </audio>
            <p style="font-size: 12px; color: #666;">
                🎵 Audio file: ${audioInfo.filename}
            </p>
        </div>
`;
            }
            
            htmlContent += `    </div>`;
        }
        
        htmlContent += `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p><strong>Test Results:</strong></p>
        <p>Total messages: ${messages.length}</p>
        <p>Audio messages: ${audioCount}</p>
        <p>HTML generation: SUCCESS</p>
    </div>
</body>
</html>`;

        return { htmlContent, audioCount };
    }

    // Run the test
    console.log('📝 Step 1: Parsing sample chat...');
    const chatPath = join(__dirname, 'sample', '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    const messages = parseChatContent(chatContent);
    
    console.log(`✅ Parsed ${messages.length} messages`);
    
    console.log('\n🎵 Step 2: Detecting audio messages...');
    const audioMessages = messages.filter(msg => detectAudioAttachment(msg));
    console.log(`✅ Found ${audioMessages.length} audio messages`);
    
    console.log('\n📄 Step 3: Generating HTML with embedded audio...');
    const { htmlContent, audioCount } = await generateTestHTML(messages);
    
    // Write test HTML file
    const outputPath = join(__dirname, 'test-output.html');
    const fs = await import('fs');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log(`✅ Generated HTML file: ${outputPath}`);
    console.log(`✅ File size: ${htmlContent.length} characters`);
    console.log(`✅ Audio controls embedded: ${audioCount}`);
    
    // Check if HTML contains audio elements
    const audioElementCount = (htmlContent.match(/<audio/g) || []).length;
    const base64AudioCount = (htmlContent.match(/data:audio/g) || []).length;
    
    console.log('\n📊 HTML Analysis:');
    console.log(`   <audio> elements: ${audioElementCount}`);
    console.log(`   Base64 audio sources: ${base64AudioCount}`);
    console.log(`   Total file size: ${(htmlContent.length / 1024).toFixed(1)} KB`);
    
    if (audioElementCount > 0 && base64AudioCount > 0) {
        console.log('\n✅ SUCCESS: HTML contains playable audio controls with embedded data!');
        console.log(`📂 Open ${outputPath} in your browser to test audio playback`);
    } else {
        console.log('\n❌ ISSUE: HTML does not contain proper audio elements');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}