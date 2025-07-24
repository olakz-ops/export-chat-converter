#!/usr/bin/env node

// Test the parsing logic with sample data
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simulate the parser functions (simplified for testing)
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

// Test with sample data
console.log('🧪 Testing parser with sample data...\n');

try {
    // Read sample chat file
    const chatPath = join(__dirname, 'sample', '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    
    console.log(`📁 Read chat file: ${chatPath}`);
    console.log(`📊 File size: ${chatContent.length} characters\n`);
    
    // Parse messages
    const messages = parseChatContent(chatContent);
    console.log(`✅ Parsed ${messages.length} messages\n`);
    
    // Debug: show first few messages to check parsing
    console.log(`📝 First 10 parsed messages:`);
    messages.slice(0, 10).forEach((msg, i) => {
        console.log(`   ${i}: [${msg.timestamp}] ${msg.sender}: "${msg.text}"`);
    });
    console.log('');
    
    // Find audio messages and debug text
    const audioMessages = [];
    console.log(`🔍 Checking messages for audio patterns...\n`);
    
    messages.forEach((message, index) => {
        // Debug: show messages that might contain attachments
        if (message.text.includes('מצורף') || message.text.includes('<') || message.text.includes('AUDIO')) {
            console.log(`   Message ${index} (${message.sender}): "${message.text}"`);
            console.log(`   Regex test result:`, AUDIO_ATTACHMENT_REGEX.test(message.text));
            
            // Test character by character for hidden characters
            const chars = message.text.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ');
            console.log(`   Character analysis: ${chars}`);
            console.log('');
        }
        
        const audioInfo = detectAudioAttachment(message);
        if (audioInfo) {
            audioMessages.push({
                index,
                message,
                audioInfo
            });
        }
    });
    
    console.log(`🎵 Found ${audioMessages.length} audio messages:\n`);
    
    // List audio files in sample directory
    const { readdirSync } = await import('fs');
    const sampleDir = join(__dirname, 'sample');
    const files = readdirSync(sampleDir);
    const audioFiles = files.filter(f => f.includes('AUDIO'));
    
    console.log(`📂 Available audio files in sample/:`);
    audioFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    
    // Check matches
    console.log(`🔍 Audio message analysis:`);
    audioMessages.forEach(({ index, message, audioInfo }) => {
        const exists = audioFiles.includes(audioInfo.filename);
        const status = exists ? '✅' : '❌';
        console.log(`   ${status} Message ${index}: "${audioInfo.filename}"`);
        console.log(`      Sender: ${message.sender}`);
        console.log(`      Time: ${message.timestamp}`);
        if (!exists) {
            console.log(`      🚨 File missing from sample directory`);
        }
        console.log('');
    });
    
    // Summary
    const matchedCount = audioMessages.filter(({ audioInfo }) => 
        audioFiles.includes(audioInfo.filename)
    ).length;
    
    console.log(`📈 Summary:`);
    console.log(`   Total messages: ${messages.length}`);
    console.log(`   Audio messages found: ${audioMessages.length}`);
    console.log(`   Audio files available: ${audioFiles.length}`);
    console.log(`   Successful matches: ${matchedCount}`);
    console.log(`   Missing files: ${audioMessages.length - matchedCount}`);
    
    if (matchedCount > 0) {
        console.log(`\n✅ SUCCESS: Parser correctly identifies and matches audio files!`);
    } else {
        console.log(`\n❌ ISSUE: No matches found - check file availability`);
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}