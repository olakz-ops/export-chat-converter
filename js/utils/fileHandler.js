export async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export function organizeFiles(files) {
    let chatFile = null;
    const mediaFiles = new Map();
    
    for (const file of files) {
        if (file.name.includes('_chat.txt')) {
            chatFile = file;
        } else {
            mediaFiles.set(file.name, file);
        }
    }
    
    return { chatFile, mediaFiles };
}

export function validateFiles(chatFile, mediaFiles) {
    if (!chatFile) {
        throw new Error('לא נמצא קובץ _chat.txt');
    }
    
    return true;
}

export function createFileURL(file) {
    return URL.createObjectURL(file);
}

export function revokeFileURL(url) {
    URL.revokeObjectURL(url);
}

export function downloadFile(content, filename, mimeType = 'text/html;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = createFileURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    revokeFileURL(url);
}