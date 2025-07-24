export function mergeConsecutiveMessages(messages) {
    if (messages.length === 0) return [];
    
    const merged = [];
    let currentGroup = createMessageGroup(messages[0]);
    
    for (let i = 1; i < messages.length; i++) {
        const message = messages[i];
        
        if (shouldMergeWithCurrent(currentGroup, message)) {
            mergeMessageIntoGroup(currentGroup, message);
        } else {
            merged.push(currentGroup);
            currentGroup = createMessageGroup(message);
        }
    }
    
    // Don't forget the last group
    merged.push(currentGroup);
    
    return merged;
}

function createMessageGroup(message) {
    const group = { ...message };
    
    if (message.audioFile) {
        group.audioFiles = [{
            file: message.audioFile,
            cost: message.transcriptionCost,
            original: message.originalAudio
        }];
        delete group.audioFile;
        delete group.transcriptionCost;
        delete group.originalAudio;
    }
    
    return group;
}

function shouldMergeWithCurrent(currentGroup, message) {
    return currentGroup.sender === message.sender;
}

function mergeMessageIntoGroup(group, message) {
    group.text += '\n' + message.text;
    
    if (message.audioFile) {
        if (!group.audioFiles) {
            group.audioFiles = [];
        }
        group.audioFiles.push({
            file: message.audioFile,
            cost: message.transcriptionCost,
            original: message.originalAudio
        });
    }
    
    // Update timestamp to the latest message
    group.timestamp = message.timestamp;
}