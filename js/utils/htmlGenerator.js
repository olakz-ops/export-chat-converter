export async function generateHTMLOutput(messages, totalCost) {
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #ffffff;
            min-height: 100vh;
        }
        .message-text { 
            word-wrap: break-word; 
            line-height: 1.6;
            font-size: 15px;
        }
        
        /* Enhanced message block styling */
        .message-block { 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .message-block:hover { 
            transform: translateY(-2px) scale(1.01); 
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        
        /* Text message styling */
        .text-message {
            background: #ffffff;
            border: 1px solid #e5e7eb;
        }
        
        /* Second speaker text message styling */
        .text-message.speaker-2 {
            background: #f0fdf4;
            border: 1px solid #e5e7eb;
        }
        
        /* Audio message styling */
        .audio-message {
            background: #ffffff;
            border: 1px solid #e5e7eb;
        }
        
        /* Second speaker audio message styling */
        .audio-message.speaker-2 {
            background: #f0fdf4;
            border: 1px solid #e5e7eb;
        }
        
        /* Edit mode styling */
        .edit-mode { 
            background: linear-gradient(145deg, rgba(251,146,60,0.1) 0%, rgba(245,101,101,0.1) 100%);
            border: 2px solid #f59e0b; 
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(251,146,60,0.3);
        }
        
        /* Edit button states */
        .edit-btn {
            transition: all 0.2s ease;
            font-weight: 500;
            letter-spacing: 0.3px;
        }
        .edit-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        /* Message header improvements */
        .message-header {
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        
        /* Badge improvements */
        .message-badge {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
            padding: 4px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Merge indicator */
        .merge-indicator { 
            border-left: 4px solid #10b981;
            box-shadow: 0 0 15px rgba(16,185,129,0.3);
        }
        
        /* Audio player improvements */
        audio {
            outline: none;
            border-radius: 8px;
            width: 100%;
        }
        
        /* Container improvements */
        .chat-container {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        /* Header improvements */
        .chat-header {
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }
        
        /* Button improvements */
        .action-btn {
            background: linear-gradient(145deg, var(--btn-from), var(--btn-to));
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            font-weight: 600;
        }
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }
        
        /* Merge mode styling */
        .merge-mode .message-block {
            cursor: pointer;
            border: 2px dashed rgba(16,185,129,0.4);
            transition: all 0.2s ease;
        }
        .merge-mode .message-block:hover {
            border-color: #10b981;
            background: linear-gradient(145deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1));
            box-shadow: 0 8px 16px rgba(16,185,129,0.2);
        }
        .merge-mode .message-block.selected {
            border-color: #10b981;
            background: linear-gradient(145deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15));
            box-shadow: 0 0 20px rgba(16,185,129,0.4);
        }
        
        /* Textarea improvements */
        .edit-textarea {
            background: rgba(255,255,255,0.95);
            border: 2px solid rgba(251,146,60,0.3);
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
        }
        .edit-textarea:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 20px rgba(251,146,60,0.3);
            outline: none;
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-5xl mx-auto chat-container rounded-2xl p-8">
        <div class="chat-header flex items-center justify-between mb-8 p-6 rounded-xl">
            <h1 class="text-3xl font-bold text-gray-800">💬 שיחת WhatsApp</h1>
            <div class="flex gap-3">
                <button id="mergeBtn" onclick="toggleMergeMode()" 
                        class="action-btn text-white px-6 py-3 rounded-xl text-sm font-medium"
                        style="--btn-from: #3b82f6; --btn-to: #1d4ed8;">
                    🔗 מצב מיזוג הודעות
                </button>
                <button id="confirmMergeBtn" onclick="confirmMerge()" style="display: none;"
                        class="action-btn text-white px-6 py-3 rounded-xl text-sm font-medium"
                        style="--btn-from: #10b981; --btn-to: #059669;">
                    ✅ בצע מיזוג
                </button>
                <button id="cancelMergeBtn" onclick="cancelMergeMode()" style="display: none;"
                        class="action-btn text-white px-6 py-3 rounded-xl text-sm font-medium"
                        style="--btn-from: #6b7280; --btn-to: #4b5563;">
                    ❌ בטל
                </button>
            </div>
        </div>
        
        <div id="mergeInstructions" class="mb-6 p-4 rounded-xl border border-blue-300 hidden"
             style="background: linear-gradient(145deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1)); backdrop-filter: blur(10px);">
            <p class="text-sm text-blue-900 font-medium">
                💡 <strong>מצב מיזוג הודעות:</strong> לחץ על הודעות מאותו דובר כדי לסמן אותן למיזוג. ההודעות המסומנות יתמזגו להודעה אחת.
            </p>
        </div>
        
        <div id="messagesContainer" class="space-y-6">
            ${await generateMessagesHTML(messages)}
        </div>
        
        <div class="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
            <p class="font-medium">✨ נוצר על ידי WhatsApp Chat Converter</p>
            <p class="mt-1">עלות תמלול כוללת: <span class="font-semibold">${totalCost.toFixed(4)}$</span></p>
        </div>
    </div>
    
    <script>
        let mergeMode = false;
        let selectedMessages = new Set();
        
        function editMessage(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            
            // Check if already in edit mode
            if (textDiv.classList.contains('edit-mode')) {
                // Save the changes
                saveMessage(msgIndex);
                return;
            }
            
            const originalText = textDiv.textContent || textDiv.innerText;
            
            // Store original text for cancel functionality
            textDiv.dataset.originalText = originalText;
            
            // Update button to "Save" state
            editButton.innerHTML = '💾 שמור';
            editButton.style.background = 'linear-gradient(145deg, #10b981, #059669)';
            
            textDiv.innerHTML = \`
                <textarea id="edit-\${msgIndex}" class="edit-textarea w-full p-4 resize-none" rows="4" placeholder="ערוך את הטקסט כאן...">\${originalText}</textarea>
                <div class="mt-3 flex gap-2">
                    <button onclick="cancelEdit(\${msgIndex})" 
                            class="action-btn text-white px-4 py-2 rounded-lg text-sm font-medium"
                            style="--btn-from: #6b7280; --btn-to: #4b5563;">
                        🚫 בטל
                    </button>
                </div>
            \`;
            textDiv.classList.add('edit-mode');
            document.getElementById('edit-' + msgIndex).focus();
        }
        
        function saveMessage(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            const newText = document.getElementById('edit-' + msgIndex).value;
            
            // Update text content
            textDiv.innerHTML = newText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
            
            // Reset button to "Edit" state
            editButton.innerHTML = '✏️ ערוך טקסט';
            editButton.style.background = 'linear-gradient(145deg, #f59e0b, #d97706)';
        }
        
        function cancelEdit(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            
            // Get original text from data attribute
            const originalText = textDiv.dataset.originalText;
            textDiv.innerHTML = originalText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
            
            // Reset button to "Edit" state
            editButton.innerHTML = '✏️ ערוך טקסט';
            editButton.style.background = 'linear-gradient(145deg, #f59e0b, #d97706)';
        }
        
        function toggleMergeMode() {
            mergeMode = !mergeMode;
            const container = document.getElementById('messagesContainer');
            const instructions = document.getElementById('mergeInstructions');
            const mergeBtn = document.getElementById('mergeBtn');
            const confirmBtn = document.getElementById('confirmMergeBtn');
            const cancelBtn = document.getElementById('cancelMergeBtn');
            
            if (mergeMode) {
                container.classList.add('merge-mode');
                instructions.classList.remove('hidden');
                mergeBtn.innerHTML = '🔗 מצב מיזוג פעיל';
                mergeBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
                mergeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                confirmBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
            } else {
                cancelMergeMode();
            }
        }
        
        function cancelMergeMode() {
            mergeMode = false;
            selectedMessages.clear();
            const container = document.getElementById('messagesContainer');
            const instructions = document.getElementById('mergeInstructions');
            const mergeBtn = document.getElementById('mergeBtn');
            const confirmBtn = document.getElementById('confirmMergeBtn');
            const cancelBtn = document.getElementById('cancelMergeBtn');
            
            container.classList.remove('merge-mode');
            instructions.classList.add('hidden');
            mergeBtn.innerHTML = '🔗 מצב מיזוג הודעות';
            mergeBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
            mergeBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Remove selection from all messages
            document.querySelectorAll('.message-block').forEach(block => {
                block.classList.remove('selected');
            });
        }
        
        function selectMessageForMerge(msgIndex) {
            if (!mergeMode) return;
            
            const messageBlock = document.getElementById('message-' + msgIndex);
            const sender = messageBlock.dataset.sender;
            
            if (selectedMessages.has(msgIndex)) {
                selectedMessages.delete(msgIndex);
                messageBlock.classList.remove('selected');
            } else {
                // Check if this sender matches other selected messages
                const selectedArray = Array.from(selectedMessages);
                if (selectedArray.length > 0) {
                    const firstSelected = document.getElementById('message-' + selectedArray[0]);
                    if (firstSelected.dataset.sender !== sender) {
                        alert('ניתן לבחור רק הודעות מאותו דובר למיזוג');
                        return;
                    }
                }
                
                selectedMessages.add(msgIndex);
                messageBlock.classList.add('selected');
            }
        }
        
        function confirmMerge() {
            if (selectedMessages.size < 2) {
                alert('יש לבחור לפחות 2 הודעות למיזוג');
                return;
            }
            
            const selectedArray = Array.from(selectedMessages).sort((a, b) => a - b);
            const firstMessage = document.getElementById('message-' + selectedArray[0]);
            const firstTextDiv = document.getElementById('text-' + selectedArray[0]);
            
            // Collect all text content
            let mergedText = firstTextDiv.innerHTML;
            
            for (let i = 1; i < selectedArray.length; i++) {
                const msgIndex = selectedArray[i];
                const textDiv = document.getElementById('text-' + msgIndex);
                mergedText += '<br><br>' + textDiv.innerHTML;
                
                // Remove the message block
                const messageBlock = document.getElementById('message-' + msgIndex);
                messageBlock.remove();
            }
            
            // Update the first message with merged content
            firstTextDiv.innerHTML = mergedText;
            firstMessage.classList.add('merge-indicator');
            
            // Add merge indicator
            const header = firstMessage.querySelector('.message-header');
            if (header && !header.querySelector('.merge-badge')) {
                const mergeBadge = document.createElement('span');
                mergeBadge.className = 'merge-badge text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2';
                mergeBadge.innerHTML = '🔗 מוזג';
                header.appendChild(mergeBadge);
            }
            
            cancelMergeMode();
        }
    </script>
</body>
</html>`;
    
    return html;
}

async function generateMessagesHTML(messages) {
    // Track speakers to assign colors
    const speakers = [...new Set(messages.map(msg => msg.sender))];
    
    const messageElements = await Promise.all(messages.map(async (msg, index) => {
        const hasAudio = msg.audioFile || msg.audioFiles || msg.originalAudio;
        const speakerClass = speakers.indexOf(msg.sender) === 1 ? 'speaker-2' : '';
        
        
        // Check if this is an audio filename message (even without actual audio file)
        const isAudioFilename = msg.text.includes('.opus') && msg.text.includes('<מצורף:');
        
        if (hasAudio) {
            // Audio message block with actual audio file
            const audioData = await generateAudioData(msg);
            return `
                <div id="message-${index}" class="message-block audio-message ${speakerClass} p-6 rounded-2xl shadow-lg" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="message-header flex items-center justify-between mb-4">
                        <div class="text-sm font-semibold text-gray-800">${msg.timestamp} - ${msg.sender}</div>
                        <div class="flex items-center gap-3">
                            ${msg.transcriptionCost > 0 ? `<span class="message-badge bg-emerald-100 text-emerald-800 rounded-full">$${msg.transcriptionCost.toFixed(4)}</span>` : ''}
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="edit-btn text-white px-4 py-2 rounded-xl text-xs"
                                    style="background: linear-gradient(145deg, #f59e0b, #d97706);">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    
                    <!-- Audio Player Section -->
                    <div class="bg-white bg-opacity-90 rounded-xl p-4 mb-4 shadow-inner">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-gray-700">🎵 הודעה קולית</span>
                        </div>
                        ${audioData}
                    </div>
                    
                    <!-- Transcription Section -->
                    <div class="bg-white bg-opacity-90 rounded-xl p-4 shadow-inner">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-gray-700">📝 תמלול</span>
                        </div>
                        <div id="text-${index}" class="message-text text-gray-800">${formatMessageText(msg.text)}</div>
                    </div>
                </div>
            `;
        } else if (isAudioFilename) {
            // Audio filename message block (without actual audio file)
            return `
                <div id="message-${index}" class="message-block audio-message ${speakerClass} p-6 rounded-2xl shadow-lg" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="message-header flex items-center justify-between mb-4">
                        <div class="text-sm font-semibold text-gray-800">${msg.timestamp} - ${msg.sender}</div>
                        <div class="flex items-center gap-3">
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="edit-btn text-white px-4 py-2 rounded-xl text-xs"
                                    style="background: linear-gradient(145deg, #f59e0b, #d97706);">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    
                    <!-- Audio Filename Section -->
                    <div class="bg-white bg-opacity-90 rounded-xl p-4 shadow-inner">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-gray-700">🎵 קובץ אודיו</span>
                        </div>
                        <div id="text-${index}" class="message-text text-gray-800">${formatMessageText(msg.text)}</div>
                    </div>
                </div>
            `;
        } else {
            // Regular text message block
            return `
                <div id="message-${index}" class="message-block text-message ${speakerClass} p-6 rounded-2xl shadow-lg" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="message-header flex items-center justify-between mb-4">
                        <div class="text-sm font-semibold text-gray-800">${msg.timestamp} - ${msg.sender}</div>
                        <div class="flex items-center gap-3">
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="edit-btn text-white px-4 py-2 rounded-xl text-xs"
                                    style="background: linear-gradient(145deg, #3b82f6, #1d4ed8);">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    <div id="text-${index}" class="message-text text-gray-800">${formatMessageText(msg.text)}</div>
                </div>
            `;
        }
    }));
    
    return messageElements.filter(element => element.trim() !== '').join('');
}

async function generateAudioData(message) {
    if (!message.originalAudio) {
        return `
            <div class="text-center text-gray-500 py-4">
                <span class="text-sm">🎵 קובץ אודיו: ${message.audioFile || 'לא זמין'}</span>
            </div>
        `;
    }
    
    try {
        const audioData = await fileToBase64(message.originalAudio);
        // Fix: Use OGG format for browser compatibility instead of OPUS
        const mimeType = 'audio/ogg'; // Change from audio/opus to audio/ogg
        const audioSrc = `data:${mimeType};base64,${audioData}`;
        
        return `
            <audio controls class="w-full h-10 bg-gray-100 rounded-lg shadow-inner" style="width: 100%;">
                <source src="${audioSrc}" type="${mimeType}">
                <source src="${audioSrc}" type="audio/webm">
                <source src="${audioSrc}" type="audio/wav">
                הדפדפן שלך לא תומך בהשמעת אודיו
            </audio>
            <div class="mt-2 text-xs text-gray-500 text-center">
                גודל קובץ: ${(message.originalAudio.size / 1024).toFixed(1)} KB
            </div>
        `;
    } catch (error) {
        console.warn('Failed to embed audio file:', error);
        return `
            <div class="text-center text-red-500 py-4 bg-red-50 rounded">
                <span class="text-sm">⚠️ שגיאה בהטמעת קובץ האודיו</span>
            </div>
        `;
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:type;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatMessageText(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;br&gt;/g, '<br>'); // Restore line breaks
}