// DOM Elements
const audioInput = document.getElementById('audioInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileList = document.getElementById('fileList');
const transcribeBtn = document.getElementById('transcribeBtn');
const processingStatus = document.getElementById('processingStatus');
const statusText = document.getElementById('statusText');
const resultsContainer = document.getElementById('resultsContainer');
const errorMessage = document.getElementById('errorMessage');

// Constants
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB in bytes
const MAX_FILES = 10;
const API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const HCAPTCHA_TOKEN = 'P1_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.haJwZACjZXhwzmljlsmncGFzc2tlecUFW0L0R7J4AYWDzaFP71alm-ZaldPltSsh3dnENQtPsKG_q3WSZLSl6Su3p_Ct55BFJiVr8j6C2NpK2Eywqyj_yxpXIPxfg5MT3aVsYEjtEzjgQ-XB38o37jErqM96Q1yiu28bcBdVmSx29eKQaIJ8TLZRuegZKrJ9jkYRqCIip2_FeEnYBU35eYZ-6DHzJpoZ1TggNjg-aWt9OLQjf_VM9o3_uLGlMgBArIgAU_0dOvZTSClfSr9WcGUIYZvy2-zN31GrYETM6XQoGJe2geiw-6iS8r8nQBRxw3xTvDbbc6eHMb061nrEEoWAuWmIhJqw0pTvzqrpA5o2EvOnzRUuzSXZRrgMgNVfoqXlfwMciI-TBzMudpwst4AIBFloOVqLvAY9XckEdgJwSlYEBY6Ln--iu4L-JT0oxV5tjjIRT59VUx6J2ajoeAyQrmqc_JaDEOBxB0fgWCSFsU-OhZFPp5CLocznH1XzQ-b4FxwdJM3U3Ez33rX4h5QaY7P10wgu8Jl7IuoorQc1TLd4fhimoxlq_B1F-XN4WUuwYqyAbh9l4cvXcjBDqWcgM612dHBX8zYM19EUHxWCgLmgENq_N4UVXVMSYR6LRNikTEWKtdA-lODFfNGJ_GpvxGhssCEg0rnYNY9bl2x4knoVdvKLOFfgtM06GaiaRBytoGMpxv9j9RQXzuzeJ5rqdbjRygTXwDtz8lumtFprONiDaKgTMHt6ECwhI_zUDNldHHXT-e74S75c2N7jINNfmtZ-FIKiNBbBkBus38ZYEZE5LRVxKI2k_oT_MnKDz4yb2ftMxN9PX_yOTF9JRASqw_lwBaeVEqC6BjrW-rgELwVGBUD8YLiDDgFzc4YmYys7ZwBZtGhHRkEbWER-xvgS2eqOfwYajDHWMbbn7BRu47Cgpe6M2Sr285E82c1OpKtXpK5okWRHIFlAqNsraZZzZyhQt8RiyCVsnXw0kEZsyD9c0JKFeQDkfgnLn1rvpgdQdFsa3Q_-7S6DPKL45mdRj5lF7znsnvoJzF0WZIqn20zephqwAs7Q6hP12y0C9UFIrSNp-_RzDsDj8BTxJY_LVINgNDgyP0JdNUP4_IR-S-C26_wzfvFfKJ5pb8lgKDkIx9Vy7s1-86GulNyy54V0DNbamCDbX4mBPlUQUMQfD2EPzkE27Yx3e3XAEPWsU2h38cDJJZx34G-YBGoIpyWSvhNBWyaq8m0A7mscnA5OZqK4X-X06wVsSvo77C5UQqeM3dELlhYvlgdF33MA9u4ReMC_3D3ekXJ0202V9r_OhH0vPd_yPRwkCMy9le9QbTqZDLev5LUdDB_d5EcIqvK8aLMuBTsyh0mDGQ6d7b4X4jlmGc-9JmavZ8KDM_rZDV8urTavfFxpSbA3y3Uh31us-vpUGxVHsgdKBJKdzoy63D96Kv1087m34-SqapJGftBtToh_aK74OROv1lIkd8wUItY-YzUomcjUyG3l-1Bk3TAPuyCT_uouawVFe1RvXVNVJQtB2PNfbuSCVV9bY33UVYxWwAC9CNrvqCXh-sa3EcbP_gyJvhZ1dFZle7Qbqu7ODtiDNa23A1cAbwaA-pGLkr4nRWoOT4u6mOt1g1pTu3e0JcDoPKRYWPNU2UO3InHmjA0wAIm_tyXgtvcZCV8iKYOZZRaQxC_Z-RCWLZYDxe-OVmeEl0zNjiWE-3p1x8yyyb1jjmpvcBD6c5Ht6QkIEaHAbAfOsKYFYm1m6nL2Z4X3VWvkgsy4m8Lcd367Q4667IjWHqMT1GvpKQMm8-4F3fW9UEp8XVpWmjK8_Xip9ZjHfYCBsNVTVnKCIa7BHmYhQqJrcqgyYTgyNjA4MKhzaGFyZF9pZM4VmeRU.oN-NWKEm5RKricG0ok2pW5im6pCMZK1Cu577xnp8uUU';

// State
let selectedFiles = [];
let transcriptionResults = {}; // { fileId: { text, words, fileName } }
let audioWorker = null;

// Event Listeners
uploadBtn.addEventListener('click', () => {
    audioInput.click();
});

audioInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        addFiles(files);
        hideError();
    }
});

