// Teleprompter App with Speech Recognition
class TeleprompterApp {
    constructor() {
        // Constants
        this.SCROLL_SPEED_MULTIPLIERS = {
            slow: 0.7,
            medium: 1.0,
            fast: 1.3
        };
        this.MIN_MATCH_COUNT = 2;
        this.INSTRUCTION_DELAY_MS = 500;

        // Elements
        this.setupScreen = document.getElementById('setupScreen');
        this.prompterScreen = document.getElementById('prompterScreen');
        this.scriptInput = document.getElementById('scriptInput');
        this.fileInput = document.getElementById('fileInput');
        this.startButton = document.getElementById('startButton');
        this.prompterText = document.getElementById('prompterText');
        this.toggleSpeechButton = document.getElementById('toggleSpeechButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.exitButton = document.getElementById('exitButton');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.fontSizeSelect = document.getElementById('fontSize');
        this.scrollSpeedSelect = document.getElementById('scrollSpeed');
        this.modal = document.getElementById('infoModal');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalCloseButton = document.getElementById('modalCloseButton');

        // State
        this.isListening = false;
        this.isPaused = false;
        this.currentScript = '';
        this.recognition = null;
        this.currentWordIndex = 0;
        this.scriptWords = [];
        this.scrollSpeed = 'medium';
        this.fontSize = 42;

        // Speech recognition configuration
        this.initSpeechRecognition();
        this.initEventListeners();
        this.initTabs();
    }

    initSpeechRecognition() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showModal('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.updateStatus('Listening...', true);
        };

        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Continue listening
                return;
            }
            this.updateStatus(`Error: ${event.error}`, false);
            this.isListening = false;
            this.updateSpeechButton();
        };

        this.recognition.onend = () => {
            if (this.isListening && !this.isPaused) {
                // Restart recognition if it ends unexpectedly
                try {
                    this.recognition.start();
                } catch (e) {
                    console.error('Failed to restart recognition:', e);
                }
            } else {
                this.updateStatus('Ready', false);
            }
        };
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Settings
        this.fontSizeSelect.addEventListener('change', (e) => {
            this.fontSize = parseInt(e.target.value);
            this.updateFontSize();
        });

        this.scrollSpeedSelect.addEventListener('change', (e) => {
            this.scrollSpeed = e.target.value;
        });

        // Start teleprompter
        this.startButton.addEventListener('click', () => this.startTeleprompter());

        // Teleprompter controls
        this.toggleSpeechButton.addEventListener('click', () => this.toggleSpeech());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.exitButton.addEventListener('click', () => this.exitTeleprompter());

        // Modal
        this.modalCloseButton.addEventListener('click', () => this.hideModal());

        // Prevent accidental exit
        window.addEventListener('beforeunload', (e) => {
            if (this.isListening) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Handle screen wake lock for mobile
        this.requestWakeLock();
    }

    initTabs() {
        // Initialize tab system
        this.currentTab = 'write';
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        document.getElementById('writeTab').classList.toggle('active', tabName === 'write');
        document.getElementById('uploadTab').classList.toggle('active', tabName === 'upload');

        this.currentTab = tabName;
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.scriptInput.value = e.target.result;
            this.switchTab('write');
            this.showModal('File uploaded successfully!');
        };
        reader.onerror = () => {
            this.showModal('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    }

    startTeleprompter() {
        this.currentScript = this.scriptInput.value.trim();

        if (!this.currentScript) {
            this.showModal('Please enter or upload a script first.');
            return;
        }

        // Prepare script
        this.scriptWords = this.currentScript.split(/\s+/);
        this.currentWordIndex = 0;

        // Set up prompter display
        this.prompterText.textContent = this.currentScript;
        this.updateFontSize();

        // Switch to prompter screen
        this.setupScreen.classList.remove('active');
        this.prompterScreen.classList.add('active');

        // Try to enter fullscreen on mobile
        this.requestFullscreen();

        // Show instructions
        setTimeout(() => {
            this.showModal('Tap "Start Voice" to begin speech recognition. The teleprompter will scroll as you speak.');
        }, this.INSTRUCTION_DELAY_MS);
    }

    toggleSpeech() {
        if (this.isListening) {
            this.stopSpeech();
        } else {
            this.startSpeech();
        }
    }

    startSpeech() {
        if (!this.recognition) {
            this.showModal('Speech recognition is not available in this browser.');
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.isPaused = false;
            this.updateSpeechButton();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            this.showModal('Failed to start speech recognition. Please try again.');
        }
    }

    stopSpeech() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.updateSpeechButton();
        this.updateStatus('Ready', false);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseButton.querySelector('.btn-label').textContent = 'Resume';
            this.pauseButton.querySelector('.btn-icon').textContent = '▶️';
            if (this.isListening) {
                this.recognition.stop();
                this.updateStatus('Paused', false);
            }
        } else {
            this.pauseButton.querySelector('.btn-label').textContent = 'Pause';
            this.pauseButton.querySelector('.btn-icon').textContent = '⏸️';
            if (this.isListening) {
                this.recognition.start();
            }
        }
    }

    exitTeleprompter() {
        if (this.isListening) {
            this.stopSpeech();
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }

        // Return to setup screen
        this.prompterScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        this.currentWordIndex = 0;
    }

    handleSpeechResult(event) {
        if (this.isPaused) return;

        const results = event.results;
        let transcript = '';

        // Get the latest transcript
        for (let i = event.resultIndex; i < results.length; i++) {
            transcript += results[i][0].transcript;
        }

        // Update status with what was heard
        if (transcript.trim()) {
            this.updateStatus(`Heard: "${transcript.trim()}"`, true);
            
            // Process transcript for scrolling
            this.processTranscript(transcript);
        }
    }

    processTranscript(transcript) {
        // Normalize transcript
        const spokenWords = transcript.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0);

        if (spokenWords.length === 0) return;

        // Find matching words in script
        let bestMatch = this.findBestMatch(spokenWords);
        
        if (bestMatch !== -1 && bestMatch > this.currentWordIndex) {
            this.currentWordIndex = bestMatch;
            this.scrollToPosition(bestMatch);
        }
    }

    findBestMatch(spokenWords) {
        // Normalize script words for comparison
        const normalizedScriptWords = this.scriptWords.map(word => 
            word.toLowerCase().replace(/[^\w]/g, '')
        );

        let bestMatchIndex = -1;
        let maxMatchCount = 0;

        // Look for sequences of matching words
        for (let i = this.currentWordIndex; i < normalizedScriptWords.length; i++) {
            let matchCount = 0;
            
            for (let j = 0; j < spokenWords.length && (i + j) < normalizedScriptWords.length; j++) {
                if (normalizedScriptWords[i + j].includes(spokenWords[j]) || 
                    spokenWords[j].includes(normalizedScriptWords[i + j])) {
                    matchCount++;
                }
            }

            if (matchCount > maxMatchCount && matchCount >= Math.min(this.MIN_MATCH_COUNT, spokenWords.length)) {
                maxMatchCount = matchCount;
                bestMatchIndex = i;
            }
        }

        return bestMatchIndex;
    }

    scrollToPosition(wordIndex) {
        // Calculate approximate character position
        let charPosition = 0;
        for (let i = 0; i < wordIndex && i < this.scriptWords.length; i++) {
            charPosition += this.scriptWords[i].length + 1; // +1 for space
        }

        // Estimate scroll position based on character position
        const totalChars = this.currentScript.length;
        const scrollRatio = charPosition / totalChars;
        
        const container = this.prompterScreen.querySelector('.prompter-container');
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        // Apply speed multiplier
        const speedMultiplier = this.SCROLL_SPEED_MULTIPLIERS[this.scrollSpeed] || this.SCROLL_SPEED_MULTIPLIERS.medium;

        const targetScroll = maxScroll * scrollRatio * speedMultiplier;
        
        // Smooth scroll
        container.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }

    updateSpeechButton() {
        const icon = this.toggleSpeechButton.querySelector('.btn-icon');
        const label = this.toggleSpeechButton.querySelector('.btn-label');
        
        if (this.isListening) {
            icon.textContent = '🔴';
            label.textContent = 'Stop Voice';
            this.toggleSpeechButton.classList.add('listening');
        } else {
            icon.textContent = '🎤';
            label.textContent = 'Start Voice';
            this.toggleSpeechButton.classList.remove('listening');
        }
    }

    updateStatus(text, listening) {
        const statusText = this.statusIndicator.querySelector('.status-text');
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        
        statusText.textContent = text;
        
        if (listening) {
            statusDot.classList.add('listening');
        } else {
            statusDot.classList.remove('listening');
        }
    }

    updateFontSize() {
        this.prompterText.style.fontSize = `${this.fontSize}px`;
    }

    showModal(message) {
        this.modalMessage.textContent = message;
        this.modal.classList.add('active');
    }

    hideModal() {
        this.modal.classList.remove('active');
    }

    requestFullscreen() {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log('Fullscreen request failed:', err));
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    async requestWakeLock() {
        // Keep screen awake during teleprompter use
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock acquired');
            } catch (err) {
                console.log('Wake lock request failed:', err);
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeleprompterApp();
});
