class AppState {
    constructor() {
        this.processedChat = null;
        this.mediaFiles = new Map();
        this.totalTranscriptionCost = 0;
        this.listeners = new Map();
    }

    reset() {
        this.processedChat = null;
        this.mediaFiles.clear();
        this.totalTranscriptionCost = 0;
        this.emit('state:reset');
    }

    setProcessedChat(messages) {
        this.processedChat = messages;
        this.emit('chat:processed', messages);
    }

    getProcessedChat() {
        return this.processedChat;
    }

    addMediaFile(filename, file) {
        this.mediaFiles.set(filename, file);
        this.emit('media:added', { filename, file });
    }

    getMediaFile(filename) {
        return this.mediaFiles.get(filename);
    }

    getAllMediaFiles() {
        return this.mediaFiles;
    }

    addTranscriptionCost(cost) {
        this.totalTranscriptionCost += cost;
        this.emit('cost:updated', this.totalTranscriptionCost);
    }

    getTotalCost() {
        return this.totalTranscriptionCost;
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => callback(data));
    }
}

export default new AppState();