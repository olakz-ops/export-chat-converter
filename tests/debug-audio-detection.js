#!/usr/bin/env node

// Debug audio detection issues
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
            // Check if this line is a standalone audio attachment
            const audioMatch = line.trim().match(AUDIO_ATTACHMENT_REGEX);
            if (audioMatch) {
                // This is a standalone audio message - treat as separate message
                // First, save the current message
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                // Create a new message for the audio
                currentMessage = {
                    timestamp: currentMessage.timestamp, // Same timestamp as previous
                    sender: currentMessage.sender, // Same sender
                    text: line.trim(),
                    originalLine: line
                };
            } else {
                // Normal continuation of previous message
                currentMessage.text += '\n' + line.trim();
            }
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

console.log('🔍 Debugging audio detection...\n');

try {
    // Read and parse
    const chatPath = join(__dirname, 'sample', '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    const messages = parseChatContent(chatContent);
    
    console.log(`📊 Parsed ${messages.length} messages\n`);
    
    // Check available files
    const { readdirSync } = await import('fs');
    const sampleDir = join(__dirname, 'sample');
    const files = readdirSync(sampleDir);
    const audioFiles = files.filter(f => f.includes('AUDIO') && f.endsWith('.opus'));
    
    console.log(`📂 Available audio files (${audioFiles.length}):`);
    audioFiles.forEach(file => console.log(`   ✅ ${file}`));
    console.log('');
    
    // Find audio messages and show details
    console.log('🎵 Audio messages detected:');
    let audioCount = 0;
    let matchCount = 0;
    
    messages.forEach((message, index) => {
        const audioInfo = detectAudioAttachment(message);
        if (audioInfo) {
            audioCount++;
            const exists = audioFiles.includes(audioInfo.filename);
            const status = exists ? '✅' : '❌';
            
            if (exists) matchCount++;
            
            console.log(`${status} Message ${index}: "${audioInfo.filename}"`);
            console.log(`     From: ${message.sender}`);
            console.log(`     Time: ${message.timestamp}`);
            console.log(`     Text preview: "${message.text.substring(0, 50)}..."`);
            console.log('');
        }
    });
    
    console.log(`📈 Summary:`);
    console.log(`   Audio messages detected: ${audioCount}`);
    console.log(`   Available audio files: ${audioFiles.length}`);
    console.log(`   Successful matches: ${matchCount}`);
    
    if (matchCount > 0) {
        console.log(`\n✅ SUCCESS: ${matchCount} audio files will have playback controls!`);
    } else {
        console.log(`\n❌ PROBLEM: No audio files match. Check filenames.`);
    }
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
}