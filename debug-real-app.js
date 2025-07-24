#!/usr/bin/env node

// Debug the real application audio detection
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Debugging audio detection in real application...\n');

try {
    // Import actual application modules
    const { parseChatContent, detectAudioAttachment } = await import('./js/core/parser.js?v=12');
    
    // Load real sample data
    const sampleDir = join(__dirname, 'sample');
    const chatPath = join(sampleDir, '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    
    console.log('📄 Parsing messages...');
    const messages = parseChatContent(chatContent);
    console.log(`✅ Parsed ${messages.length} messages\n`);
    
    console.log('🔍 Looking for audio attachments...');
    messages.forEach((message, index) => {
        if (message.text.includes('AUDIO') || message.text.includes('מצורף') || message.text.includes('.opus')) {
            console.log(`\\n📎 Message ${index}:`);
            console.log(`   Sender: ${message.sender}`);
            console.log(`   Text: "${message.text}"`);
            
            // Test audio detection
            const audioInfo = detectAudioAttachment(message);
            if (audioInfo) {
                console.log(`   🎵 Audio detected: ${audioInfo.filename}`);
            } else {
                console.log(`   ❌ No audio detected`);
            }
        }
    });
    
    // Test the regex patterns manually
    console.log('\\n🧪 Testing regex patterns...');
    const testTexts = [
        '‏<מצורף: 00000007-AUDIO-2025-06-11-12-24-05.opus>',
        '<מצורף: 00000007-AUDIO-2025-06-11-12-24-05.opus>',
        'AUDIO-2025-06-11-12-24-05.opus',
        '00000007-AUDIO-2025-06-11-12-24-05.opus'
    ];
    
    const AUDIO_ATTACHMENT_REGEX = /‏<מצורף: (.*?\\.(opus|mp3))>/;
    
    testTexts.forEach(text => {
        const match = text.match(AUDIO_ATTACHMENT_REGEX);
        console.log(`Text: "${text}"`);
        console.log(`Match: ${match ? match[1] : 'NO MATCH'}\\n`);
    });
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
}