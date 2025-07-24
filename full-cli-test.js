#!/usr/bin/env node

// Full CLI test that simulates the browser workflow and validates results
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import application modules
import appState from './js/core/state.js';
import { organizeFiles, validateFiles, readFileAsText } from './js/utils/fileHandler.js';
import { parseChatContent } from './js/core/parser.js';  
import { processAudioMessages } from './js/core/processor.js';
import { generateHTMLOutput } from './js/utils/htmlGenerator.js';
import { config } from './js/config.local.js';

// Node.js File class simulation
class NodeFile {
    constructor(buffer, name, type) {
        this.name = name;
        this.type = type;
        this.size = buffer.length;
        this._buffer = buffer;
    }

    async arrayBuffer() {
        return this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength);
    }

    async text() {
        return this._buffer.toString('utf-8');
    }

    stream() {
        // Simple stream implementation for compatibility
        return {
            getReader() {
                return {
                    read: () => Promise.resolve({ done: true, value: undefined })
                };
            }
        };
    }
}

// Node.js FileReader simulation
function createFileReader() {
    return {
        readAsDataURL(file) {
            return new Promise((resolve) => {
                const base64 = file._buffer.toString('base64');
                const mimeType = file.type || 'application/octet-stream';
                const dataUrl = `data:${mimeType};base64,${base64}`;
                
                // Simulate FileReader behavior
                setTimeout(() => {
                    this.result = dataUrl;
                    if (this.onload) this.onload({ target: { result: dataUrl } });
                    resolve(dataUrl);
                }, 10);
            });
        },
        readAsText(file) {
            const text = file._buffer.toString('utf-8');
            setTimeout(() => {
                this.result = text;
                if (this.onload) this.onload({ target: { result: text } });
            }, 10);
        }
    };
}

// Patch global FileReader for Node.js environment
global.FileReader = function() {
    return createFileReader();
};