transcribeBtn.addEventListener('click', () => {
    if (selectedFiles.length > 0) {
        processAllFiles();
    }
});

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function addFiles(files) {
    // Limit total files
    const remainingSlots = MAX_FILES - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
        showError(`Maximum ${MAX_FILES} files allowed. Only ${remainingSlots} files were added.`);
    }
    
    filesToAdd.forEach(file => {
        const fileId = generateFileId();
        selectedFiles.push({ id: fileId, file: file });
    });
    
    renderFileList();
    updateTranscribeButton();
}

function removeFile(fileId) {
    selectedFiles = selectedFiles.filter(f => f.id !== fileId);
    renderFileList();
    updateTranscribeButton();
    
    // Also remove from results if exists
    if (transcriptionResults[fileId]) {
        delete transcriptionResults[fileId];
        renderResults();
    }
}

function renderFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.add('hidden');
        fileList.innerHTML = '';
        return;
    }
    
    fileList.classList.remove('hidden');
    fileList.innerHTML = selectedFiles.map(({ id, file }) => `
        <div class="file-item" data-file-id="${id}">
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
            </svg>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="btn-remove" onclick="removeFile('${id}')" title="Remove file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
}

function updateTranscribeButton() {
    if (selectedFiles.length > 0) {
        transcribeBtn.classList.remove('hidden');
        transcribeBtn.textContent = `Transcribe ${selectedFiles.length === 1 ? 'Audio' : `All (${selectedFiles.length})`}`;
    } else {
        transcribeBtn.classList.add('hidden');
    }
}

function showProcessing(message) {
    statusText.textContent = message;
    processingStatus.classList.remove('hidden');
    transcribeBtn.classList.add('hidden');
}

function hideProcessing() {
    processingStatus.classList.add('hidden');
    updateTranscribeButton();
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
}

// Speaker colors
const speakerColors = {
    'speaker_0': 'hsl(220, 80%, 55%)',
    'speaker_1': 'hsl(340, 75%, 55%)',
    'speaker_2': 'hsl(160, 70%, 40%)',
    'speaker_3': 'hsl(30, 85%, 50%)',
    'speaker_4': 'hsl(270, 70%, 55%)',
    'speaker_5': 'hsl(190, 80%, 45%)',
};

function getColor(speakerId) {
    return speakerColors[speakerId] || 'hsl(0, 0%, 50%)';
}

/**
 * Format transcription with speaker diarization
 */
function formatTranscriptionWithSpeakers(words) {
    if (!words || !Array.isArray(words) || words.length === 0) {
        return null;
    }
    
    const container = document.createDocumentFragment();
    let currentSpeaker = null;
    let currentParagraph = null;
    let currentText = '';
    
    const finishParagraph = () => {
        if (currentParagraph && currentText.trim()) {
            const textSpan = document.createElement('span');
            textSpan.className = 'speaker-text';
            textSpan.textContent = currentText.trim();
            currentParagraph.appendChild(textSpan);
            container.appendChild(currentParagraph);
        }
        currentText = '';
    };
    
    words.forEach((word) => {
        const speakerId = word.speaker_id || 'unknown';
        
        if (word.type === 'spacing') {
            currentText += word.text;
            return;
        }
        
        if (speakerId !== currentSpeaker) {
            finishParagraph();
            
            currentSpeaker = speakerId;
            currentParagraph = document.createElement('div');
            currentParagraph.className = 'speaker-block';
            
            const speakerLabel = document.createElement('span');
            speakerLabel.className = 'speaker-label';
            speakerLabel.textContent = speakerId.replace('_', ' ').toUpperCase();
            speakerLabel.style.backgroundColor = getColor(speakerId);
            currentParagraph.appendChild(speakerLabel);
        }
        
        currentText += word.text;
    });
    
    finishParagraph();
    return container;
}

/**
 * Render all results as collapsible items
 */
function renderResults() {
    const fileIds = Object.keys(transcriptionResults);
    
    if (fileIds.length === 0) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
    }
    
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    
    fileIds.forEach(fileId => {
        const result = transcriptionResults[fileId];
        const resultItem = createResultItem(fileId, result);
        resultsContainer.appendChild(resultItem);
    });
}

function createResultItem(fileId, result) {
    const item = document.createElement('div');
    item.className = 'result-item expanded';
    item.setAttribute('data-file-id', fileId);
    
    const statusClass = result.error ? 'error' : 'success';
    const statusText = result.error ? 'Error' : 'Done';
    
    item.innerHTML = `
        <div class="result-item-header" onclick="toggleResultItem('${fileId}')">
            <svg class="result-item-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="result-item-title">${result.fileName}</span>
            <span class="result-item-status ${statusClass}">${statusText}</span>
        </div>
        <div class="result-item-content">
            <div class="result-item-actions">
                <div class="dropdown">
                    <button class="btn-action" onclick="toggleDropdown(event, '${fileId}')" title="Download">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <div class="dropdown-menu hidden" id="dropdown-${fileId}">
                        <button class="dropdown-item" onclick="downloadAsTxt('${fileId}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            Download as TXT
                        </button>
                        <button class="dropdown-item" onclick="downloadAsDocx('${fileId}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            Download as DOCX
                        </button>
                    </div>
                </div>
                <button class="btn-action" onclick="copyToClipboard('${fileId}')" title="Copy to clipboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
            <div class="result-text" id="result-text-${fileId}"></div>
        </div>
    `;
    
    // Render text content
    const textContainer = item.querySelector(`#result-text-${fileId}`);
    if (result.error) {
        textContainer.textContent = result.error;
        textContainer.style.color = 'hsl(var(--destructive))';
    } else if (result.words && result.words.length > 0) {
        const formattedContent = formatTranscriptionWithSpeakers(result.words);
        if (formattedContent) {
            textContainer.appendChild(formattedContent);
        } else {
            textContainer.textContent = result.text;
        }
    } else {
        textContainer.textContent = result.text;
    }
    
    return item;
}

