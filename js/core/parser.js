const MESSAGE_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$/;
const AUDIO_ATTACHMENT_REGEX = /‏<מצורף: (.*?\.(opus|mp3))>/;
const MEDIA_OMITTED_REGEX = /<Media omitted>/i;

export function parseMessage(line) {
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

export function parseChatContent(content) {
    const lines = content.split('\n');
    const messages = [];
    let currentMessage = null;
    
    for (const line of lines) {
        // Remove Windows line endings (\r) that can interfere with parsing
        const cleanLine = line.replace(/\r$/, '');
        const message = parseMessage(cleanLine);
        if (message) {
            // New message found
            if (currentMessage) {
                messages.push(currentMessage);
            }
            currentMessage = message;
        } else if (currentMessage && cleanLine.trim()) {
            // Check if this line is a standalone audio attachment
            const audioMatch = cleanLine.trim().match(AUDIO_ATTACHMENT_REGEX);
            if (audioMatch) {
                // This is a standalone audio message - treat as separate message
                // First, save the current message
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                // Create a new message for the audio
                currentMessage = {
                    timestamp: currentMessage.timestamp, // Same timestamp as previous
                    sender: currentMessage.sender, // Same sender
                    text: cleanLine.trim(),
                    originalLine: cleanLine
                };
            } else {
                // Normal continuation of previous message
                currentMessage.text += '\n' + cleanLine.trim();
            }
        }
    }
    
    // Don't forget the last message
    if (currentMessage) {
        messages.push(currentMessage);
    }
    
    return messages;
}

export function detectAudioAttachment(message) {
    // Check for direct attachment reference (Hebrew format)
    const hebrewMatch = message.text.match(AUDIO_ATTACHMENT_REGEX);
    if (hebrewMatch) {
        return {
            filename: hebrewMatch[1],
            extension: hebrewMatch[2]
        };
    }
    
    // Check for "<Media omitted>" pattern (English export)
    if (MEDIA_OMITTED_REGEX.test(message.text)) {
        return {
            filename: null, // Will be matched by sequence
            extension: 'opus',
            isMediaOmitted: true
        };
    }
    
    return null;
}

export function isMediaOmittedMessage(message) {
    return MEDIA_OMITTED_REGEX.test(message.text);
}