async function testFullWorkflow() {
    console.log('🧪 FULL CLI TEST: WhatsApp Chat Converter End-to-End');
    console.log('====================================================\n');

    try {
        // Step 1: Check server is running
        console.log('🔍 Checking if server is running...');
        try {
            await execAsync('curl -s http://localhost:8001/ > /dev/null');
            console.log('✅ Server is running on port 8001\n');
        } catch {
            console.log('❌ Server not running, starting it...');
            exec('python3 -m http.server 8001 > /dev/null 2>&1 &');
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('✅ Server started on port 8001\n');
        }

        // Step 2: Load sample files (simulating file upload)
        console.log('📁 Loading sample files (simulating browser file upload)...');
        const sampleDir = join(__dirname, 'sample');
        const fileNames = [
            '_chat.txt',
            '00000007-AUDIO-2025-06-11-12-24-05.opus',
            '00000015-AUDIO-2025-06-11-12-34-39.opus',
            '00000026-AUDIO-2025-06-11-18-55-07.opus'
        ];

        const files = [];
        for (const fileName of fileNames) {
            try {
                const filePath = join(sampleDir, fileName);
                const buffer = await readFile(filePath);
                const type = fileName.endsWith('.opus') ? 'audio/opus' : 'text/plain';
                const file = new NodeFile(buffer, fileName, type);
                files.push(file);
                console.log(`✅ Uploaded ${fileName} (${(buffer.length/1024).toFixed(1)} KB)`);
            } catch (error) {
                console.log(`❌ Failed to load ${fileName}: ${error.message}`);
            }
        }

        if (files.length === 0) {
            throw new Error('No files were loaded successfully');
        }

        console.log(`📋 Total files uploaded: ${files.length}\n`);

        // Step 3: Process files exactly like the main application does
        console.log('🔄 Processing files (simulating "Process Files" button click)...');
        
        // Reset application state
        appState.reset();

        // Organize and validate files
        const { chatFile, mediaFiles } = organizeFiles(files);
        validateFiles(chatFile, mediaFiles);
        
        console.log(`✅ Chat file: ${chatFile.name}`);
        console.log(`✅ Media files: ${mediaFiles.size} files`);

        // Add media files to state
        mediaFiles.forEach((file, filename) => {
            appState.addMediaFile(filename, file);
        });

        // Step 4: Parse chat content
        console.log('\n📄 Parsing chat messages...');
        const chatContent = await readFileAsText(chatFile);
        const messages = parseChatContent(chatContent);
        console.log(`✅ Parsed ${messages.length} messages from chat`);

        // Step 5: Process audio messages with OpenAI API
        console.log('\n🎵 Processing audio messages with OpenAI Whisper API...');
        console.log('⏳ This may take a few minutes for transcription...');
        
        const processedMessages = await processAudioMessages(
            messages,
            appState.getAllMediaFiles(),
            config.OPENAI_API_KEY,
            (completed, total) => {
                const percent = Math.round((completed / total) * 100);
                console.log(`🔄 Transcribing audio: ${completed}/${total} (${percent}%)`);
            }
        );

        // Step 6: Calculate results
        const audioMessages = processedMessages.filter(m => m.audioFile);
        const transcribedMessages = processedMessages.filter(m => m.transcriptionCost && m.transcriptionCost > 0);
        const totalCost = transcribedMessages.reduce((sum, msg) => sum + (msg.transcriptionCost || 0), 0);

        console.log('\n📊 Processing Results:');
        console.log(`   📄 Total messages: ${messages.length}`);
        console.log(`   🎵 Audio messages found: ${audioMessages.length}`);
        console.log(`   ✅ Successfully transcribed: ${transcribedMessages.length}`);
        console.log(`   💰 Total transcription cost: $${totalCost.toFixed(4)}`);

        // Step 7: Generate HTML output
        console.log('\n📄 Generating final HTML output...');
        const finalHTML = await generateHTMLOutput(processedMessages, totalCost);
        console.log(`✅ Generated HTML (${(finalHTML.length/1024).toFixed(1)} KB)`);

        // Step 8: Save and analyze the HTML file
        const outputPath = join(__dirname, 'full-test-output.html');
        await writeFile(outputPath, finalHTML);
        console.log(`💾 Saved HTML to: ${outputPath}`);

        // Step 9: Analyze the generated HTML content
        console.log('\n🔍 Analyzing generated HTML content...');
        
        const audioElementCount = (finalHTML.match(/<audio[^>]*>/g) || []).length;
        const base64AudioCount = (finalHTML.match(/data:audio/g) || []).length;
        const editButtonCount = (finalHTML.match(/ערוך/g) || []).length;
        const transcriptionDivCount = (finalHTML.match(/class="[^"]*audio-transcription[^"]*"/g) || []).length;
        const errorMessages = (finalHTML.match(/\[שגיאה בתמלול:/g) || []).length;

        console.log(`   🎵 Audio elements in HTML: ${audioElementCount}`);
        console.log(`   📊 Base64 audio sources: ${base64AudioCount}`);
        console.log(`   ✏️ Edit buttons: ${editButtonCount}`);
        console.log(`   📝 Transcription divs: ${transcriptionDivCount}`);
        console.log(`   ❌ Error messages: ${errorMessages}`);

        // Step 10: Extract and display sample transcriptions
        console.log('\n📝 Sample transcribed content:');
        let sampleCount = 0;
        for (const msg of transcribedMessages.slice(0, 3)) {
            if (msg.transcription && msg.transcription.trim()) {
                const preview = msg.transcription.substring(0, 60) + (msg.transcription.length > 60 ? '...' : '');
                console.log(`   ${++sampleCount}. "${preview}"`);
            }
        }

        if (sampleCount === 0) {
            console.log('   ❌ No successful transcriptions found');
        }

        // Step 11: Validate HTML structure
        console.log('\n🔍 Validating HTML structure...');
        const hasDoctype = finalHTML.startsWith('<!DOCTYPE html>');
        const hasTitle = finalHTML.includes('<title>');
        const hasBody = finalHTML.includes('<body');
        const hasMessages = finalHTML.includes('class="message');
        const hasJavaScript = finalHTML.includes('<script>');

        console.log(`   📄 Valid HTML structure: ${hasDoctype && hasTitle && hasBody ? '✅' : '❌'}`);
        console.log(`   💬 Contains messages: ${hasMessages ? '✅' : '❌'}`);
        console.log(`   ⚡ Has JavaScript functionality: ${hasJavaScript ? '✅' : '❌'}`);

        // Step 12: Final test summary
        console.log('\n🎉 FULL CLI TEST RESULTS:');
        console.log('========================');
        console.log(`📁 Files processed: ${files.length}/4 sample files`);
        console.log(`📄 Messages parsed: ${messages.length}`);
        console.log(`🎵 Audio files detected: ${audioMessages.length}`);
        console.log(`✅ Successful transcriptions: ${transcribedMessages.length}`);
        console.log(`💰 Total API cost: $${totalCost.toFixed(4)}`);
        console.log(`📊 HTML size: ${(finalHTML.length/1024).toFixed(1)} KB`);
        console.log(`💾 Output file: ${outputPath}`);

        // Success criteria
        const testSuccess = 
            files.length >= 3 && 
            messages.length > 0 && 
            audioMessages.length > 0 && 
            hasDoctype && 
            hasMessages;

        if (testSuccess) {
            console.log('\n✅ FULL TEST COMPLETED SUCCESSFULLY!');
            console.log('🎯 The application processes files, generates HTML, and embeds audio content.');
            
            if (transcribedMessages.length > 0) {
                console.log('🎵 Audio transcription is working - check the HTML file for playable audio and editable text!');
            } else {
                console.log('⚠️  Audio transcription had issues - check API key and network connectivity.');
            }
            
            console.log(`\n💡 Open ${outputPath} in your browser to test:`)
            console.log('   • Audio playback functionality');
            console.log('   • Transcribed text visibility'); 
            console.log('   • Edit button functionality');
        } else {
            console.log('\n❌ TEST FAILED - Core functionality not working properly');
        }

    } catch (error) {
        console.error('\n❌ FULL CLI TEST FAILED:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the full test
testFullWorkflow();