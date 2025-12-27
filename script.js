// Teleprompter App with Speech Recognition
class TeleprompterApp {
    constructor() {
        // Constants
        this.SCROLL_SPEED_MULTIPLIERS = {
            slow: 0.7,
            medium: 1.0,
            fast: 1.3
        };
        this.MIN_MATCH_COUNT = 1;
        this.INSTRUCTION_DELAY_MS = 500;
        this.SEARCH_WINDOW_SIZE = 30; // Only look ahead this many words
        this.PROXIMITY_THRESHOLD = 5; // Prefer matches within this many words

        // Homophone and number mappings for better speech recognition
        this.HOMOPHONES = {
            '2': ['to', 'too', 'two'],
            '4': ['for', 'four'],
            '8': ['ate', 'eight'],
            'to': ['2', 'too', 'two'],
            'too': ['2', 'to', 'two'],
            'two': ['2', 'to', 'too'],
            'for': ['4', 'four'],
            'four': ['4', 'for'],
            'ate': ['8', 'eight'],
            'eight': ['8', 'ate'],
            'their': ['there', 'theyre'],
            'there': ['their', 'theyre'],
            'theyre': ['their', 'there'],
            'your': ['youre'],
            'youre': ['your'],
            'its': ['its'],
            'know': ['no'],
            'no': ['know'],
            'see': ['sea'],
            'sea': ['see'],
            'hear': ['here'],
            'here': ['hear']
        };

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
        this.rewindButton = document.getElementById('rewindButton');
        this.forwardButton = document.getElementById('forwardButton');
        this.resetButton = document.getElementById('resetButton');
        this.toggleCameraButton = document.getElementById('toggleCameraButton');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.fontSizeSelect = document.getElementById('fontSize');
        this.themeSelect = document.getElementById('themeSelect');
        this.scrollPositionSelect = document.getElementById('scrollPosition');
        this.mirrorModeCheckbox = document.getElementById('mirrorMode');
        this.speechSensitivitySelect = document.getElementById('speechSensitivity');
        this.countdownEnabledCheckbox = document.getElementById('countdownEnabled');
        this.savedScriptsSelect = document.getElementById('savedScripts');
        this.saveScriptButton = document.getElementById('saveScriptButton');
        this.deleteScriptButton = document.getElementById('deleteScriptButton');
        this.wordCountDisplay = document.getElementById('wordCount');
        this.readingTimeDisplay = document.getElementById('readingTime');
        this.progressBar = document.getElementById('progressBar');
        this.speedIndicator = document.getElementById('speedIndicator');
        this.progressText = document.getElementById('progressText');
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.countdownNumber = document.getElementById('countdownNumber');
        this.modal = document.getElementById('infoModal');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalCloseButton = document.getElementById('modalCloseButton');
        
        // Recording elements
        this.cameraSelect = document.getElementById('cameraSelect');
        this.videoQualitySelect = document.getElementById('videoQuality');
        this.cameraPositionSelect = document.getElementById('cameraPosition');
        this.mirrorCameraCheckbox = document.getElementById('mirrorCamera');
        this.hidePreviewCheckbox = document.getElementById('hidePreviewDuringRecording');
        this.cameraPreview = document.getElementById('cameraPreview');
        this.cameraVideo = document.getElementById('cameraVideo');
        this.startRecordingButton = document.getElementById('startRecordingButton');
        this.stopRecordingButton = document.getElementById('stopRecordingButton');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.recordingTimer = document.getElementById('recordingTimer');

        // State
        this.isListening = false;
        this.isPaused = false;
        this.currentScript = '';
        this.recognition = null;
        this.currentWordIndex = 0;
        this.scriptWords = [];
        this.fontSize = 42;
        this.lastTranscriptLength = 0;
        this.speechSensitivity = 1.0;
        this.scrollPosition = 'center';
        this.wordsSpoken = 0;
        this.startTime = null;
        this.wpmUpdateInterval = null;
        
        // Recording state
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.cameraStream = null;
        this.recordingStartTime = null;
        this.recordingTimerInterval = null;
        this.scriptWords = [];
        this.fontSize = 42;
        this.lastTranscriptLength = 0;
        this.speechSensitivity = 1.0;
        this.scrollPosition = 'center';
        this.wordsSpoken = 0;
        this.startTime = null;
        this.wpmUpdateInterval = null;

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
            if (event.error === 'not-allowed') {
                this.showModal('Microphone access denied. Please allow microphone permissions in your browser settings and reload the page.');
                this.isListening = false;
                this.updateSpeechButton();
                return;
            }
            if (event.error === 'aborted') {
                // User stopped recognition
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

        // Script input changes
        this.scriptInput.addEventListener('input', () => this.updateScriptInfo());

        // Settings
        this.fontSizeSelect.addEventListener('change', (e) => {
            this.fontSize = parseInt(e.target.value);
            this.updateFontSize();
        });

        this.themeSelect.addEventListener('change', (e) => this.applyTheme(e.target.value));
        this.scrollPositionSelect.addEventListener('change', (e) => this.scrollPosition = e.target.value);
        this.mirrorModeCheckbox.addEventListener('change', (e) => this.toggleMirrorMode(e.target.checked));
        this.speechSensitivitySelect.addEventListener('change', (e) => this.speechSensitivity = parseFloat(e.target.value));

        // Recording settings
        this.cameraSelect.addEventListener('change', (e) => this.switchCamera(e.target.value));
        this.cameraPositionSelect.addEventListener('change', (e) => this.updateCameraPosition(e.target.value));
        this.mirrorCameraCheckbox.addEventListener('change', (e) => this.toggleCameraMirror(e.target.checked));

        // Saved scripts
        this.savedScriptsSelect.addEventListener('change', (e) => this.loadSavedScript(e.target.value));
        this.saveScriptButton.addEventListener('click', () => this.saveScript());
        this.deleteScriptButton.addEventListener('click', () => this.deleteScript());

        // Start teleprompter
        this.startButton.addEventListener('click', () => this.startTeleprompter());

        // Teleprompter controls
        this.toggleSpeechButton.addEventListener('click', () => this.toggleSpeech());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.rewindButton.addEventListener('click', () => this.skipWords(-10));
        this.forwardButton.addEventListener('click', () => this.skipWords(10));
        this.resetButton.addEventListener('click', () => this.resetPosition());
        this.toggleCameraButton.addEventListener('click', () => this.toggleCameraPreview());
        this.exitButton.addEventListener('click', () => this.exitTeleprompter());
        
        // Recording controls
        this.startRecordingButton.addEventListener('click', () => this.startRecording());
        this.stopRecordingButton.addEventListener('click', () => this.stopRecording());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Modal
        this.modalCloseButton.addEventListener('click', () => this.hideModal());

        // Prevent accidental exit
        window.addEventListener('beforeunload', (e) => {
            if (this.isListening || this.isRecording) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Initialize
        this.loadSavedScriptsList();
        this.updateScriptInfo();
        this.applyTheme(this.themeSelect.value);
        this.initCamera();
    }

    initTabs() {        // Handle screen wake lock for mobile
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

    // Script Management Methods
    updateScriptInfo() {
        const text = this.scriptInput.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const minutes = Math.floor(words / 150); // Average reading speed
        const seconds = Math.round(((words / 150) - minutes) * 60);
        
        this.wordCountDisplay.textContent = `Words: ${words}`;
        this.readingTimeDisplay.textContent = `Est. Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    loadSavedScriptsList() {
        const scripts = JSON.parse(localStorage.getItem('savedScripts') || '{}');
        this.savedScriptsSelect.innerHTML = '<option value="">Load a saved script...</option>';
        
        Object.keys(scripts).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.savedScriptsSelect.appendChild(option);
        });
    }

    saveScript() {
        const text = this.scriptInput.value.trim();
        if (!text) {
            this.showModal('Please enter some text before saving.');
            return;
        }

        const name = prompt('Enter a name for this script:');
        if (!name) return;

        const scripts = JSON.parse(localStorage.getItem('savedScripts') || '{}');
        scripts[name] = text;
        localStorage.setItem('savedScripts', JSON.stringify(scripts));
        
        this.loadSavedScriptsList();
        this.showModal(`Script "${name}" saved successfully!`);
    }

    loadSavedScript(name) {
        if (!name) return;

        const scripts = JSON.parse(localStorage.getItem('savedScripts') || '{}');
        if (scripts[name]) {
            this.scriptInput.value = scripts[name];
            this.updateScriptInfo();
            this.switchTab('write');
        }
    }

    deleteScript() {
        const name = this.savedScriptsSelect.value;
        if (!name) {
            this.showModal('Please select a script to delete.');
            return;
        }

        if (!confirm(`Delete script "${name}"?`)) return;

        const scripts = JSON.parse(localStorage.getItem('savedScripts') || '{}');
        delete scripts[name];
        localStorage.setItem('savedScripts', JSON.stringify(scripts));
        
        this.loadSavedScriptsList();
        this.showModal(`Script "${name}" deleted.`);
    }

    // Theme and Display Methods
    applyTheme(theme) {
        this.prompterScreen.className = 'screen';
        if (theme !== 'dark') {
            this.prompterScreen.classList.add(`theme-${theme}`);
        }
    }

    toggleMirrorMode(enabled) {
        if (enabled) {
            this.prompterScreen.classList.add('mirror-mode');
        } else {
            this.prompterScreen.classList.remove('mirror-mode');
        }
    }

    // Keyboard Controls
    handleKeyboard(e) {
        if (!this.prompterScreen.classList.contains('active')) return;

        // Ctrl+R for recording
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
            return;
        }

        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.skipWords(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.skipWords(10);
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                this.resetPosition();
                break;
            case 'v':
            case 'V':
                e.preventDefault();
                this.toggleCameraPreview();
                break;
            case 'Escape':
                e.preventDefault();
                this.exitTeleprompter();
                break;
        }
    }

    // Navigation Methods
    skipWords(count) {
        this.currentWordIndex = Math.max(0, Math.min(
            this.currentWordIndex + count,
            this.scriptWords.length - 1
        ));
        this.scrollToPosition(this.currentWordIndex);
        this.updateProgress();
    }

    resetPosition() {
        this.currentWordIndex = 0;
        this.scrollToPosition(0);
        this.updateProgress();
        this.wordsSpoken = 0;
        this.startTime = Date.now();
    }

    // Progress and Stats Methods
    updateProgress() {
        const progress = (this.currentWordIndex / this.scriptWords.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}%`;
    }

    updateWPM() {
        if (!this.startTime) return;

        const elapsedMinutes = (Date.now() - this.startTime) / 60000;
        if (elapsedMinutes > 0) {
            const wpm = Math.round(this.wordsSpoken / elapsedMinutes);
            this.speedIndicator.textContent = `${wpm} WPM`;
        }
    }

    startWPMTracking() {
        this.startTime = Date.now();
        this.wordsSpoken = 0;
        this.wpmUpdateInterval = setInterval(() => this.updateWPM(), 1000);
    }

    stopWPMTracking() {
        if (this.wpmUpdateInterval) {
            clearInterval(this.wpmUpdateInterval);
            this.wpmUpdateInterval = null;
        }
    }

    // Countdown Method
    async showCountdown() {
        if (!this.countdownEnabledCheckbox.checked) return;

        this.countdownOverlay.classList.remove('hidden');
        
        for (let i = 3; i > 0; i--) {
            this.countdownNumber.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.countdownOverlay.classList.add('hidden');
    }

    async startTeleprompter() {
        console.log('Start Teleprompter clicked');
        this.currentScript = this.scriptInput.value.trim();
        console.log('Script content:', this.currentScript);

        if (!this.currentScript) {
            console.log('No script found - showing modal');
            this.showModal('Please enter or upload a script first.');
            return;
        }

        // Prepare script
        this.scriptWords = this.currentScript.split(/\s+/);
        this.currentWordIndex = 0;

        // Get settings
        this.fontSize = parseInt(this.fontSizeSelect.value);

        // Set up prompter display with highlighted words
        this.renderHighlightedScript();
        this.updateFontSize();

        // Switch to prompter screen
        this.setupScreen.classList.remove('active');
        this.prompterScreen.classList.add('active');

        // Show countdown
        await this.showCountdown();

        // Try to enter fullscreen on mobile
        this.requestFullscreen();

        // Request wake lock
        this.requestWakeLock();

        // Initialize progress and stats
        this.updateProgress();
        this.startWPMTracking();

        // Show instructions
        setTimeout(() => {
            this.showModal('Use keyboard shortcuts: Space=Pause, ←/→=Skip 10 words, R=Reset, Esc=Exit. Or tap "Start Voice" to begin.');
        }, this.INSTRUCTION_DELAY_MS);
    }

    renderHighlightedScript() {
        // Clear existing content
        this.prompterText.innerHTML = '';

        // Create spans for each word
        this.scriptWords.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'word';
            span.dataset.index = index;
            
            // Add space after word (except last word)
            this.prompterText.appendChild(span);
            if (index < this.scriptWords.length - 1) {
                this.prompterText.appendChild(document.createTextNode(' '));
            }
        });
    }

    highlightCurrentWord(index) {
        // Remove previous highlights
        this.prompterText.querySelectorAll('.word').forEach(span => {
            span.classList.remove('current', 'past');
        });

        // Highlight current and past words
        this.prompterText.querySelectorAll('.word').forEach(span => {
            const wordIndex = parseInt(span.dataset.index);
            if (wordIndex < index) {
                span.classList.add('past');
            } else if (wordIndex === index) {
                span.classList.add('current');
                // Scroll to keep current word visible
                this.scrollToCurrentWord(span);
            }
        });
    }

    scrollToCurrentWord(element) {
        const container = document.querySelector('.prompter-container');
        if (!container) return;
        
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerHeight = container.clientHeight;
        
        // Position based on scroll position setting
        let targetScroll;
        switch(this.scrollPosition) {
            case 'top':
                targetScroll = elementTop - (containerHeight * 0.1);
                break;
            case 'bottom':
                targetScroll = elementTop - (containerHeight * 0.7);
                break;
            case 'center':
            default:
                targetScroll = elementTop - (containerHeight / 3);
                break;
        }
        
        container.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    }

    scrollToPosition(wordIndex) {
        // Update the current word index
        this.currentWordIndex = wordIndex;
        
        // Highlight the current word
        this.highlightCurrentWord(wordIndex);
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
            }
            this.updateStatus('Paused', false);
        } else {
            this.pauseButton.querySelector('.btn-label').textContent = 'Pause';
            this.pauseButton.querySelector('.btn-icon').textContent = '⏸️';
            if (this.isListening) {
                this.recognition.start();
            }
            this.updateStatus('Scrolling...', false);
        }
    }

    exitTeleprompter() {
        if (this.isListening) {
            this.stopSpeech();
        }

        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }

        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            if (this.cameraVideo) {
                this.cameraVideo.srcObject = null;
            }
        }

