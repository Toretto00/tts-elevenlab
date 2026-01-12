/**
 * Audio Processing Web Worker
 * Handles audio cleaning (normalization) and MP3 compression
 * Runs in a separate thread to prevent UI freezing
 */

// Import lamejs
importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

const TARGET_BITRATE = 128; // Initial target bitrate
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

/**
 * Normalize audio - boost quiet parts, reduce loud parts
 * This helps clean up the audio for better transcription
 */
function normalizeAudio(channelData, targetPeak = 0.95) {
    // Find the current peak
    let maxVal = 0;
    for (let i = 0; i < channelData.length; i++) {
        const abs = Math.abs(channelData[i]);
        if (abs > maxVal) maxVal = abs;
    }
    
    if (maxVal === 0) return channelData;
    
    // Calculate normalization factor
    const factor = targetPeak / maxVal;
    
    // Apply normalization
    const normalized = new Float32Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
        normalized[i] = Math.max(-1, Math.min(1, channelData[i] * factor));
    }
    
    return normalized;
}

/**
 * Simple noise gate - reduce very quiet sections (likely noise)
 */
function applyNoiseGate(channelData, threshold = 0.01) {
    const gated = new Float32Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) < threshold) {
            gated[i] = channelData[i] * 0.1; // Reduce noise floor
        } else {
            gated[i] = channelData[i];
        }
    }
    return gated;
}

/**
 * Convert Float32 samples to Int16 for MP3 encoding
 */
function floatTo16BitPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

/**
 * Encode audio to MP3
 */
function encodeToMp3(leftChannel, rightChannel, sampleRate, bitrate) {
    const channels = rightChannel ? 2 : 1;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
    const mp3Data = [];
    
    const leftSamples = floatTo16BitPCM(leftChannel);
    const rightSamples = rightChannel ? floatTo16BitPCM(rightChannel) : null;
    
    const sampleBlockSize = 1152;
    const totalBlocks = Math.ceil(leftSamples.length / sampleBlockSize);
    
    for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
        const blockIndex = Math.floor(i / sampleBlockSize);
        
        // Report progress every 10%
        if (blockIndex % Math.floor(totalBlocks / 10) === 0) {
            const progress = Math.round((blockIndex / totalBlocks) * 100);
            self.postMessage({ type: 'progress', stage: 'encoding', progress });
        }
        
        const leftChunk = leftSamples.subarray(i, Math.min(i + sampleBlockSize, leftSamples.length));
        const rightChunk = rightSamples ? rightSamples.subarray(i, Math.min(i + sampleBlockSize, rightSamples.length)) : null;
        
        let mp3buf;
        if (channels === 1) {
            mp3buf = mp3encoder.encodeBuffer(leftChunk);
        } else {
            mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        }
        
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    
    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
    
    // Combine all chunks
    const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buf of mp3Data) {
        result.set(buf, offset);
        offset += buf.length;
    }
    
    return result;
}

/**
 * Process audio: clean and compress
 */
function processAudio(audioData) {
    const { leftChannel, rightChannel, sampleRate, originalSize } = audioData;
    
    self.postMessage({ type: 'progress', stage: 'cleaning', progress: 0 });
    
    // Step 1: Clean audio (normalize + noise gate)
    const cleanedLeft = normalizeAudio(applyNoiseGate(new Float32Array(leftChannel)));
    const cleanedRight = rightChannel ? normalizeAudio(applyNoiseGate(new Float32Array(rightChannel))) : null;
    
    self.postMessage({ type: 'progress', stage: 'cleaning', progress: 100 });
    
    // Step 2: Encode to MP3
    // Start with higher bitrate if file is small, lower if large
    let bitrate = originalSize > 100 * 1024 * 1024 ? 64 : TARGET_BITRATE;
    let compressedData;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
        self.postMessage({ type: 'status', message: `Compressing at ${bitrate}kbps...` });
        self.postMessage({ type: 'progress', stage: 'encoding', progress: 0 });
        
        compressedData = encodeToMp3(cleanedLeft, cleanedRight, sampleRate, bitrate);
        
        if (compressedData.length <= MAX_FILE_SIZE) {
            break;
        }
        
        // Reduce bitrate for next attempt
        bitrate = Math.max(32, Math.floor(bitrate * 0.6));
        attempts++;
    }
    
    if (compressedData.length > MAX_FILE_SIZE) {
        self.postMessage({ 
            type: 'error', 
            message: `Unable to compress audio below 300MB. Current size: ${(compressedData.length / 1024 / 1024).toFixed(2)}MB. Please use a shorter audio file.`
        });
        return;
    }
    
    self.postMessage({ 
        type: 'complete', 
        data: compressedData.buffer,
        size: compressedData.length,
        bitrate: bitrate
    }, [compressedData.buffer]);
}

// Handle messages from main thread
self.onmessage = function(e) {
    const { type, audioData } = e.data;
    
    if (type === 'process') {
        try {
            processAudio(audioData);
        } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};