function toggleResultItem(fileId) {
    const item = document.querySelector(`.result-item[data-file-id="${fileId}"]`);
    if (item) {
        item.classList.toggle('expanded');
    }
}

function toggleDropdown(event, fileId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`dropdown-${fileId}`);
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `dropdown-${fileId}`) {
            menu.classList.add('hidden');
        }
    });
    
    dropdown.classList.toggle('hidden');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

async function copyToClipboard(fileId) {
    const result = transcriptionResults[fileId];
    if (!result || !result.text) return;
    
    try {
        await navigator.clipboard.writeText(result.text);
        // Visual feedback could be added here
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

/**
 * Format transcription as plain text with speaker labels
 */
function formatAsPlainText(words, fallbackText) {
    if (!words || words.length === 0) {
        return fallbackText;
    }
    
    let result = '';
    let currentSpeaker = null;
    let currentText = '';
    
    words.forEach((word) => {
        const speakerId = word.speaker_id || 'unknown';
        
        if (word.type === 'spacing') {
            currentText += word.text;
            return;
        }
        
        if (speakerId !== currentSpeaker) {
            if (currentSpeaker !== null && currentText.trim()) {
                result += currentText.trim() + '\n\n';
            }
            currentSpeaker = speakerId;
            const speakerLabel = speakerId.replace('_', ' ').toUpperCase();
            result += `[${speakerLabel}]\n`;
            currentText = '';
        }
        
        currentText += word.text;
    });
    
    if (currentText.trim()) {
        result += currentText.trim();
    }
    
    return result;
}

function downloadAsTxt(fileId) {
    const result = transcriptionResults[fileId];
    if (!result) return;
    
    document.getElementById(`dropdown-${fileId}`).classList.add('hidden');
    
    const textContent = formatAsPlainText(result.words, result.text);
    if (!textContent) return;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const baseName = result.fileName.replace(/\.[^/.]+$/, '');
    downloadBlob(blob, `${baseName}_transcription.txt`);
}

async function downloadAsDocx(fileId) {
    const result = transcriptionResults[fileId];
    if (!result) return;
    
    document.getElementById(`dropdown-${fileId}`).classList.add('hidden');
    
    const baseName = result.fileName.replace(/\.[^/.]+$/, '');
    
    if (!result.words || result.words.length === 0) {
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: [
                    new docx.Paragraph({
                        children: [new docx.TextRun({ text: result.text || '' })]
                    })
                ]
            }]
        });
        
        const blob = await docx.Packer.toBlob(doc);
        downloadBlob(blob, `${baseName}_transcription.docx`);
        return;
    }
    
    const speakerHighlights = {
        'speaker_0': 'cyan',
        'speaker_1': 'magenta',
        'speaker_2': 'green',
        'speaker_3': 'yellow',
        'speaker_4': 'red',
        'speaker_5': 'darkBlue',
    };
    
    const getHighlight = (speakerId) => {
        return speakerHighlights[speakerId] || 'lightGray';
    };
    
    const paragraphs = [];
    let currentSpeaker = null;
    let currentText = '';
    
    const addParagraph = () => {
        if (currentSpeaker !== null && currentText.trim()) {
            const speakerLabel = currentSpeaker.replace('_', ' ').toUpperCase();
            
            paragraphs.push(
                new docx.Paragraph({
                    spacing: { before: 200, after: 100 },
                    children: [
                        new docx.TextRun({
                            text: speakerLabel,
                            bold: true,
                            highlight: getHighlight(currentSpeaker),
                            size: 22
                        })
                    ]
                })
            );
            
            paragraphs.push(
                new docx.Paragraph({
                    spacing: { after: 200 },
                    children: [
                        new docx.TextRun({
                            text: currentText.trim(),
                            size: 24
                        })
                    ]
                })
            );
        }
        currentText = '';
    };
    
    result.words.forEach((word) => {
        const speakerId = word.speaker_id || 'unknown';
        
        if (word.type === 'spacing') {
            currentText += word.text;
            return;
        }
        
        if (speakerId !== currentSpeaker) {
            addParagraph();
            currentSpeaker = speakerId;
        }
        
        currentText += word.text;
    });
    
    addParagraph();
    
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });
    
    const blob = await docx.Packer.toBlob(doc);
    downloadBlob(blob, `${baseName}_transcription.docx`);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Decode audio file to get raw audio data
 */