        // Stop WPM tracking
        this.stopWPMTracking();

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
        this.progressBar.style.width = '0%';
        this.speedIndicator.textContent = '0 WPM';
        this.progressText.textContent = '0%';
    }

    handleSpeechResult(event) {
        if (this.isPaused) return;

        const results = event.results;
        const lastResult = results[results.length - 1];
        
        // Use interim results to advance in real-time as user speaks
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript;
            this.updateStatus(`Heard: "${transcript}"`, true);
            this.lastTranscriptLength = 0; // Reset for next phrase
        } else {
            // Process interim results word-by-word
            const transcript = lastResult[0].transcript;
            const words = transcript.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
            const wordCount = words.length;
            
            // If we heard more words than before, advance
            if (wordCount > this.lastTranscriptLength) {
                const newWords = wordCount - this.lastTranscriptLength;
                this.advanceWords(newWords);
                this.lastTranscriptLength = wordCount;
            }
            
            this.updateStatus(`Listening...`, true);
        }
    }

    advanceWords(count) {
        // Advance by the specified number of words (adjusted by sensitivity)
        const adjustedCount = Math.round(count * this.speechSensitivity);
        this.currentWordIndex = Math.min(
            this.currentWordIndex + adjustedCount,
            this.scriptWords.length - 1
        );
        this.scrollToPosition(this.currentWordIndex);
        this.wordsSpoken += adjustedCount;
        this.updateProgress();
    }

    scrollToPosition(wordIndex) {
        // Update the current word index
        this.currentWordIndex = wordIndex;
        
        // Highlight the current word
        this.highlightCurrentWord(wordIndex);
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

    // Camera and Recording Methods
    async initCamera() {
        try {
            // Request camera permission first (especially important for iOS)
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream
            
            // Now get list of video devices (with labels)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Populate camera selector
            this.cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId || ''; // Handle empty deviceId on some devices
                option.textContent = device.label || `Camera ${index + 1}`;
                this.cameraSelect.appendChild(option);
            });

            // Auto-select first camera if available
            if (videoDevices.length > 0) {
                this.cameraSelect.value = videoDevices[0].deviceId || '';
                // For iOS/Safari, if deviceId is empty, we'll use default camera
                if (!this.cameraSelect.value) {
                    this.cameraSelect.selectedIndex = 0;
                }
            }
        } catch (err) {
            console.error('Error listing cameras:', err);
            this.showModal('Could not access cameras. Please allow camera permissions in your browser settings.');
        }
    }

    async switchCamera(deviceId) {
        try {
            // Stop existing stream
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }

            // Get video quality settings
            const quality = this.getVideoQuality();

            // Build constraints
            const constraints = {
                video: deviceId ? {
                    deviceId: { exact: deviceId },
                    ...quality
                } : {
                    facingMode: 'user', // Default to front camera on mobile
                    ...quality
                },
                audio: true
            };

            // Start new stream with selected camera
            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

            this.cameraVideo.srcObject = this.cameraStream;
            this.cameraPreview.classList.remove('hidden');
            this.updateCameraPosition(this.cameraPositionSelect.value);
            this.toggleCameraMirror(this.mirrorCameraCheckbox.checked);
        } catch (err) {
            console.error('Error switching camera:', err);
            this.showModal('Could not access camera. Please check permissions and try again.');
        }
    }

    getVideoQuality() {
        const quality = this.videoQualitySelect.value;
        const settings = {
            '4k': { width: 3840, height: 2160 },
            '1080p': { width: 1920, height: 1080 },
            '720p': { width: 1280, height: 720 },
            '480p': { width: 854, height: 480 }
        };
        return settings[quality] || settings['1080p'];
    }

    updateCameraPosition(position) {
        this.cameraPreview.className = 'camera-preview';
        if (!this.cameraPreview.classList.contains('hidden')) {
            this.cameraPreview.classList.add(position);
        }
        if (this.mirrorCameraCheckbox.checked) {
            this.cameraPreview.classList.add('mirror');
        }
    }

    toggleCameraMirror(enabled) {
        if (enabled) {
            this.cameraPreview.classList.add('mirror');
        } else {
            this.cameraPreview.classList.remove('mirror');
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            // Make sure camera is active
            if (!this.cameraStream) {
                const deviceId = this.cameraSelect.value;
                // Start camera - if deviceId is empty (iOS), getUserMedia will use default camera
                await this.switchCamera(deviceId || undefined);
            }

            // Setup MediaRecorder - try MP4 first for iOS compatibility
            let options;
            let fileExtension = 'mp4';
            
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4' };
                fileExtension = 'mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                options = { mimeType: 'video/webm;codecs=vp9,opus' };
                fileExtension = 'webm';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                options = { mimeType: 'video/webm' };
                fileExtension = 'webm';
            } else {
                options = {}; // Use default
                fileExtension = 'webm';
            }

            this.recordingMimeType = options.mimeType || 'video/webm';
            this.recordingExtension = fileExtension;
            this.mediaRecorder = new MediaRecorder(this.cameraStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.saveRecording();
            });

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Update UI
            this.startRecordingButton.classList.add('hidden');
            this.stopRecordingButton.classList.remove('hidden');
            this.recordingIndicator.classList.remove('hidden');

            // Hide preview if setting enabled
            if (this.hidePreviewCheckbox.checked) {
                this.cameraPreview.classList.add('hidden');
            }

            // Start recording timer
            this.startRecordingTimer();

            this.showModal('Recording started!');
        } catch (err) {
            console.error('Error starting recording:', err);
            this.showModal('Failed to start recording. Please try again.');
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.mediaRecorder.stop();
        this.isRecording = false;

        // Update UI
        this.startRecordingButton.classList.remove('hidden');
        this.stopRecordingButton.classList.add('hidden');
        this.recordingIndicator.classList.add('hidden');
        this.cameraPreview.classList.remove('hidden');

        // Stop recording timer
        this.stopRecordingTimer();

        this.showModal('Recording stopped! Your video will download automatically.');
    }

    startRecordingTimer() {
        this.recordingTimerInterval = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
            this.recordingTimerInterval = null;
        }
        this.recordingTimer.textContent = '00:00';
    }

    saveRecording() {
        const mimeType = this.recordingMimeType || 'video/webm';
        const extension = this.recordingExtension || 'webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `teleprompter-recording-${timestamp}.${extension}`;

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        this.recordedChunks = [];
    }

    toggleCameraPreview() {
        if (!this.cameraPreview) {
            console.error('Camera preview element not found');
            return;
        }
        
        const isHidden = this.cameraPreview.classList.contains('hidden');
        if (isHidden) {
            this.cameraPreview.classList.remove('hidden');
            if (this.toggleCameraButton) {
                const label = this.toggleCameraButton.querySelector('.btn-label');
                if (label) label.textContent = 'Hide Cam';
            }
        } else {
            this.cameraPreview.classList.add('hidden');
            if (this.toggleCameraButton) {
                const label = this.toggleCameraButton.querySelector('.btn-label');
                if (label) label.textContent = 'Show Cam';
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeleprompterApp();
});
