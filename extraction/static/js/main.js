// Description: Frontend JavaScript for handling form submission, API calls, and user feedback
// Manages the download process, error handling, and UI state updates across Instagram, TikTok, YouTube Shorts, and Facebook Reels

// Get DOM elements
const downloadForm = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');

// Results elements
const resultsSection = document.getElementById('resultsSection');
const resultThumbnail = document.getElementById('resultThumbnail');
const resultAudio = document.getElementById('resultAudio');
const resultDuration = document.getElementById('resultDuration');
const downloadLink = document.getElementById('downloadLink');
const resultPlatform = document.getElementById('resultPlatform');
const resultCategory = document.getElementById('resultCategory');
const resultSentiment = document.getElementById('resultSentiment');
const resultSummary = document.getElementById('resultSummary');
const resultTopics = document.getElementById('resultTopics');
const resultTranscript = document.getElementById('resultTranscript');

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Show success message
 */
function showSuccess() {
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    // Hide success message after 3 seconds
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
}

/**
 * Set loading state on button
 * @param {boolean} isLoading - Whether to show loading state
 */
function setLoading(isLoading) {
    if (isLoading) {
        downloadBtn.disabled = true;
        btnText.textContent = 'Processing...';
        btnLoader.classList.remove('hidden');
    } else {
        downloadBtn.disabled = false;
        btnText.textContent = 'Download Audio';
        btnLoader.classList.add('hidden');
    }
}

/**
 * Validate video URL client-side for supported platforms
 * Supports: Instagram Reels, TikTok, YouTube Shorts, Facebook Reels
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid video URL from supported platform
 */
function validateVideoUrl(url) {
    if (!url) {
        return false;
    }
    
    // Instagram Reel patterns
    const instagramPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|reels|p)\/[A-Za-z0-9_-]+/i;
    
    // TikTok patterns
    const tiktokPatterns = [
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
        /(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/[\w]+/i,
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/[\w]+/i,
    ];
    
    // YouTube Shorts patterns
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/i,
        /(?:https?:\/\/)?youtu\.be\/[\w-]+/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    ];

    // Facebook / Facebook Reels patterns
    const facebookPatterns = [
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/[\w.-]+/i,
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reels\/[\w.-]+/i,
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/\?v=\d+/i,
        /(?:https?:\/\/)?fb\.watch\/[\w-]+/i,
        /(?:https?:\/\/)?m\.facebook\.com\/story\.php/i,
    ];
    
    // Check Instagram
    if (instagramPattern.test(url)) {
        return true;
    }
    
    // Check TikTok
    for (const pattern of tiktokPatterns) {
        if (pattern.test(url)) {
            return true;
        }
    }
    
    // Check YouTube
    for (const pattern of youtubePatterns) {
        if (pattern.test(url)) {
            return true;
        }
    }

    // Check Facebook
    for (const pattern of facebookPatterns) {
        if (pattern.test(url)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Trigger file download from blob
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name for downloaded file
 */
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'instagram_reel_audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // Hide previous messages
    hideError();
    successMessage.classList.add('hidden');
    
    // Get URL from input
    const url = urlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError('Please enter a supported video URL');
        return;
    }
    
    if (!validateVideoUrl(url)) {
        showError('Please enter a valid URL from Instagram Reels, TikTok, YouTube Shorts, or Facebook Reels. Examples: https://www.instagram.com/reel/ABC123xyz/, https://www.tiktok.com/@user/video/1234567890, https://www.youtube.com/shorts/VIDEO_ID, https://www.facebook.com/reel/123456789/');
        return;
    }
    
    // Set loading state
    setLoading(true);
    
    // Hide results section when starting new download
    resultsSection.classList.add('hidden');
    
    try {
        // Step 1: Create Job
        const createResponse = await fetch('/jobs/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
        });
        
        if (!createResponse.ok) {
            throw await getErrorFromResponse(createResponse);
        }
        
        const jobData = await createResponse.json();
        const jobId = jobData.job_id;
        
        // Step 2: Poll for Status
        await pollJobStatus(jobId);
        
    } catch (error) {
        // Handle network errors
        console.error('Error:', error);
        showError(error.message || 'An error occurred. Please try again.');
        setLoading(false);
    }
}

/**
 * Helper to extract error message from response
 */
async function getErrorFromResponse(response) {
    let errorMessage = 'An error occurred';
    try {
        const errorData = await response.json();
        if (errorData.error) {
            errorMessage = errorData.error;
        }
    } catch (e) {
        errorMessage = `Error: ${response.statusText}`;
    }
    return new Error(errorMessage);
}

/**
 * Poll job status until completion or failure
 */
async function pollJobStatus(jobId) {
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 60; // 2 minutes timeout

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`/jobs/${jobId}/status`);
        if (!response.ok) {
            throw await getErrorFromResponse(response);
        }

        const data = await response.json();

        if (data.status) {
            const statusText = data.status.replace('_', ' ');
            btnText.textContent = `Processing: ${statusText}...`;
        }

        if (data.status === 'completed') {
            await displayJobResult(jobId);
            setLoading(false);
            showSuccess();
            return;
        }

        if (data.status === 'failed') {
            throw new Error(data.error_message || 'Processing failed');
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Processing timed out. Please try again.');
}

/**
 * Fetch and display final job results
 */
async function displayJobResult(jobId) {
    const response = await fetch(`/jobs/${jobId}/result`);
    if (!response.ok) {
        throw await getErrorFromResponse(response);
    }
    
    const data = await response.json();
    const result = data.result;
    
    // Populate UI with results
    
    // 1. Audio & Thumbnail
    if (result.thumbnail_url) {
        resultThumbnail.src = result.thumbnail_url;
    }
    
    if (result.audio_url) {
        resultAudio.src = result.audio_url;
        downloadLink.href = result.audio_url;
    }
    
    if (result.duration) {
        resultDuration.textContent = `${Math.round(result.duration)}s`;
    }
    
    // 2. Metadata
    // Try to get platform from server response
    const getDisplayPlatform = () => {
        const rawPlatform = (data.platform || result.platform || '').toLowerCase();
        const platformMap = {
            instagram: 'Instagram',
            tiktok: 'TikTok',
            youtube: 'YouTube Shorts',
            facebook: 'Facebook Reels',
        };
        return platformMap[rawPlatform] || 'Unknown';
    };
    resultPlatform.textContent = getDisplayPlatform();
    
    // 3. Analysis Data
    if (result.analysis) {
        resultCategory.textContent = result.analysis.category || 'Uncategorized';
        resultSentiment.textContent = result.analysis.sentiment || 'Neutral';
        resultSummary.textContent = result.analysis.summary || 'No summary available.';
        
        // Clear and populate topics
        resultTopics.innerHTML = '';
        const topics = result.analysis.topics || [];
        topics.forEach(topic => {
            const span = document.createElement('span');
            span.className = 'px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium';
            span.textContent = topic;
            resultTopics.appendChild(span);
        });
    }
    
    // 4. Transcript
    if (result.transcript) {
        resultTranscript.textContent = result.transcript.text || 'No transcript available.';
    }
    
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Attach form submit handler
downloadForm.addEventListener('submit', handleSubmit);

// Clear error when user starts typing
urlInput.addEventListener('input', () => {
    hideError();
    successMessage.classList.add('hidden');
});

