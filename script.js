class VoiceChat {
	constructor() {
		this.recognition = null;
		this.isListening = false;
		this.currentTranscript = '';
		this.accumulatedTranscript = '';
		this.pauseTimer = null;
		this.conversationHistory = [];
		this.availableDocs = ['beliefs', 'ai-native', 'projects', 'community', 'tools'];
		this.unlockedDocs = ['beliefs'];
		this.loadedDocs = new Map();
		this.collapsedDocs = new Set();
		this.unlockRules = {
			'ai-native': ['ai native', 'ai tools', 'productivity', 'workflow'],
			'projects': ['project', 'building', 'cognition', 'extension'],
			'community': ['community', 'collaboration', 'consensus', 'collective'],
			'tools': ['tools', 'software', 'development', 'open source']
		};

		// Mobile speech recognition enhancements
		this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		this.restartAttempts = 0;
		this.maxRestartAttempts = 50;

		this.initElements();
		this.initSpeech();
		this.bindEvents();
		this.loadConversationFromStorage();
		this.loadInitialDocs();
		this.addMessage("Hi, I'm building AI tools that increase individual capability. Browse the knowledge base, then let's talk about how we can 10X your productivity!", 'ai');
	}

	initElements() {
		this.startBtn = document.getElementById('startBtn');
		this.chatContainer = document.getElementById('chatContainer');
		this.messages = document.getElementById('messages');
		this.status = document.getElementById('status');
		this.docsContent = document.getElementById('docsContent');
		this.unlockedCount = document.getElementById('unlockedCount');
		this.totalDocs = document.getElementById('totalDocs');
		this.contactStatus = document.getElementById('contactStatus');
		this.emailInput = document.getElementById('emailInput');
		this.submitContact = document.getElementById('submitContact');
	}

	async loadInitialDocs() {
		this.totalDocs.textContent = this.availableDocs.length;
		await this.loadAndDisplayDoc('beliefs');
		this.updateUnlockCounter();
	}

	async loadAndDisplayDoc(docName, isNewlyUnlocked = false) {
		try {
			const response = await fetch(`/api/docs?doc=${docName}`);
			const docData = await response.json();
			this.loadedDocs.set(docName, docData);
			this.renderDoc(docName, docData, isNewlyUnlocked);
		} catch (error) { console.error(`Failed to load ${docName}:`, error); }
	}

	renderDoc(docName, docData, isNewlyUnlocked = false) {
		const docSection = document.createElement('div');
		docSection.className = `doc-section${isNewlyUnlocked ? ' newly-unlocked' : ''}`;
		docSection.id = `doc-${docName}`;
		const isCollapsed = this.collapsedDocs.has(docName);

		docSection.innerHTML = `
			<div class="doc-header" onclick="voiceChat.toggleDoc('${docName}')">
				<h3>${docData.title}</h3>
				<span class="doc-toggle">${isCollapsed ? '▶' : '▼'}</span>
			</div>
			<div class="doc-content" style="display: ${isCollapsed ? 'none' : 'block'}">
				${marked.parse(docData.content)}
			</div>
		`;

		this.docsContent.appendChild(docSection);
		if (isNewlyUnlocked) setTimeout(() => docSection.classList.remove('newly-unlocked'), 2000);
	}

	toggleDoc(docName) {
		const docSection = document.getElementById(`doc-${docName}`);
		const content = docSection.querySelector('.doc-content');
		const toggle = docSection.querySelector('.doc-toggle');
		const isCollapsed = this.collapsedDocs.has(docName);

		if (isCollapsed) {
			this.collapsedDocs.delete(docName);
			content.style.display = 'block';
			toggle.textContent = '▼';
		} else {
			this.collapsedDocs.add(docName);
			content.style.display = 'none';
			toggle.textContent = '▶';
		}
	}

	updateUnlockCounter = () => {
		this.unlockedCount.textContent = this.unlockedDocs.length;
		this.checkContactUnlock();
	}

	checkContactUnlock = () => {
		if (this.unlockedDocs.length >= 3) {
			this.contactStatus.textContent = '🔓 Get updates on AI tools';
			this.emailInput.disabled = false;
			this.submitContact.disabled = false;
		}
	}

	handleContactSubmit = async () => {
		const email = this.emailInput.value.trim();
		if (!email || !email.includes('@')) {
			alert('Please enter a valid email');
			return;
		}

		this.submitContact.disabled = true;
		this.submitContact.textContent = 'Saving...';

		try {
			await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					chatHistory: this.conversationHistory,
					unlockedDocs: this.unlockedDocs
				})
			});

			this.contactStatus.textContent = '✅ Contact saved! Thanks for connecting';
			this.emailInput.style.display = 'none';
			this.submitContact.style.display = 'none';
			localStorage.setItem('userEmail', email);
		} catch (error) {
			alert('Failed to save contact. Please try again.');
			this.submitContact.disabled = false;
			this.submitContact.textContent = 'Submit';
		}
	}

	saveConversationToStorage = () => {
		localStorage.setItem('chatHistory', JSON.stringify(this.conversationHistory));
		localStorage.setItem('unlockedDocs', JSON.stringify(this.unlockedDocs));
	}

	loadConversationFromStorage = () => {
		const savedHistory = localStorage.getItem('chatHistory');
		const savedDocs = localStorage.getItem('unlockedDocs');
		const savedEmail = localStorage.getItem('userEmail');

		if (savedHistory) this.conversationHistory = JSON.parse(savedHistory);
		if (savedDocs) this.unlockedDocs = JSON.parse(savedDocs);
		if (savedEmail) {
			this.emailInput.value = savedEmail;
			this.contactStatus.textContent = '✅ Contact saved! Thanks for connecting';
			this.emailInput.style.display = 'none';
			this.submitContact.style.display = 'none';
		}
	}

	async checkForNewUnlocks(userMessage, aiResponse) {
		const conversationText = (userMessage + ' ' + aiResponse).toLowerCase();
		const newUnlocks = Object.entries(this.unlockRules)
			.filter(([docName, keywords]) =>
				!this.unlockedDocs.includes(docName) &&
				keywords.some(keyword => conversationText.includes(keyword))
			)
			.map(([docName]) => docName);

		for (const docName of newUnlocks) await this.unlockDocument(docName);
	}

	async unlockDocument(docName) {
		if (this.unlockedDocs.includes(docName)) return;
		this.unlockedDocs.push(docName);
		await this.loadAndDisplayDoc(docName, true);
		this.updateUnlockCounter();
		this.showUnlockNotification(docName);
	}

	showUnlockNotification = (docName) => {
		const notification = document.createElement('div');
		notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #4ecdc4; color: #1a1a1a; padding: 1rem; border-radius: 8px; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease-out;`;
		notification.textContent = `🔓 Unlocked: ${docName}`;
		document.body.appendChild(notification);
		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	// ENHANCED MOBILE SPEECH RECOGNITION
	initSpeech() {
		if (!('webkitSpeechRecognition' in window)) {
			alert('Speech recognition not supported');
			return;
		}

		this.recognition = new webkitSpeechRecognition();

		// Mobile-optimized settings
		Object.assign(this.recognition, {
			continuous: false, // CRITICAL: false for mobile reliability  
			interimResults: true,
			lang: 'en-US',
			maxAlternatives: 1
		});

		// Handle successful start
		this.recognition.onstart = () => {
			this.restartAttempts = 0; // Reset on successful start
			this.updateStatus('Listening...');
		};

		// Main result handler
		this.recognition.onresult = (e) => this.onSpeechResult(e);

		// AUTO-RESTART PATTERN - The key to mobile speech recognition
		this.recognition.onend = () => {
			if (this.isListening && this.restartAttempts < this.maxRestartAttempts) {
				// Small delay prevents rapid restart loops
				setTimeout(() => {
					if (this.isListening) { // Check again after delay
						try {
							this.restartAttempts++;
							this.recognition.start();
						} catch (error) {
							console.error('Restart failed:', error);
							this.stopListening();
						}
					}
				}, 100);
			} else {
				this.stopListening();
			}
		};

		// Enhanced error handling for mobile
		this.recognition.onerror = (e) => {
			console.error('Speech error:', e.error);

			switch (e.error) {
				case 'no-speech':
					// Normal timeout - auto-restart will handle
					break;
				case 'aborted':
					// User stopped - don't restart
					this.stopListening();
					break;
				case 'network':
					this.updateStatus('Network error - check connection');
					this.stopListening();
					break;
				case 'not-allowed':
					this.updateStatus('Microphone permission denied');
					this.stopListening();
					break;
				default:
					// Other errors - try restart after delay
					if (this.isListening) {
						setTimeout(() => {
							if (this.isListening && this.restartAttempts < this.maxRestartAttempts) {
								try {
									this.recognition.start();
								} catch (err) {
									this.stopListening();
								}
							}
						}, 1000);
					}
			}
		};
	}

	// Enhanced result processing for mobile
	onSpeechResult = (event) => {
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

		// On mobile, process final results immediately
		if (finalTranscript.trim()) {
			this.accumulatedTranscript += finalTranscript;
			// Mobile users expect faster response - shorter pause
			this.resetPauseTimer(this.isMobile ? 2000 : 5000);
		}

		// Show current progress
		const displayText = this.accumulatedTranscript + interimTranscript;
		this.updateStatus(`Speaking: "${displayText}"`);
	}

	// Mobile-optimized pause timer
	resetPauseTimer = (delay = 5000) => {
		clearTimeout(this.pauseTimer);

		let seconds = Math.ceil(delay / 1000);
		const countdownTick = () => {
			this.updateStatus(`Sending in ${seconds}... ${'●'.repeat(Math.max(0, 6 - seconds))}`);
			seconds--;
			if (seconds > 0) {
				this.pauseTimer = setTimeout(countdownTick, 1000);
			} else {
				this.handlePauseComplete();
			}
		};
		this.pauseTimer = setTimeout(countdownTick, 1000);
	}

	handlePauseComplete = () => {
		if (!this.accumulatedTranscript.trim()) return;
		const transcript = this.accumulatedTranscript;
		this.accumulatedTranscript = '';
		this.processFinalTranscript(transcript);
	}

	processFinalTranscript = (transcript) => {
		if (!transcript.trim()) return;
		this.addMessage(transcript, 'user');
		this.stopListening();
		this.updateStatus('Thinking...');
		this.sendToAI(transcript);
	}

	bindEvents = () => {
		this.startBtn.onclick = () => this.toggleListening();
		this.submitContact.onclick = () => this.handleContactSubmit();
	}

	toggleListening = () => this.isListening ? this.stopListening() : this.startListening();

	// Enhanced start with mobile safeguards
	startListening() {
		if (this.isListening) return;

		this.isListening = true;
		this.accumulatedTranscript = '';
		this.restartAttempts = 0;
		this.startBtn.textContent = '⏹️ Stop';
		this.startBtn.classList.add('listening');

		try {
			this.recognition.start();
		} catch (error) {
			console.error('Failed to start recognition:', error);
			this.stopListening();
		}
	}

	// Enhanced stop with mobile cleanup
	stopListening() {
		if (!this.isListening) return;

		this.isListening = false;
		this.restartAttempts = this.maxRestartAttempts; // Prevent auto-restart
		clearTimeout(this.pauseTimer);

		this.startBtn.textContent = '🎤 Listen';
		this.startBtn.classList.remove('listening');
		this.updateStatus('Click to start listening...');

		try {
			this.recognition.stop();
		} catch (error) {
			console.error('Stop error:', error);
		}

		// Process any accumulated speech
		if (this.accumulatedTranscript.trim()) {
			this.processFinalTranscript(this.accumulatedTranscript);
			this.accumulatedTranscript = '';
		}
	}

	async sendToAI(transcript) {
		this.conversationHistory.push({ role: 'user', content: transcript });
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: this.conversationHistory,
					contextDocs: this.getRelevantDocs()
				})
			});
			const { response: aiResponse } = await response.json();
			this.conversationHistory.push({ role: 'assistant', content: aiResponse });
			this.addMessage(aiResponse, 'ai');
			await this.checkForNewUnlocks(transcript, aiResponse);
			this.saveConversationToStorage();
		} catch (error) {
			this.addMessage('Sorry, something went wrong!', 'ai');
		}
		this.updateStatus('Click to start listening...');
	}

	getRelevantDocs = () => this.unlockedDocs
		.filter(name => this.loadedDocs.has(name))
		.map(name => ({ name, content: this.loadedDocs.get(name).content }));

	updateStatus = (text) => this.status.textContent = text;

	addMessage(text, type) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${type}`;
		messageDiv.textContent = text;
		this.messages.appendChild(messageDiv);
		this.messages.scrollTop = this.messages.scrollHeight;
	}
}

addEventListener('DOMContentLoaded', () => voiceChat = new VoiceChat());