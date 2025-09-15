class VoiceChat {
	constructor() {
		this.recognition = null;
		this.isListening = false;
		this.currentTranscript = '';
		this.conversationHistory = [];

		this.initElements();
		this.initSpeech();
		this.bindEvents();
	}

	initElements() {
		this.startBtn = document.getElementById('startBtn');
		this.intro = document.getElementById('intro');
		this.chatContainer = document.getElementById('chatContainer');
		this.messages = document.getElementById('messages');
		this.status = document.getElementById('status');
	}

	initSpeech() {
		if (!('webkitSpeechRecognition' in window)) {
			alert('Speech recognition not supported');
			return;
		}

		this.recognition = new webkitSpeechRecognition();
		this.recognition.continuous = true;
		this.recognition.interimResults = true;
		this.recognition.lang = 'en-US';

		this.recognition.onstart = () => this.onSpeechStart();
		this.recognition.onresult = (e) => this.onSpeechResult(e);
		this.recognition.onend = () => this.onSpeechEnd();
		this.recognition.onerror = (e) => this.onSpeechError(e);
	}

	bindEvents() {
		this.startBtn.onclick = () => this.startChat();
	}

	startChat() {
		this.intro.style.display = 'none';
		this.chatContainer.style.display = 'block';
		this.startListening();
	}

	startListening() {
		if (this.isListening) return;

		this.isListening = true;
		this.currentTranscript = '';
		this.updateStatus('Listening...');
		this.recognition.start();
	}

	onSpeechStart() {
		this.updateStatus('🎤 Listening...');
	}

	onSpeechResult(event) {
		let interimTranscript = '';
		let finalTranscript = '';

		for (let i = event.resultIndex; i < event.results.length; i++) {
			const transcript = event.results[i][0].transcript;
			if (event.results[i].isFinal) {
				finalTranscript += transcript;
			} else {
				interimTranscript += transcript;
			}
		}

		// Update current transcript display
		this.currentTranscript = finalTranscript;

		// Show live transcript
		this.updateStatus(`Speaking: "${interimTranscript}"`);

		// If we have final transcript, process it
		if (finalTranscript) {
			this.processFinalTranscript(finalTranscript);
		}
	}

	processFinalTranscript(transcript) {
		if (!transcript.trim()) return;

		// Add user message to chat
		this.addMessage(transcript, 'user');

		// Stop listening while processing
		this.stopListening();
		this.updateStatus('Thinking...');

		// Send to backend (we'll implement this next)
		this.sendToAI(transcript);
	}

	async sendToAI(transcript) {
		// For now, just echo back - we'll replace with real backend
		setTimeout(() => {
			const response = `I heard you say: "${transcript}". This is where the AI response will go!`;
			this.addMessage(response, 'ai');
			this.startListening(); // Resume listening
		}, 1000);
	}

	addMessage(text, type) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${type}`;
		messageDiv.textContent = text;
		this.messages.appendChild(messageDiv);
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	stopListening() {
		if (!this.isListening) return;
		this.isListening = false;
		this.recognition.stop();
	}

	onSpeechEnd() {
		if (this.isListening) {
			// Restart if we want continuous listening
			this.recognition.start();
		}
	}

	onSpeechError(event) {
		console.error('Speech error:', event.error);
		this.updateStatus('Speech error - trying again...');
		this.startListening();
	}

	updateStatus(text) {
		this.status.textContent = text;
	}
}

// Start the app
new VoiceChat();