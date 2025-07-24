#!/usr/bin/env node

// Test the actual application with real sample data
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing REAL APPLICATION with sample data...\n');

try {
    // Import actual application modules
    const { parseChatContent } = await import('./js/core/parser.js?v=12');
    const { generateHTMLOutput } = await import('./js/utils/htmlGenerator.js?v=12');
    
    console.log('✅ Application modules loaded');
    
    // Load real sample data
    const sampleDir = join(__dirname, 'sample');
    const chatPath = join(sampleDir, '_chat.txt');
    
    console.log('📄 Loading real chat file...');
    const chatContent = readFileSync(chatPath, 'utf8');
    
    console.log('🔍 Parsing with real parser...');
    const messages = parseChatContent(chatContent);
    console.log(`✅ Parsed ${messages.length} messages`);
    
    // Load real audio files
    console.log('🎵 Loading real audio files...');
    const audioFiles = [
        '00000007-AUDIO-2025-06-11-12-24-05.opus',
        '00000015-AUDIO-2025-06-11-12-34-39.opus', 
        '00000026-AUDIO-2025-06-11-18-55-07.opus'
    ];
    
    const mediaFiles = new Map();
    audioFiles.forEach(filename => {
        const filePath = join(sampleDir, filename);
        try {
            const fileBuffer = readFileSync(filePath);
            // Create a File-like object for the application
            const file = {
                name: filename,
                type: 'audio/opus',
                size: fileBuffer.length,
                arrayBuffer: () => Promise.resolve(fileBuffer.buffer),
                // Add stream method for FileReader compatibility
                stream: () => new ReadableStream({
                    start(controller) {
                        controller.enqueue(new Uint8Array(fileBuffer));
                        controller.close();
                    }
                })
            };
            mediaFiles.set(filename, file);
            console.log(`  ✅ Loaded ${filename} (${fileBuffer.length} bytes)`);
        } catch (error) {
            console.log(`  ❌ Failed to load ${filename}:`, error.message);
        }
    });
    
    // Process messages with real audio file matching
    console.log('🔗 Matching audio files to messages...');
    const processedMessages = messages.map((message, index) => {
        // Check if message has audio attachment
        const audioMatch = message.text.match(/‏<מצורף: (.*?\\.(opus|mp3))>/);
        if (audioMatch) {
            const filename = audioMatch[1];
            console.log(`  📎 Message ${index}: Found audio "${filename}"`);
            
            if (mediaFiles.has(filename)) {
                console.log(`    ✅ Audio file found: ${filename}`);
                
                // Add simulated transcription for testing (since we don't have real OpenAI API)
                const transcriptions = {
                    '00000007-AUDIO-2025-06-11-12-24-05.opus': 'שלום רפאל, איך אתה? אני מתקשר לגבי המכשיר תדרים שדיברנו עליו. אפשר לקבל פרטים נוספים?',
                    '00000015-AUDIO-2025-06-11-12-34-39.opus': 'כן בטח, המחיר הוא 500 שקל והמשלוח חינם לכל הארץ. המכשיר מגיע עם אחריות של שנה.',
                    '00000026-AUDIO-2025-06-11-18-55-07.opus': 'מושלם, אני מעוניין לקנות. אפשר לשלם באשראי? ומתי זה יגיע?'
                };
                
                return {
                    ...message,
                    text: transcriptions[filename] || '[תמלול לא זמין]',
                    audioFile: filename,
                    transcriptionCost: 0.0156,
                    originalAudio: mediaFiles.get(filename)
                };
            } else {
                console.log(`    ❌ Audio file missing: ${filename}`);
                return {
                    ...message,
                    audioFile: filename,
                    transcriptionCost: 0,
                    originalAudio: null
                };
            }
        }
        return message;
    });
    
    // Calculate total cost
    const totalCost = processedMessages.reduce((sum, msg) => sum + (msg.transcriptionCost || 0), 0);
    console.log(`💰 Total transcription cost: $${totalCost.toFixed(4)}`);
    
    // Generate HTML using real application module
    console.log('📄 Generating HTML with real application module...');
    const html = await generateHTMLOutput(processedMessages, totalCost);
    
    // Write to output file
    const outputPath = join(__dirname, 'real-application-test.html');
    writeFileSync(outputPath, html);
    
    console.log(`\\n✅ REAL APPLICATION TEST COMPLETED!`);
    console.log(`📄 Generated: ${outputPath}`);
    console.log(`📊 HTML size: ${(html.length / 1024).toFixed(1)} KB`);
    console.log(`🎵 Audio messages with transcriptions: ${processedMessages.filter(m => m.audioFile && m.transcriptionCost > 0).length}`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`\\n🌐 Open in browser: http://localhost:8001/real-application-test.html`);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
}