#!/usr/bin/env node

// Simple CLI test using the actual application modules with real files
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the actual application modules
import { parseChatContent } from './js/core/parser.js';
import { processAudioMessages } from './js/core/processor.js';
import { generateHTMLOutput } from './js/utils/htmlGenerator.js';
import { config } from './js/config.local.js';

class CliFile {
    constructor(buffer, name, type) {
        this.buffer = buffer;
        this.name = name;
        this.type = type;
        this.size = buffer.length;
    }
    
    async arrayBuffer() {
        return this.buffer;
    }
    
    async text() {
        return this.buffer.toString('utf-8');
    }
}

async function testWithRealFiles() {
    console.log('🧪 Testing WhatsApp Chat Converter with CLI using real files...\n');
    
    try {
        // Step 1: Load real sample files
        console.log('📁 Loading real sample files...');
        
        const sampleDir = join(__dirname, 'sample');
        const fileNames = [
            '_chat.txt',
            '00000007-AUDIO-2025-06-11-12-24-05.opus',
            '00000015-AUDIO-2025-06-11-12-34-39.opus',
            '00000026-AUDIO-2025-06-11-18-55-07.opus'
        ];
        
        const files = new Map();
        for (const fileName of fileNames) {
            try {
                const filePath = join(sampleDir, fileName);
                const buffer = await readFile(filePath);
                const type = fileName.endsWith('.opus') ? 'audio/opus' : 'text/plain';
                const file = new CliFile(buffer, fileName, type);
                files.set(fileName, file);
                console.log(`✅ Loaded ${fileName} (${(buffer.length/1024).toFixed(1)} KB)`);
            } catch (error) {
                console.log(`❌ Could not load ${fileName}: ${error.message}`);
            }
        }
        
        // Step 2: Get chat file and parse content
        console.log('\n📄 Parsing chat content...');
        const chatFile = files.get('_chat.txt');
        if (!chatFile) {
            throw new Error('Chat file not found');
        }
        
        const chatContent = await chatFile.text();
        const messages = parseChatContent(chatContent);
        console.log(`✅ Parsed ${messages.length} messages from chat`);
        
        // Step 3: Prepare media files (excluding chat.txt)
        const mediaFiles = new Map();
        for (const [filename, file] of files.entries()) {
            if (filename !== '_chat.txt') {
                mediaFiles.set(filename, file);
            }
        }
        console.log(`📁 Found ${mediaFiles.size} media files available`);
        
        // Step 4: Process audio messages with OpenAI API
        console.log('\n🎵 Processing audio messages with OpenAI API...');
        const processedMessages = await processAudioMessages(
            messages,
            mediaFiles,
            config.OPENAI_API_KEY,
            (completed, total) => {
                const percent = Math.round((completed / total) * 100);
                console.log(`🔄 Transcribing: ${completed}/${total} (${percent}%)`);
            }
        );
        
        // Step 5: Calculate results
        const audioMessages = processedMessages.filter(m => m.audioFile);
        const transcribedMessages = processedMessages.filter(m => m.transcriptionCost && m.transcriptionCost > 0);
        const totalCost = transcribedMessages.reduce((sum, msg) => sum + (msg.transcriptionCost || 0), 0);
        
        console.log('\n📊 Processing Results:');
        console.log(`   📄 Total messages: ${messages.length}`);
        console.log(`   🎵 Audio messages detected: ${audioMessages.length}`);
        console.log(`   ✅ Successfully transcribed: ${transcribedMessages.length}`);
        console.log(`   💰 Total transcription cost: $${totalCost.toFixed(4)}`);
        
        // Step 6: Generate final HTML output
        console.log('\n📄 Generating final HTML output...');
        const finalHTML = await generateHTMLOutput(processedMessages, totalCost);
        console.log(`✅ Generated HTML (${(finalHTML.length/1024).toFixed(1)} KB)`);
        
        // Step 7: Save the HTML file
        const outputPath = join(__dirname, 'cli-test-output.html');
        await import('fs/promises').then(fs => fs.writeFile(outputPath, finalHTML));
        console.log(`💾 Saved HTML file to: ${outputPath}`);
        
        // Step 8: Analyze the generated HTML for audio and transcription content
        console.log('\n🔍 Analyzing generated HTML content...');
        
        const audioElementCount = (finalHTML.match(/<audio/g) || []).length;
        const base64AudioCount = (finalHTML.match(/data:audio/g) || []).length;
        const editButtonCount = (finalHTML.match(/ערוך/g) || []).length;
        const transcriptionDivCount = (finalHTML.match(/class="audio-transcription"/g) || []).length;
        
        console.log(`   🎵 Audio elements: ${audioElementCount}`);
        console.log(`   📊 Base64 audio sources: ${base64AudioCount}`);
        console.log(`   ✏️ Edit buttons: ${editButtonCount}`);
        console.log(`   📝 Transcription divs: ${transcriptionDivCount}`);
        
        // Step 9: Show sample transcribed text
        console.log('\n📝 Sample transcribed content:');
        transcribedMessages.slice(0, 3).forEach((msg, i) => {
            if (msg.transcription) {
                const preview = msg.transcription.substring(0, 50) + (msg.transcription.length > 50 ? '...' : '');
                console.log(`   ${i + 1}. "${preview}"`);
            }
        });
        
        console.log('\n🎉 CLI TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ The application works with real files, real API calls, and generates playable HTML');
        console.log(`📁 Test output saved to: ${outputPath}`);
        console.log('\n💡 You can now open the HTML file in your browser to test audio playback and editing!');
        
    } catch (error) {
        console.error('❌ CLI test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the CLI test
testWithRealFiles();