async function decodeAudioFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        await audioContext.close();
        return audioBuffer;
    } catch (error) {
        await audioContext.close();
        throw new Error('Failed to decode audio file.');
    }
}

/**
 * Process audio using Web Worker (clean + compress)
 */
function processAudioInWorker(audioBuffer, originalSize) {
    return new Promise((resolve, reject) => {
        audioWorker = new Worker('audio-worker.js');
        
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
        
        audioWorker.onmessage = function(e) {
            const { type, data, message } = e.data;
            
            switch (type) {
                case 'complete':
                    audioWorker.terminate();
                    audioWorker = null;
                    const mp3Blob = new Blob([new Uint8Array(data)], { type: 'audio/mpeg' });
                    const mp3File = new File([mp3Blob], 'processed_audio.mp3', { type: 'audio/mpeg' });
                    resolve(mp3File);
                    break;
                    
                case 'error':
                    audioWorker.terminate();
                    audioWorker = null;
                    reject(new Error(message));
                    break;
            }
        };
        
        audioWorker.onerror = function(error) {
            audioWorker.terminate();
            audioWorker = null;
            reject(new Error('Audio processing failed: ' + error.message));
        };
        
        const leftCopy = new Float32Array(leftChannel);
        const rightCopy = rightChannel ? new Float32Array(rightChannel) : null;
        
        const transferList = [leftCopy.buffer];
        if (rightCopy) transferList.push(rightCopy.buffer);
        
        audioWorker.postMessage({
            type: 'process',
            audioData: {
                leftChannel: leftCopy.buffer,
                rightChannel: rightCopy ? rightCopy.buffer : null,
                sampleRate: audioBuffer.sampleRate,
                originalSize: originalSize
            }
        }, transferList);
    });
}

