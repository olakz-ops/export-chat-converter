#!/usr/bin/env node

// Final verification test of the complete WhatsApp Chat Converter
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
}

// Mock FileReader for Node.js
global.FileReader = function() {
    return {
        readAsDataURL(file) {
            const base64 = file._buffer.toString('base64');
            const mimeType = file.type || 'application/octet-stream';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            setTimeout(() => {
                this.result = dataUrl;
                if (this.onload) this.onload({ target: { result: dataUrl } });
            }, 10);
        },
        readAsText(file) {
            const text = file._buffer.toString('utf-8');
            setTimeout(() => {
                this.result = text;
                if (this.onload) this.onload({ target: { result: text } });
            }, 10);
        }
    };
};

async function runFinalVerification() {
    console.log('🎯 FINAL VERIFICATION: Complete WhatsApp Chat Converter Test');
    console.log('===========================================================\n');

    try {
        // Step 1: Load all sample files
        console.log('📁 Loading sample files...');
        const sampleDir = join(__dirname, 'sample');
        const fileNames = [
            '_chat.txt',
            '00000007-AUDIO-2025-06-11-12-24-05.opus',
            '00000015-AUDIO-2025-06-11-12-34-39.opus',
            '00000026-AUDIO-2025-06-11-18-55-07.opus'
        ];

        const files = [];
        for (const fileName of fileNames) {
            const filePath = join(sampleDir, fileName);
            const buffer = await readFile(filePath);
            const type = fileName.endsWith('.opus') ? 'audio/opus' : 'text/plain';
            const file = new NodeFile(buffer, fileName, type);
            files.push(file);
            console.log(`✅ Loaded ${fileName} (${(buffer.length/1024).toFixed(1)} KB)`);
        }

        // Step 2: Process files through complete workflow
        console.log('\n🔄 Processing complete workflow...');
        appState.reset();

        const { chatFile, mediaFiles } = organizeFiles(files);
        validateFiles(chatFile, mediaFiles);
        
        mediaFiles.forEach((file, filename) => {
            appState.addMediaFile(filename, file);
        });

        // Step 3: Parse chat content
        const chatContent = await readFileAsText(chatFile);
        const messages = parseChatContent(chatContent);
        console.log(`📄 Parsed ${messages.length} messages from chat`);

        // Step 4: Process audio with FIXED transcription (OPUS→OGG)
        console.log('\n🎵 Transcribing audio files (with OPUS→OGG fix)...');
        const processedMessages = await processAudioMessages(
            messages,
            appState.getAllMediaFiles(),
            config.OPENAI_API_KEY,
            (completed, total) => {
                console.log(`🔄 Progress: ${completed}/${total} (${Math.round((completed/total)*100)}%)`);
            }
        );

        // Step 5: Analyze results
        const audioMessages = processedMessages.filter(m => m.audioFile);
        const transcribedMessages = processedMessages.filter(m => m.transcriptionCost && m.transcriptionCost > 0);
        const errorMessages = processedMessages.filter(m => m.transcriptionError);
        const totalCost = transcribedMessages.reduce((sum, msg) => sum + (msg.transcriptionCost || 0), 0);

        console.log('\n📊 Processing Analysis:');
        console.log(`   📄 Total messages: ${messages.length}`);
        console.log(`   🎵 Audio messages detected: ${audioMessages.length}`);
        console.log(`   ✅ Successfully transcribed: ${transcribedMessages.length}`);
        console.log(`   ❌ Transcription errors: ${errorMessages.length}`);
        console.log(`   💰 Total API cost: $${totalCost.toFixed(4)}`);

        // Step 6: Generate final HTML
        console.log('\n📄 Generating final HTML...');
        const finalHTML = await generateHTMLOutput(processedMessages, totalCost);
        
        // Step 7: Save and analyze HTML
        const outputPath = join(__dirname, 'final-verified-output.html');
        await writeFile(outputPath, finalHTML);
        
        const audioElementCount = (finalHTML.match(/<audio[^>]*>/g) || []).length;
        const base64AudioCount = (finalHTML.match(/data:audio/g) || []).length;
        const editButtonCount = (finalHTML.match(/ערוך/g) || []).length;
        const transcriptionDivCount = (finalHTML.match(/class="[^"]*audio-transcription[^"]*"/g) || []).length;

        console.log('\n🔍 HTML Analysis:');
        console.log(`   🎵 Audio elements: ${audioElementCount}`);
        console.log(`   📊 Base64 audio sources: ${base64AudioCount}`);
        console.log(`   ✏️ Edit buttons: ${editButtonCount}`);
        console.log(`   📝 Transcription divs: ${transcriptionDivCount}`);
        console.log(`   📁 HTML file size: ${(finalHTML.length/1024).toFixed(1)} KB`);

        // Step 8: Display sample transcriptions
        console.log('\n📝 Sample Transcribed Content:');
        transcribedMessages.slice(0, 3).forEach((msg, i) => {
            if (msg.text && msg.text.length > 10) {
                const preview = msg.text.substring(0, 60) + (msg.text.length > 60 ? '...' : '');
                console.log(`   ${i + 1}. "${preview}"`);
            }
        });

        // Step 9: Final verification checklist
        console.log('\n✅ FINAL VERIFICATION CHECKLIST:');
        const checks = [
            { name: 'Files loaded successfully', passed: files.length === 4 },
            { name: 'Messages parsed correctly', passed: messages.length > 0 },
            { name: 'Audio files detected', passed: audioMessages.length > 0 },
            { name: 'Transcriptions completed', passed: transcribedMessages.length > 0 },
            { name: 'No transcription errors', passed: errorMessages.length === 0 },
            { name: 'HTML generated with audio', passed: audioElementCount > 0 },
            { name: 'Base64 audio embedded', passed: base64AudioCount > 0 },
            { name: 'Edit functionality available', passed: editButtonCount > 0 },
            { name: 'Valid HTML structure', passed: finalHTML.includes('<!DOCTYPE html>') },
            { name: 'API cost calculated', passed: totalCost > 0 }
        ];

        checks.forEach(check => {
            console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
        });

        const allPassed = checks.every(check => check.passed);
        
        console.log('\n🎉 FINAL VERIFICATION RESULTS:');
        console.log('=============================');
        if (allPassed) {
            console.log('🎯 ALL TESTS PASSED! The WhatsApp Chat Converter is working perfectly.');
            console.log('');
            console.log('✅ Complete functionality verified:');
            console.log('   • File upload and processing');
            console.log('   • Chat parsing and message detection');
            console.log('   • Audio file matching and embedding');
            console.log('   • OPUS to OGG conversion for Whisper API');
            console.log('   • Real transcription with OpenAI Whisper');
            console.log('   • HTML generation with playable audio');
            console.log('   • Edit functionality for transcriptions');
            console.log('   • Cost calculation and tracking');
            console.log('');
            console.log(`💾 Final output saved to: ${outputPath}`);
            console.log('🌐 Open this file in your browser to test audio playback and editing!');
        } else {
            console.log('❌ Some tests failed. Review the checklist above.');
        }

    } catch (error) {
        console.error('\n❌ FINAL VERIFICATION FAILED:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the final verification
runFinalVerification();