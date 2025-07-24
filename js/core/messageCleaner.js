const SYSTEM_MESSAGE_PATTERNS = [
    'הודעה זו נמחקה',
    'הודעה זו לא נמסרה',
    'שיחה קולית שלא נענתה',
    'שיחת וידאו שלא נענתה',
    'הודעות ושיחות בצ\'אט זה מאובטחות',
    'הקש כדי לנסות שוב'
];

export function isSystemMessage(message) {
    return SYSTEM_MESSAGE_PATTERNS.some(pattern => 
        message.text.includes(pattern)
    );
}

export function cleanMessages(messages) {
    return messages.filter(message => !isSystemMessage(message));
}

export function removeEmptyMessages(messages) {
    return messages.filter(message => 
        message.text && message.text.trim().length > 0
    );
}

export function cleanAndFilterMessages(messages, options = {}) {
    let cleaned = messages;
    
    if (options.removeSystemMessages !== false) {
        cleaned = cleanMessages(cleaned);
    }
    
    if (options.removeEmpty !== false) {
        cleaned = removeEmptyMessages(cleaned);
    }
    
    return cleaned;
}