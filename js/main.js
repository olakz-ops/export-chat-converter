import appState from './core/state.js?v=13';
import { UIController } from './ui/controller.js?v=13';
import { organizeFiles, validateFiles, readFileAsText, downloadFile } from './utils/fileHandler.js?v=13';
import { parseChatContent } from './core/parser.js?v=13';
import { processAudioMessages } from './core/processor.js?v=13';
// Removed message cleaning and merging imports
import { generateHTMLOutput } from './utils/htmlGenerator.js?v=13';

// Try to load config file
let config = null;
try {
    const module = await import('./config.local.js');
    config = module.config;
} catch (e) {
    // Config file not found, will use manual input
    console.log('No config.local.js found, API key will need to be entered manually');
}

class WhatsAppChatConverter {
    constructor() {
        this.ui = new UIController();
        this.config = config;
        this.initializeEventListeners();
        this.initializeStateListeners();
        this.initializeConfig();
    }

    initializeConfig() {
        // Removed message cleaning and merging config
    }

    initializeEventListeners() {
        this.ui.elements.processBtn.addEventListener('click', () => this.processFiles());
        this.ui.elements.downloadBtn.addEventListener('click', () => this.downloadHTML());
        
        // Make edit functions globally available for inline onclick handlers
        window.editTranscription = (messageIndex, audioIndex) => this.editTranscription(messageIndex, audioIndex);
        window.saveEdit = (messageIndex) => this.saveEdit(messageIndex);
        window.cancelEdit = (messageIndex) => this.refreshPreview();
    }

    initializeStateListeners() {
        appState.on('cost:updated', (totalCost) => {
            this.ui.updateTotalCost(totalCost);
        });
        
        appState.on('chat:processed', (messages) => {
            this.ui.displayMessages(messages);
        });
    }

    async processFiles() {
        try {
            this.ui.disableProcessButton();
            this.ui.clearStatus();
            this.ui.hidePreview();
            this.ui.showStatus();
            
            // Reset state
            appState.reset();
            
            // Get files and API key
            const files = this.ui.getFiles();
            const apiKey = this.config?.OPENAI_API_KEY;
            
            if (files.length === 0) {
                throw new Error('אנא בחר קבצים');
            }
            
            if (!apiKey) {
                throw new Error('לא נמצא API Key. אנא צור קובץ config.local.js עם המפתח שלך');
            }
            
            // Organize files
            this.ui.updateStatus('מארגן קבצים...');
            const { chatFile, mediaFiles } = organizeFiles(files);
            validateFiles(chatFile, mediaFiles);
            
            // Store media files in state
            mediaFiles.forEach((file, filename) => {
                appState.addMediaFile(filename, file);
            });
            
            // Read and parse chat file
            this.ui.updateStatus('קורא קובץ צ\'אט...');
            const chatContent = await readFileAsText(chatFile);
            const messages = parseChatContent(chatContent);
            this.ui.updateStatus(`נמצאו ${messages.length} הודעות`);
            
            // Process audio messages
            this.ui.updateStatus('מעבד הודעות אודיו...');
            const processedMessages = await processAudioMessages(
                messages,
                appState.getAllMediaFiles(),
                apiKey,
                (completed, total) => {
                    const percent = (completed / total) * 100;
                    console.log('Progress update:', completed, '/', total, '=', percent + '%');
                    this.ui.updateProgress(percent);
                    this.ui.updateStatus(`תמלול ${completed} מתוך ${total} קבצי אודיו`);
                }
            );
            console.log('Audio processing completed, messages:', processedMessages.length);
            
            // Calculate and update total cost
            let totalCost = 0;
            processedMessages.forEach(msg => {
                if (msg.transcriptionCost) {
                    totalCost += msg.transcriptionCost;
                    console.log('Adding transcription cost:', msg.transcriptionCost);
                }
            });
            
            console.log('Total cost calculated:', totalCost);
            appState.totalTranscriptionCost = totalCost;
            this.ui.updateTotalCost(totalCost);
            console.log('Total cost updated in UI');
            
            // No message cleaning or merging - use processed messages directly
            let finalMessages = processedMessages;
            
            // Update state and show preview
            appState.setProcessedChat(finalMessages);
            this.ui.updateStatus('עיבוד הושלם!');
            this.ui.showPreview();
            
        } catch (error) {
            console.error('Error processing files:', error);
            this.ui.updateStatus(`שגיאה: ${error.message}`, 'error');
        } finally {
            this.ui.enableProcessButton();
        }
    }

    editTranscription(messageIndex, audioIndex = 0) {
        const messages = appState.getProcessedChat();
        if (!messages || !messages[messageIndex]) return;
        
        const message = messages[messageIndex];
        this.ui.showEditMode(messageIndex, message.text);
    }

    saveEdit(messageIndex) {
        const messages = appState.getProcessedChat();
        if (!messages || !messages[messageIndex]) return;
        
        const newText = this.ui.getEditedText(messageIndex);
        messages[messageIndex].text = newText;
        appState.setProcessedChat(messages);
    }

    refreshPreview() {
        const messages = appState.getProcessedChat();
        if (messages) {
            this.ui.displayMessages(messages);
        }
    }

    async downloadHTML() {
        const messages = appState.getProcessedChat();
        if (!messages) return;
        
        this.ui.updateStatus('יוצר HTML עם קבצי אודיו מוטמעים...');
        try {
            const html = await generateHTMLOutput(messages, appState.getTotalCost());
            downloadFile(html, 'whatsapp-chat.html');
            this.ui.updateStatus('קובץ HTML נוצר בהצלחה!');
        } catch (error) {
            console.error('Error generating HTML:', error);
            this.ui.updateStatus(`שגיאה ביצירת HTML: ${error.message}`, 'error');
        }
    }
}

// Debug: Check if updated code is loaded
console.log('WhatsApp Chat Converter v13 - Fixed Windows line endings parser bug!');

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WhatsAppChatConverter();
    });
} else {
    new WhatsAppChatConverter();
}