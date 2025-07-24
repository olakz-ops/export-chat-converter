#!/usr/bin/env node

// Test what the user actually sees in the final workflow
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing final user workflow with simulated transcriptions...\n');

try {
    // Simulate the complete application workflow
    
    // Step 1: Parse messages (like the app does)
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

    // Step 2: Simulate audio processing (like processor.js does)
    function simulateAudioProcessing(messages, availableFiles) {
        return messages.map((message, index) => {
            const audioInfo = detectAudioAttachment(message);
            
            if (audioInfo && availableFiles.has(audioInfo.filename)) {
                // Simulate successful transcription
                const transcriptions = {
                    '00000007-AUDIO-2025-06-11-12-24-05.opus': 'שלום רפאל, איך אתה? אני מתקשר לגבי המכשיר תדרים שדיברנו עליו. אפשר לקבל פרטים נוספים?',
                    '00000015-AUDIO-2025-06-11-12-34-39.opus': 'כן בטח, המחיר הוא 500 שקל והמשלוח חינם לכל הארץ. המכשיר מגיע עם אחריות של שנה.',
                    '00000026-AUDIO-2025-06-11-18-55-07.opus': 'מושלם, אני מעוניין לקנות. אפשר לשלם באשראי? ומתי זה יגיע?'
                };
                
                const transcriptionText = transcriptions[audioInfo.filename];
                const cost = 0.0156; // Simulate cost based on length
                
                if (transcriptionText) {
                    return {
                        ...message,
                        text: transcriptionText, // Replace original with transcription
                        audioFile: audioInfo.filename,
                        transcriptionCost: cost,
                        originalAudio: availableFiles.get(audioInfo.filename)
                    };
                }
            }
            
            // For messages without audio or failed transcription, keep original
            if (audioInfo) {
                return {
                    ...message,
                    audioFile: audioInfo.filename,
                    originalAudio: availableFiles.get(audioInfo.filename) || null
                };
            }
            
            return message;
        });
    }

    // Step 3: Generate HTML exactly like the app does
    function fileToBase64(filePath) {
        try {
            const fileBuffer = readFileSync(filePath);
            return fileBuffer.toString('base64');
        } catch (error) {
            return null;
        }
    }

    async function generateFinalHTML(messages, totalCost) {
        let html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat Export - Final Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .message-text { word-wrap: break-word; }
        .audio-transcription { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 8px; margin: 8px 0; }
        .edit-mode { background-color: #fff7ed; }
        .original-reference { font-size: 11px; color: #6b7280; background: #f9fafb; padding: 4px 8px; border-radius: 3px; margin-bottom: 8px; }
    </style>
</head>
<body class="bg-gray-100 p-4">
    <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold mb-6">שיחת WhatsApp - Final Test</h1>
        <div class="space-y-2">
`;

        for (const [index, msg] of messages.entries()) {
            const hasAudio = msg.audioFile || msg.originalAudio;
            const messageClass = hasAudio ? 'audio-transcription' : '';
            
            html += `
            <div class="message mb-4 p-3 rounded-lg bg-gray-50">
                <div class="text-sm text-gray-600 mb-1">${msg.timestamp} - ${msg.sender}</div>
`;

            // For audio messages, show the transcription and original reference
            if (hasAudio) {
                // Show original file reference
                html += `                <div class="original-reference">📎 קובץ מקורי: ${msg.audioFile || 'לא זמין'}</div>`;
                
                // Show transcribed text (what the user sees)
                html += `                <div id="text-${index}" class="message-text ${messageClass}">${msg.text.replace(/\n/g, '<br>')}</div>`;
                
                // Add audio controls if file exists
                if (msg.originalAudio) {
                    const audioFilePath = join(__dirname, 'sample', msg.audioFile);
                    const base64Data = fileToBase64(audioFilePath);
                    
                    if (base64Data) {
                        html += `
                <div class="mt-2">
                    <audio controls class="w-full max-w-sm h-8">
                        <source src="data:audio/opus;base64,${base64Data}" type="audio/opus">
                        Your browser does not support audio playback
                    </audio>
                </div>`;
                    }
                }
                
                // Add edit button and cost info
                html += `
                <div class="mt-2 flex items-center gap-2">
                    <button onclick="editMessage(${index})" 
                            class="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">
                        ערוך תמלול
                    </button>`;
                
                if (msg.transcriptionCost) {
                    html += `                    <span class="text-xs text-green-600">עלות: $${msg.transcriptionCost.toFixed(4)}</span>`;
                }
                
                html += `
                </div>`;
            } else {
                // Regular text message
                html += `                <div id="text-${index}" class="message-text">${msg.text.replace(/\n/g, '<br>')}</div>`;
            }
            
            html += `            </div>`;
        }
        
        html += `
        </div>
        <div class="mt-6 pt-4 border-t text-sm text-gray-500">
            <p>נוצר על ידי WhatsApp Chat Converter</p>
            <p>עלות תמלול כוללת: $${totalCost.toFixed(2)}</p>
            <p><strong>🎯 זה מה שהמשתמש יראה עם תמלולים אמיתיים!</strong></p>
        </div>
    </div>
    
    <script>
        function editMessage(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const originalText = textDiv.textContent;
            textDiv.innerHTML = \`
                <textarea id="edit-\${msgIndex}" class="w-full p-2 border rounded" rows="3">\${originalText}</textarea>
                <div class="mt-2">
                    <button onclick="saveMessage(\${msgIndex}, '\${originalText.replace(/'/g, "\\'")}' )" 
                            class="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded mr-2">
                        שמור
                    </button>
                    <button onclick="cancelEdit(\${msgIndex}, '\${originalText.replace(/'/g, "\\'")}' )" 
                            class="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded">
                        בטל
                    </button>
                </div>
            \`;
            textDiv.classList.add('edit-mode');
        }
        
        function saveMessage(msgIndex, originalText) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const newText = document.getElementById('edit-' + msgIndex).value;
            textDiv.innerHTML = newText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
            
            // Show save confirmation
            const confirmation = document.createElement('div');
            confirmation.className = 'text-green-600 text-xs mt-1';
            confirmation.textContent = '✅ שינויים נשמרו';
            textDiv.appendChild(confirmation);
            setTimeout(() => confirmation.remove(), 2000);
        }
        
        function cancelEdit(msgIndex, originalText) {
            const textDiv = document.getElementById('text-' + msgIndex);
            textDiv.innerHTML = originalText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
        }
    </script>
</body>
</html>`;

        return html;
    }

    // Run the complete test
    console.log('📝 Step 1: Loading and parsing chat...');
    const sampleDir = join(__dirname, 'sample');
    const chatPath = join(sampleDir, '_chat.txt');
    const chatContent = readFileSync(chatPath, 'utf8');
    const messages = parseChatContent(chatContent);
    
    console.log(`✅ Parsed ${messages.length} messages`);
    
    console.log('\n📂 Step 2: Loading available audio files...');
    const { readdirSync } = await import('fs');
    const files = readdirSync(sampleDir);
    const audioFileNames = files.filter(f => f.includes('AUDIO') && f.endsWith('.opus'));
    
    const availableFiles = new Map();
    audioFileNames.forEach(filename => {
        const filePath = join(sampleDir, filename);
        availableFiles.set(filename, filePath);
    });
    
    console.log(`✅ Available audio files: ${availableFiles.size}`);
    audioFileNames.forEach(name => console.log(`   - ${name}`));
    
    console.log('\n🎵 Step 3: Simulating audio processing with transcriptions...');
    const processedMessages = simulateAudioProcessing(messages, availableFiles);
    
    // Calculate stats
    const audioMessages = processedMessages.filter(m => m.audioFile);
    const transcribedMessages = processedMessages.filter(m => m.transcriptionCost);
    const totalCost = transcribedMessages.reduce((sum, m) => sum + (m.transcriptionCost || 0), 0);
    
    console.log(`✅ Audio messages: ${audioMessages.length}`);
    console.log(`✅ Successfully transcribed: ${transcribedMessages.length}`);
    console.log(`✅ Total cost: $${totalCost.toFixed(4)}`);
    
    console.log('\n📄 Step 4: Generating final HTML as user would see...');
    const finalHTML = await generateFinalHTML(processedMessages, totalCost);
    
    const outputPath = join(__dirname, 'final-workflow-test.html');
    writeFileSync(outputPath, finalHTML);
    
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`✅ HTML size: ${(finalHTML.length / 1024).toFixed(1)} KB`);
    
    // Show examples of what user sees
    console.log('\n📋 Step 5: What the user sees:');
    transcribedMessages.forEach((msg, i) => {
        if (i < 2) { // Show first 2 examples
            console.log(`\n   📻 Audio Message ${i + 1}:`);
            console.log(`      Original: ${msg.audioFile}`);
            console.log(`      Transcription: "${msg.text.substring(0, 50)}..."`);
            console.log(`      Cost: $${msg.transcriptionCost.toFixed(4)}`);
            console.log(`      Has audio player: ${msg.originalAudio ? 'Yes' : 'No'}`);
        }
    });
    
    console.log(`\n✅ FINAL RESULT:`);
    console.log(`   🎵 ${audioMessages.length} audio messages detected`);
    console.log(`   📝 ${transcribedMessages.length} successfully transcribed`);
    console.log(`   ▶️ ${transcribedMessages.length} audio players embedded`);
    console.log(`   ✏️ ${audioMessages.length} edit buttons available`);
    console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`\n📂 Open ${outputPath} to see the final user experience!`);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}