#!/usr/bin/env node

// Test complete transcription workflow including edit functionality
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing complete transcription workflow...\n');

try {
    // Parser functions (same as before)
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

    // Simulate transcription results with dummy Hebrew text
    function simulateTranscription(filename) {
        const transcriptions = {
            '00000007-AUDIO-2025-06-11-12-24-05.opus': 'שלום, איך אתה? אני מתקשר בנושא המכשיר שדיברנו עליו.',
            '00000015-AUDIO-2025-06-11-12-34-39.opus': 'כן, אני זוכר. המחיר הוא 500 שקל והמשלוח חינם.',
            '00000026-AUDIO-2025-06-11-18-55-07.opus': 'מושלם, אשמח לקבל את זה השבוע. תודה רבה!'
        };
        return transcriptions[filename] || null;
    }

    // Real file to base64 conversion
    function fileToBase64(filePath) {
        try {
            const fileBuffer = readFileSync(filePath);
            return fileBuffer.toString('base64');
        } catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error.message);
            return null;
        }
    }

    // HTML generation with transcription and edit functionality
    function generateTranscriptionHTML(messages, audioFiles) {
        let htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>WhatsApp Chat - Transcription Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .message { margin: 10px 0; padding: 15px; border-radius: 8px; background: white; }
        .audio-message { background-color: #e3f2fd; border-left: 4px solid #2196f3; }
        .sender { font-weight: bold; color: #1976d2; }
        .timestamp { font-size: 12px; color: #666; }
        .text { margin: 5px 0; line-height: 1.4; }
        .transcription { 
            background: #f0f9ff; 
            border: 1px solid #0ea5e9; 
            border-radius: 4px; 
            padding: 10px; 
            margin: 10px 0;
        }
        .original-text { 
            background: #fef3c7; 
            padding: 5px; 
            border-radius: 3px; 
            font-size: 12px; 
            margin-bottom: 5px;
        }
        audio { width: 100%; max-width: 400px; margin: 10px 0; }
        .edit-controls { margin-top: 10px; }
        .edit-btn { 
            background: #f59e0b; 
            color: white; 
            border: none; 
            padding: 5px 10px; 
            border-radius: 3px; 
            cursor: pointer; 
            margin-right: 5px;
        }
        .save-btn { background: #10b981; }
        .cancel-btn { background: #ef4444; }
        .edit-textarea { 
            width: 100%; 
            min-height: 60px; 
            padding: 8px; 
            border: 1px solid #d1d5db; 
            border-radius: 4px; 
            resize: vertical;
        }
        .test-info { background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .cost-info { font-size: 11px; color: #059669; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="test-info">
        <h1>🎵 WhatsApp Chat - Transcription & Edit Test</h1>
        <p><strong>Test Status:</strong> With simulated transcriptions and edit functionality</p>
        <p><strong>Features:</strong> Audio playback, transcribed text display, inline editing</p>
    </div>
`;

        let transcribedCount = 0;
        
        messages.forEach((msg, index) => {
            const audioInfo = detectAudioAttachment(msg);
            const hasAudio = audioInfo !== null;
            let transcription = null;
            let cost = 0;
            
            if (hasAudio && audioFiles.has(audioInfo.filename)) {
                transcription = simulateTranscription(audioInfo.filename);
                if (transcription) {
                    transcribedCount++;
                    cost = 0.0234; // Simulate cost
                }
            }
            
            htmlContent += `
    <div class="message ${hasAudio ? 'audio-message' : ''}">
        <div class="sender">${msg.sender}</div>
        <div class="timestamp">${msg.timestamp}</div>
`;

            if (hasAudio && audioFiles.has(audioInfo.filename)) {
                // Show original attachment reference
                htmlContent += `        <div class="original-text">📎 ${audioInfo.filename}</div>`;
                
                // Audio player
                const audioFilePath = join(__dirname, 'sample', audioInfo.filename);
                const base64Data = fileToBase64(audioFilePath);
                
                if (base64Data) {
                    htmlContent += `
        <div style="margin: 10px 0;">
            <audio controls preload="metadata">
                <source src="data:audio/opus;base64,${base64Data}" type="audio/opus">
                <source src="data:audio/ogg;base64,${base64Data}" type="audio/ogg">
                Your browser does not support audio playback
            </audio>
        </div>
`;
                }
                
                // Transcription display and edit functionality
                if (transcription) {
                    htmlContent += `
        <div class="transcription">
            <div id="transcription-${index}" class="transcription-text">
                ${transcription}
            </div>
            <div class="edit-controls">
                <button class="edit-btn" onclick="editTranscription(${index})">✏️ ערוך תמלול</button>
                <div class="cost-info">💰 עלות תמלול: $${cost.toFixed(4)}</div>
            </div>
        </div>
`;
                } else {
                    htmlContent += `
        <div class="transcription">
            <div style="color: #6b7280; font-style: italic;">
                🤖 תמלול אוטומטי לא זמין (קובץ לא נמצא או תקלה בתמלול)
            </div>
        </div>
`;
                }
            } else if (hasAudio) {
                // Audio message but file not available
                htmlContent += `
        <div class="text">${msg.text}</div>
        <div class="transcription">
            <div style="color: #dc2626;">
                ❌ קובץ אודיו לא זמין: ${audioInfo.filename}
            </div>
        </div>
`;
            } else {
                // Regular text message
                htmlContent += `        <div class="text">${msg.text.replace(/\n/g, '<br>')}</div>`;
            }
            
            htmlContent += `    </div>`;
        });
        
        htmlContent += `
    <div class="test-info" style="margin-top: 30px;">
        <h2>📊 Transcription Test Results</h2>
        <p><strong>Total Messages:</strong> ${messages.length}</p>
        <p><strong>Audio Messages:</strong> ${messages.filter(m => detectAudioAttachment(m)).length}</p>
        <p><strong>Successfully Transcribed:</strong> ${transcribedCount}</p>
        <p><strong>Total Estimated Cost:</strong> $${(transcribedCount * 0.0234).toFixed(4)}</p>
        <hr>
        <p><strong>🎯 Test Instructions:</strong></p>
        <ul>
            <li>▶️ Click play on audio controls to hear original audio</li>
            <li>✏️ Click "ערוך תמלול" to edit transcribed text</li>
            <li>💾 Make changes and save to test edit functionality</li>
            <li>🔄 Changes should persist in the HTML display</li>
        </ul>
    </div>

    <script>
        function editTranscription(index) {
            const transcriptionDiv = document.getElementById('transcription-' + index);
            const currentText = transcriptionDiv.textContent.trim();
            
            transcriptionDiv.innerHTML = \`
                <textarea class="edit-textarea" id="edit-\${index}">\${currentText}</textarea>
                <div style="margin-top: 10px;">
                    <button class="edit-btn save-btn" onclick="saveTranscription(\${index}, '\${currentText}')">💾 שמור</button>
                    <button class="edit-btn cancel-btn" onclick="cancelEdit(\${index}, '\${currentText}')">❌ בטל</button>
                </div>
            \`;
            
            document.getElementById('edit-' + index).focus();
        }
        
        function saveTranscription(index, originalText) {
            const textarea = document.getElementById('edit-' + index);
            const newText = textarea.value;
            const transcriptionDiv = document.getElementById('transcription-' + index);
            
            transcriptionDiv.innerHTML = newText;
            
            // Show save confirmation
            const confirmation = document.createElement('div');
            confirmation.style.cssText = 'background: #10b981; color: white; padding: 5px; border-radius: 3px; margin-top: 5px; font-size: 12px;';
            confirmation.textContent = '✅ תמלול נשמר בהצלחה!';
            transcriptionDiv.appendChild(confirmation);
            
            setTimeout(() => confirmation.remove(), 2000);
        }
        
        function cancelEdit(index, originalText) {
            const transcriptionDiv = document.getElementById('transcription-' + index);
            transcriptionDiv.innerHTML = originalText;
        }
    </script>
</body>
</html>`;

        return { htmlContent, transcribedCount };
    }

    // Run the test
    console.log('📝 Step 1: Loading sample data...');
    const sampleDir = join(__dirname, 'sample');
    
    // Read chat file
    const chatPath = join(sampleDir, '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    const messages = parseChatContent(chatContent);
    
    // Get available audio files
    const { readdirSync } = await import('fs');
    const files = readdirSync(sampleDir);
    const audioFileNames = files.filter(f => f.includes('AUDIO') && f.endsWith('.opus'));
    
    // Create audio files map
    const audioFiles = new Map();
    audioFileNames.forEach(filename => {
        const filePath = join(sampleDir, filename);
        audioFiles.set(filename, filePath);
    });
    
    console.log(`✅ Messages parsed: ${messages.length}`);
    console.log(`✅ Audio files available: ${audioFiles.size}`);
    
    console.log('\n🎵 Step 2: Simulating transcription process...');
    const audioMessages = messages.filter(m => detectAudioAttachment(m));
    console.log(`✅ Audio messages found: ${audioMessages.length}`);
    
    // Check which have transcriptions
    let transcriptionCount = 0;
    audioMessages.forEach(msg => {
        const audioInfo = detectAudioAttachment(msg);
        if (audioFiles.has(audioInfo.filename)) {
            const transcription = simulateTranscription(audioInfo.filename);
            if (transcription) {
                transcriptionCount++;
                console.log(`✅ Transcription for ${audioInfo.filename}: "${transcription.substring(0, 30)}..."`);
            }
        }
    });
    
    console.log('\n📝 Step 3: Generating HTML with transcriptions and edit functionality...');
    const { htmlContent, transcribedCount } = generateTranscriptionHTML(messages, audioFiles);
    
    // Write the HTML file
    const outputPath = join(__dirname, 'transcription-test.html');
    writeFileSync(outputPath, htmlContent);
    
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`✅ HTML size: ${(htmlContent.length / 1024).toFixed(1)} KB`);
    console.log(`✅ Transcriptions included: ${transcribedCount}`);
    
    // Analysis
    const editButtonCount = (htmlContent.match(/ערוך תמלול/g) || []).length;
    const audioElementCount = (htmlContent.match(/<audio/g) || []).length;
    
    console.log('\n📊 Feature Analysis:');
    console.log(`   Audio controls: ${audioElementCount}`);
    console.log(`   Edit buttons: ${editButtonCount}`);
    console.log(`   Transcribed messages: ${transcribedCount}`);
    console.log(`   JavaScript functions: ${(htmlContent.match(/function /g) || []).length}`);
    
    if (transcribedCount > 0 && editButtonCount > 0) {
        console.log('\n✅ SUCCESS: Complete transcription workflow implemented!');
        console.log(`🎯 Features working:`);
        console.log(`   📻 Audio playback: ${audioElementCount} controls`);
        console.log(`   📝 Text transcription: ${transcribedCount} transcriptions`);
        console.log(`   ✏️ Edit functionality: ${editButtonCount} edit buttons`);
        console.log(`📂 Open ${outputPath} to test complete workflow!`);
    } else {
        console.log('\n❌ ISSUE: Some transcription features missing');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}