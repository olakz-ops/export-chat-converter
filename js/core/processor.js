import { detectAudioAttachment } from './parser.js?v=12';
import { transcribeMultipleAudios } from '../api/transcription.js?v=12';

export async function processAudioMessages(messages, mediaFiles, apiKey, onProgress) {
    const audioTasks = [];
    
    console.log('Processing audio messages...');
    console.log('Available media files:', Array.from(mediaFiles.keys()));
    
    // First pass: attach audio files to messages and collect transcription tasks
    const messagesWithAudio = messages.map((message, index) => {
        const audioInfo = detectAudioAttachment(message);
        if (audioInfo && audioInfo.filename) {
            console.log(`Message ${index}: Found audio reference "${audioInfo.filename}"`);
            
            // Check if we have this exact file
            if (mediaFiles.has(audioInfo.filename)) {
                console.log(`✅ Matched: ${audioInfo.filename}`);
                const audioFile = mediaFiles.get(audioInfo.filename);
                
                audioTasks.push({
                    index,
                    file: audioFile,
                    filename: audioInfo.filename
                });
                
                // Attach audio file to message for display
                return {
                    ...message,
                    audioFile: audioInfo.filename,
                    originalAudio: audioFile
                };
            } else {
                console.log(`❌ Missing: ${audioInfo.filename}`);
            }
        }
        
        return message;
    });
    
    console.log(`Found ${audioTasks.length} audio tasks from ${messages.length} messages`);
    
    if (audioTasks.length === 0) {
        console.log('No audio files to transcribe');
        return messagesWithAudio;
    }
    
    // Transcribe all audio files
    const transcriptionResults = await transcribeMultipleAudios(
        audioTasks.map(task => ({ file: task.file, index: task.index })),
        apiKey,
        onProgress
    );
    
    // Create a map of results by index
    const resultMap = new Map();
    transcriptionResults.forEach(result => {
        resultMap.set(result.index, result);
    });
    
    // Update messages with transcriptions
    const processedMessages = messagesWithAudio.map((message, index) => {
        const result = resultMap.get(index);
        if (!result) return message;
        
        const task = audioTasks.find(t => t.index === index);
        
        if (result.error) {
            return {
                ...message,
                text: `[שגיאה בתמלול: ${task.filename}]`,
                transcriptionError: result.error.message
            };
        }
        
        return {
            ...message,
            text: result.result.text,
            audioFile: task.filename,
            transcriptionCost: result.result.cost,
            originalAudio: task.file
        };
    });
    
    return processedMessages;
}

