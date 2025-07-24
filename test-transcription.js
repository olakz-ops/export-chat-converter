#!/usr/bin/env node

// Test transcription API directly
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './js/config.local.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node.js File class simulation for API testing
class NodeFile {
    constructor(buffer, name, type) {
        this.name = name;
        this.type = type;
        this.size = buffer.length;
        this._buffer = buffer;
    }

    async arrayBuffer() {
        return this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength);
    }

    async text() {
        return this._buffer.toString('utf-8');
    }

    stream() {
        return {
            getReader() {
                return {
                    read: () => Promise.resolve({ done: true, value: undefined })
                };
            }
        };
    }
}

// Simple FormData implementation for Node.js
class SimpleFormData {
    constructor() {
        this.fields = [];
    }
    
    append(name, value, filename) {
        this.fields.push({ name, value, filename });
    }
    
    toString() {
        return this.fields.map(f => `${f.name}=${f.filename || 'data'}`).join('&');
    }
}

// Mock fetch for Node.js with actual HTTP request
async function testTranscription() {
    console.log('🧪 Testing OpenAI Whisper API with real audio file...\n');
    
    try {
        // Load a real audio file
        const audioPath = join(__dirname, 'sample', '00000007-AUDIO-2025-06-11-12-24-05.opus');
        const audioBuffer = await readFile(audioPath);
        const audioFile = new NodeFile(audioBuffer, '00000007-AUDIO-2025-06-11-12-24-05.opus', 'audio/opus');
        
        console.log(`📁 Loaded audio file: ${audioFile.name}`);
        console.log(`📊 File size: ${(audioFile.size / 1024).toFixed(1)} KB`);
        console.log(`🔑 API Key: ${config.OPENAI_API_KEY ? config.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
        
        if (!config.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }
        
        // Test with curl instead of fetch to avoid Node.js complications
        console.log('\n🔄 Testing API call with curl...');
        
        // Save audio file temporarily for curl
        const tempPath = '/tmp/test-audio.opus';
        await import('fs/promises').then(fs => fs.writeFile(tempPath, audioBuffer));
        
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const curlCommand = `curl -X POST https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer ${config.OPENAI_API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@${tempPath}" \
  -F "model=whisper-1" \
  -F "language=he"`;
        
        console.log('📡 Making API request...');
        const { stdout, stderr } = await execAsync(curlCommand);
        
        if (stderr && !stderr.includes('100.0%')) {
            console.error('❌ API Error:', stderr);
            return;
        }
        
        const result = JSON.parse(stdout);
        console.log('\n✅ API Response Success!');
        console.log(`📝 Transcribed text: "${result.text}"`);
        
        // Calculate cost
        const estimatedDurationSeconds = audioFile.size / (24000 / 8); // 24kbps OPUS
        const estimatedCost = (estimatedDurationSeconds / 60) * 0.006;
        console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
        
        // Clean up
        await execAsync(`rm -f ${tempPath}`);
        
        console.log('\n🎉 Transcription API is working correctly!');
        console.log('The issue might be with FormData handling in the browser environment.');
        
    } catch (error) {
        console.error('❌ Transcription test failed:', error.message);
        if (error.message.includes('401')) {
            console.log('🔍 API key might be invalid or expired');
        } else if (error.message.includes('429')) {
            console.log('🔍 Rate limit exceeded - try again later');
        } else if (error.message.includes('network')) {
            console.log('🔍 Network connectivity issue');
        }
    }
}

testTranscription();