/**
 * Call ElevenLabs Speech-to-Text API
 */
async function callTranscriptionAPI(audioFile) {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model_id', 'scribe_v2');
    formData.append('tag_audio_events', 'true');
    formData.append('diarize', 'true');
    
    const url = `${API_URL}?allow_unauthenticated=1&hcaptcha_token=${encodeURIComponent(HCAPTCHA_TOKEN)}`;
    
    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || errorData.message || `API Error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Process a single file
 */
async function processSingleFile(fileId, file) {
    let audioToSend = file;
    
    try {
        // Decode and process audio
        const audioBuffer = await decodeAudioFile(file);
        audioToSend = await processAudioInWorker(audioBuffer, file.size);
        
        // Call transcription API
        const result = await callTranscriptionAPI(audioToSend);
        
        if (!result || !result.text || result.text.trim() === '') {
            throw new Error('No transcription available.');
        }
        
        transcriptionResults[fileId] = {
            fileName: file.name,
            text: result.text,
            words: result.words || null
        };
        
    } catch (error) {
        transcriptionResults[fileId] = {
            fileName: file.name,
            text: '',
            words: null,
            error: error.message || 'Failed to transcribe.'
        };
    }
}

/**
 * Process all selected files
 */
async function processAllFiles() {
    hideError();
    transcriptionResults = {};
    
    const totalFiles = selectedFiles.length;
    
    for (let i = 0; i < totalFiles; i++) {
        const { id, file } = selectedFiles[i];
        showProcessing(`Processing file ${i + 1} of ${totalFiles}: ${file.name}`);
        
        await processSingleFile(id, file);
        renderResults();
    }
    
    hideProcessing();
    
    // Clear selected files after processing
    selectedFiles = [];
    renderFileList();
    updateTranscribeButton();
    audioInput.value = '';
}
