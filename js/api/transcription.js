const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const COST_PER_MINUTE = 0.006;

export async function transcribeAudio(audioFile, apiKey) {
    let fileToTranscribe = audioFile;
    
    // Convert OPUS files to MP3 for Whisper API compatibility
    if (audioFile.name.toLowerCase().endsWith('.opus')) {
        fileToTranscribe = await convertOpusToMp3(audioFile);
    }
    
    const formData = new FormData();
    formData.append('file', fileToTranscribe);
    formData.append('model', 'whisper-1');
    formData.append('language', 'he');
    
    const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const cost = calculateTranscriptionCost(audioFile);
    
    return {
        text: result.text,
        cost: cost
    };
}

async function convertOpusToMp3(opusFile) {
    // In browser environment, we need to use Web Audio API or send to a conversion service
    // For now, let's try sending the OPUS file as OGG format (which Whisper supports)
    
    // Create a new File object with OGG mimetype
    const oggFile = new File([await opusFile.arrayBuffer()], 
        opusFile.name.replace('.opus', '.ogg'), 
        { type: 'audio/ogg' });
    
    return oggFile;
}

function calculateTranscriptionCost(audioFile) {
    // Better estimation for OPUS files (WhatsApp uses OPUS encoding)
    // OPUS files are typically 16-32 kbps, we'll estimate 24 kbps average
    const estimatedBitsPerSecond = 24000; // 24 kbps
    const bytesPerSecond = estimatedBitsPerSecond / 8;
    const audioDurationInSeconds = audioFile.size / bytesPerSecond;
    const audioDurationInMinutes = audioDurationInSeconds / 60;
    
    // Whisper charges $0.006 per minute, minimum billing is per second
    return Math.max(0.0001, audioDurationInMinutes * COST_PER_MINUTE); // Minimum 0.01 cents
}

export async function transcribeMultipleAudios(audioFiles, apiKey, onProgress) {
    const results = [];
    const total = audioFiles.length;
    let completed = 0;
    
    // Process in batches of 5
    const batchSize = 5;
    for (let i = 0; i < audioFiles.length; i += batchSize) {
        const batch = audioFiles.slice(i, i + batchSize);
        const batchPromises = batch.map(async ({ file, index }) => {
            try {
                const result = await transcribeAudio(file, apiKey);
                completed++;
                if (onProgress) {
                    onProgress(completed, total);
                }
                return { index, result };
            } catch (error) {
                completed++;
                if (onProgress) {
                    onProgress(completed, total);
                }
                return { index, error };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    return results;
}