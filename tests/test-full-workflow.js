#!/usr/bin/env node

// Test the complete workflow with sample data
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing complete WhatsApp Chat Converter workflow...\n');

try {
    // Step 1: Test parser with sample data
    console.log('📝 Step 1: Testing parser...');
    
    // Import parser functions (simulate ES6 modules)
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
                // New message found
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                currentMessage = message;
            } else if (currentMessage && line.trim()) {
                // Continuation of previous message
                currentMessage.text += '\n' + line.trim();
            }
        }
        
        // Don't forget the last message
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

    // Read sample chat file
    const chatPath = join(__dirname, 'sample', '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    
    console.log(`✅ Read chat file: ${chatPath}`);
    console.log(`📊 File size: ${chatContent.length} characters`);
    
    // Parse messages
    const messages = parseChatContent(chatContent);
    console.log(`✅ Parsed ${messages.length} messages`);
    
    // Step 2: Test audio detection
    console.log('\n🎵 Step 2: Testing audio detection...');
    
    const audioMessages = [];
    messages.forEach((message, index) => {
        const audioInfo = detectAudioAttachment(message);
        if (audioInfo) {
            audioMessages.push({
                index,
                message,
                audioInfo
            });
        }
    });
    
    console.log(`✅ Found ${audioMessages.length} audio messages`);
    
    // Step 3: Check available audio files
    console.log('\n📂 Step 3: Checking available audio files...');
    
    const { readdirSync } = await import('fs');
    const sampleDir = join(__dirname, 'sample');
    const files = readdirSync(sampleDir);
    const audioFiles = files.filter(f => f.includes('AUDIO') && f.endsWith('.opus'));
    
    console.log(`✅ Found ${audioFiles.length} audio files:`);
    audioFiles.forEach(file => console.log(`   - ${file}`));
    
    // Step 4: Test file matching
    console.log('\n🔍 Step 4: Testing file matching...');
    
    let matchCount = 0;
    audioMessages.forEach(({ index, audioInfo }) => {
        const exists = audioFiles.includes(audioInfo.filename);
        const status = exists ? '✅' : '❌';
        console.log(`   ${status} Message ${index}: "${audioInfo.filename}"`);
        if (exists) matchCount++;
    });
    
    console.log(`✅ Successfully matched ${matchCount}/${audioMessages.length} audio files`);
    
    // Step 5: Test line break handling
    console.log('\n📄 Step 5: Testing line break handling...');
    
    const multilineMessages = messages.filter(msg => msg.text.includes('\n'));
    console.log(`✅ Found ${multilineMessages.length} multi-line messages`);
    
    if (multilineMessages.length > 0) {
        console.log('   Example multi-line message:');
        const example = multilineMessages[0];
        console.log(`   From: ${example.sender}`);
        console.log(`   Lines: ${example.text.split('\n').length}`);
        console.log(`   First line: "${example.text.split('\n')[0]}"`);
    }
    
    // Step 6: Simulate HTML generation test
    console.log('\n📋 Step 6: Testing HTML generation structure...');
    
    function simulateHTMLGeneration(messages) {
        let htmlContent = '';
        let audioElementCount = 0;
        
        messages.forEach((msg, index) => {
            // Check if message would have audio controls
            const audioInfo = detectAudioAttachment(msg);
            const hasAudio = audioInfo && audioFiles.includes(audioInfo.filename);
            
            if (hasAudio) {
                audioElementCount++;
                htmlContent += `<audio controls data-message="${index}" data-file="${audioInfo.filename}"></audio>\n`;
            }
            
            // Check line break handling
            const formattedText = msg.text.replace(/\n/g, '<br>');
            htmlContent += `<div data-message="${index}">${formattedText}</div>\n`;
        });
        
        return { htmlContent, audioElementCount };
    }
    
    const { htmlContent, audioElementCount } = simulateHTMLGeneration(messages);
    console.log(`✅ Would generate ${audioElementCount} audio controls`);
    console.log(`✅ HTML content length: ${htmlContent.length} characters`);
    
    // Final summary
    console.log('\n📈 Test Summary:');
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Audio messages detected: ${audioMessages.length}`);
    console.log(`   Audio files available: ${audioFiles.length}`);
    console.log(`   Successful matches: ${matchCount}`);
    console.log(`   Multi-line messages: ${multilineMessages.length}`);
    console.log(`   Audio controls in HTML: ${audioElementCount}`);
    
    if (matchCount === audioMessages.length && audioMessages.length > 0) {
        console.log('\n✅ SUCCESS: All tests passed! The application should work correctly.');
    } else {
        console.log('\n⚠️  WARNING: Some issues detected. Check the results above.');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}