import { createFileURL } from '../utils/fileHandler.js';

export class UIController {
    constructor() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            processBtn: document.getElementById('processBtn'),
            statusSection: document.getElementById('statusSection'),
            statusLog: document.getElementById('statusLog'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            previewSection: document.getElementById('previewSection'),
            chatPreview: document.getElementById('chatPreview'),
            totalCost: document.getElementById('totalCost'),
            downloadBtn: document.getElementById('downloadBtn')
        };
    }

    getFiles() {
        return this.elements.fileInput.files;
    }

    getApiKey() {
        return null; // API key now comes from config
    }

    getOptions() {
        return {
            // Removed message cleaning and merging options
        };
    }

    showStatus() {
        this.elements.statusSection.classList.remove('hidden');
    }

    hideStatus() {
        this.elements.statusSection.classList.add('hidden');
    }

    showPreview() {
        this.elements.previewSection.classList.remove('hidden');
    }

    hidePreview() {
        this.elements.previewSection.classList.add('hidden');
    }

    updateStatus(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.className = type === 'error' ? 'text-red-600' : 'text-gray-700';
        statusDiv.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        this.elements.statusLog.appendChild(statusDiv);
        this.elements.statusLog.scrollTop = this.elements.statusLog.scrollHeight;
    }

    updateProgress(percent) {
        this.elements.progressBar.style.width = `${percent}%`;
        this.elements.progressText.textContent = `${Math.round(percent)}%`;
    }

    updateTotalCost(cost) {
        this.elements.totalCost.textContent = `$${cost.toFixed(2)}`;
    }

    displayMessages(messages) {
        this.elements.chatPreview.innerHTML = '';
        
        messages.forEach((msg, index) => {
            const messageDiv = this.createMessageElement(msg, index);
            this.elements.chatPreview.appendChild(messageDiv);
        });
    }

    createMessageElement(message, index) {
        const div = document.createElement('div');
        div.className = 'mb-4 p-3 rounded-lg bg-gray-50';
        
        const audioControls = this.createAudioControls(message, index);
        
        div.innerHTML = `
            <div class="text-sm text-gray-600 mb-1">${message.timestamp} - ${message.sender}</div>
            <div id="message-text-${index}" class="message-bubble">${message.text.replace(/\n/g, '<br>')}</div>
            ${audioControls}
        `;
        
        return div;
    }

    createAudioControls(message, messageIndex) {
        // Show audio controls for any message with audio attachment detected
        if (!message.audioFile && !message.audioFiles && !message.originalAudio) return '';
        
        const audioFiles = message.audioFiles || [{
            file: message.audioFile,
            cost: message.transcriptionCost || 0,
            original: message.originalAudio
        }];
        
        return audioFiles.map((audio, audioIndex) => {
            // Only show audio player if we have the original file
            if (!audio.original) return '';
            
            const audioUrl = createFileURL(audio.original);
            const costDisplay = audio.cost > 0 ? `עלות: $${audio.cost.toFixed(4)}` : 'לא תומלל';
            
            return `
                <div class="mt-2 flex items-center gap-2">
                    <audio controls class="h-8" src="${audioUrl}"></audio>
                    <button onclick="window.editTranscription(${messageIndex}, ${audioIndex})" 
                            class="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">
                        ערוך
                    </button>
                    <span class="text-xs text-gray-500">${costDisplay}</span>
                </div>
            `;
        }).join('');
    }

    showEditMode(messageIndex, currentText) {
        const messageTextDiv = document.getElementById(`message-text-${messageIndex}`);
        messageTextDiv.innerHTML = `
            <textarea id="edit-${messageIndex}" class="w-full p-2 border rounded" rows="3">${currentText}</textarea>
            <div class="mt-2">
                <button onclick="window.saveEdit(${messageIndex})" 
                        class="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
                    שמור
                </button>
                <button onclick="window.cancelEdit(${messageIndex})" 
                        class="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded">
                    בטל
                </button>
            </div>
        `;
    }

    getEditedText(messageIndex) {
        return document.getElementById(`edit-${messageIndex}`).value;
    }

    clearStatus() {
        this.elements.statusLog.innerHTML = '';
        this.updateProgress(0);
    }

    disableProcessButton() {
        this.elements.processBtn.disabled = true;
        this.elements.processBtn.classList.add('opacity-50');
    }

    enableProcessButton() {
        this.elements.processBtn.disabled = false;
        this.elements.processBtn.classList.remove('opacity-50');
    }
}