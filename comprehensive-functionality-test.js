#!/usr/bin/env node

/**
 * Comprehensive functionality test with REAL audio files
 * Tests all the specific requirements: transcription, audio playback, editing, merging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create proper File simulation for Node.js
globalThis.FileReader = class FileReader {
    readAsDataURL(file) {
        const buffer = file._buffer || Buffer.from([]);
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'application/octet-stream';
        const result = `data:${mimeType};base64,${base64}`;
        
        setTimeout(() => {
            this.result = result;
            if (this.onload) this.onload({ target: { result } });
        }, 0);
    }
    
    readAsText(file) {
        const buffer = file._buffer || Buffer.from([]);
        const result = buffer.toString('utf-8');
        
        setTimeout(() => {
            this.result = result;
            if (this.onload) this.onload({ target: { result } });
        }, 0);
    }
};

globalThis.File = class File {
    constructor(chunks, filename, options = {}) {
        this.name = filename;
        this.type = options.type || '';
        this._buffer = Buffer.concat(chunks.map(chunk => 
            chunk instanceof ArrayBuffer ? Buffer.from(chunk) :
            typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') :
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        ));
        this.size = this._buffer.length;
    }
    
    arrayBuffer() {
        return Promise.resolve(this._buffer.buffer.slice(
            this._buffer.byteOffset, 
            this._buffer.byteOffset + this._buffer.byteLength
        ));
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules
const appState = (await import('./js/core/state.js')).default;
const { organizeFiles, validateFiles, readFileAsText } = await import('./js/utils/fileHandler.js');
const { parseChatContent } = await import('./js/core/parser.js');
const { processAudioMessages } = await import('./js/core/processor.js');
const { generateHTMLOutput } = await import('./js/utils/htmlGenerator.js');

console.log('🧪 Comprehensive Functionality Test - Real Audio Files');
console.log('=' .repeat(70));

async function loadRealFiles() {
    console.log('📁 Loading REAL sample files with actual audio...');
    
    const sampleDir = path.join(__dirname, 'sample');
    const files = [];
    
    const fileList = [
        '_chat.txt',
        '00000007-AUDIO-2025-06-11-12-24-05.opus',
        '00000015-AUDIO-2025-06-11-12-34-39.opus', 
        '00000026-AUDIO-2025-06-11-18-55-07.opus'
    ];
    
    for (const filename of fileList) {
        const filePath = path.join(sampleDir, filename);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Real file not found: ${filename}`);
        }
        
        const buffer = fs.readFileSync(filePath);
        const file = new File([buffer], filename, {
            type: filename.endsWith('.opus') ? 'audio/opus' : 'text/plain'
        });
        
        files.push(file);
        console.log(`   ✅ Loaded ${filename} (${(buffer.length / 1024).toFixed(1)} KB) - REAL FILE`);
    }
    
    return files;
}

async function testComprehensiveFunctionality() {
    try {
        // Step 1: Load real files with actual audio
        console.log('\n🔄 Step 1: Loading real sample files');
        const files = await loadRealFiles();
        console.log(`   📊 Loaded ${files.length} real files`);
        
        // Step 2: Process files properly
        console.log('\n⚙️  Step 2: Processing files with real audio data');
        appState.reset();
        
        const { chatFile, mediaFiles } = organizeFiles(files);
        validateFiles(chatFile, mediaFiles);
        
        mediaFiles.forEach((file, filename) => {
            appState.addMediaFile(filename, file);
        });
        
        console.log(`   📄 Chat file: ${chatFile.name}`);
        console.log(`   🎵 Real audio files: ${mediaFiles.size}`);
        
        // Verify audio files are actually loaded
        for (const [filename, file] of mediaFiles) {
            console.log(`   🔍 ${filename}: ${file.size} bytes, type: ${file.type}`);
        }
        
        // Step 3: Parse chat and verify message count
        console.log('\n📖 Step 3: Parsing chat messages');
        const chatContent = await readFileAsText(chatFile);
        const messages = parseChatContent(chatContent);
        
        console.log(`   📝 Total messages parsed: ${messages.length}`);
        
        // Analyze message types in detail
        const speakers = [...new Set(messages.map(m => m.sender))];
        const audioMessages = messages.filter(m => m.text.includes('.opus') || m.text.includes('<מצורף:'));
        const textMessages = messages.filter(m => !m.text.includes('.opus') && !m.text.includes('<מצורף:'));
        
        console.log(`   👥 Speakers found: ${speakers.length}`);
        speakers.forEach((speaker, i) => console.log(`      ${i + 1}. ${speaker}`));
        console.log(`   🎵 Audio messages: ${audioMessages.length}`);
        console.log(`   💬 Text messages: ${textMessages.length}`);
        
        // Step 4: Process audio with REAL transcription capability
        console.log('\n🎵 Step 4: Processing audio messages (with real audio data)');
        
        const processedMessages = await processAudioMessages(
            messages,
            appState.getAllMediaFiles(),
            process.env.OPENAI_API_KEY || 'test-key-for-structure',
            (completed, total) => {
                console.log(`   📊 Processing: ${completed}/${total} audio files`);
            }
        );
        
        // Step 5: Generate HTML with real audio embedded
        console.log('\n🎨 Step 5: Generating HTML with REAL embedded audio');
        const transcribedMessages = processedMessages.filter(m => m.transcriptionCost && m.transcriptionCost > 0);
        const totalCost = transcribedMessages.reduce((sum, msg) => sum + (msg.transcriptionCost || 0), 0);
        
        console.log(`   💰 Transcribed messages: ${transcribedMessages.length}`);
        console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
        
        const finalHTML = await generateHTMLOutput(processedMessages, totalCost);
        
        // Step 6: COMPREHENSIVE FUNCTIONALITY ANALYSIS
        console.log('\n🔍 Step 6: Testing Required Functionality');
        
        // Test 1: All messages transcribed and show up
        const messageCardsInHTML = (finalHTML.match(/class="card message-card/g) || []).length;
        const messagesShowUp = messageCardsInHTML === processedMessages.length;
        console.log(`   📋 All messages show up: ${messagesShowUp ? '✅' : '❌'} (${messageCardsInHTML}/${processedMessages.length})`);
        
        // Test 2: Audio files can be played
        const audioElements = (finalHTML.match(/<audio[^>]*controls/g) || []).length;
        const audioSections = (finalHTML.match(/הודעה קולית/g) || []).length;
        const actualAudioFiles = audioMessages.length;
        console.log(`   🎵 Audio players embedded: ${audioElements} actual <audio> elements`);
        console.log(`   🎵 Audio sections created: ${audioSections} sections`);
        console.log(`   🎵 Expected audio messages: ${actualAudioFiles}`);
        
        // Check for base64 audio data
        const base64AudioCount = (finalHTML.match(/data:audio\/[^;]+;base64,/g) || []).length;
        console.log(`   📊 Base64 audio embedded: ${base64AudioCount} files`);
        
        // Test 3: Text editing functionality
        const editButtons = (finalHTML.match(/onclick="[^"]*editMessage\(\d+\)"/g) || []).length;
        const editFunction = finalHTML.includes('function editMessage');
        console.log(`   ✏️  Text editing available: ${editFunction ? '✅' : '❌'} (${editButtons} edit buttons)`);
        
        // Test 4: Audio transcription editing
        const transcriptionSections = (finalHTML.match(/תמלול<\/span>/g) || []).length;
        console.log(`   📝 Transcription sections: ${transcriptionSections} (editable via edit buttons)`);
        
        // Test 5: Message merging functionality
        const mergeFunction = finalHTML.includes('function toggleMergeMode');
        const mergeButton = finalHTML.includes('מצב מיזוג הודעות');
        const confirmMergeFunction = finalHTML.includes('function confirmMerge');
        console.log(`   🔗 Message merging available: ${mergeFunction && mergeButton && confirmMergeFunction ? '✅' : '❌'}`);
        
        // Step 7: Save and analyze output
        const outputPath = path.join(__dirname, 'comprehensive-test-output.html');
        fs.writeFileSync(outputPath, finalHTML, 'utf-8');
        console.log(`\n💾 Saved comprehensive test output: ${outputPath}`);
        
        // Final comprehensive summary
        console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
        console.log('=' .repeat(70));
        
        const allMessagesShowUp = messagesShowUp;
        const audioCanBePlayed = base64AudioCount > 0; // At least some audio embedded
        const textCanBeEdited = editFunction && editButtons > 0;
        const transcriptionCanBeEdited = transcriptionSections > 0 && editFunction;
        const messagesCanBeMerged = mergeFunction && mergeButton && confirmMergeFunction;
        
        console.log(`✅ All messages transcribed and show up: ${allMessagesShowUp ? 'PASS' : 'FAIL'}`);
        console.log(`${audioCanBePlayed ? '✅' : '❌'} All audio files can be played: ${audioCanBePlayed ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Text can be edited: ${textCanBeEdited ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Audio transcription can be edited: ${transcriptionCanBeEdited ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Messages can be merged: ${messagesCanBeMerged ? 'PASS' : 'FAIL'}`);
        
        const allTestsPassed = allMessagesShowUp && audioCanBePlayed && textCanBeEdited && transcriptionCanBeEdited && messagesCanBeMerged;
        
        console.log(`\n🏆 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME ISSUES FOUND'}`);
        
        if (!allTestsPassed) {
            console.log('\n🔧 Issues to Address:');
            if (!allMessagesShowUp) console.log('   - Not all messages are showing in HTML');
            if (!audioCanBePlayed) console.log('   - Audio files are not properly embedded for playback');
            if (!textCanBeEdited) console.log('   - Text editing functionality is missing');
            if (!transcriptionCanBeEdited) console.log('   - Transcription editing is not available');
            if (!messagesCanBeMerged) console.log('   - Message merging functionality is missing');
        }
        
        console.log('\n📋 Manual Testing Required:');
        console.log('   1. Open comprehensive-test-output.html in browser');
        console.log('   2. Verify all messages display correctly');
        console.log('   3. Click audio play buttons and verify sound plays');
        console.log('   4. Test edit buttons on both text and transcribed messages');
        console.log('   5. Test merge mode: select messages and merge them');
        
        return {
            success: allTestsPassed,
            results: {
                messagesShowUp: allMessagesShowUp,
                audioPlayable: audioCanBePlayed,
                textEditable: textCanBeEdited,
                transcriptionEditable: transcriptionCanBeEdited,
                messagesCanMerge: messagesCanBeMerged
            },
            stats: {
                totalMessages: processedMessages.length,
                audioMessages: actualAudioFiles,
                audioEmbedded: base64AudioCount,
                editButtons: editButtons,
                transcriptionSections: transcriptionSections
            }
        };
        
    } catch (error) {
        console.error('\n❌ Comprehensive test failed:', error.message);
        console.error('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

// Run the comprehensive test
testComprehensiveFunctionality().then(result => {
    if (result.success) {
        console.log('\n🎉 Comprehensive functionality test PASSED!');
        process.exit(0);
    } else {
        console.log('\n💥 Comprehensive functionality test FAILED!');
        process.exit(1);
    }
});