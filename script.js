class VoiceChat {
	constructor() {
		this.recognition = null;
		this.isListening = false;
		this.currentTranscript = '';
		this.conversationHistory = [];
		this.pauseTimer = null;
		this.pauseThreshold = 5000; // 5 seconds

		// Documentation system
		this.availableDocs = ['beliefs', 'ai-native', 'projects', 'community', 'tools'];
		this.unlockedDocs = ['beliefs']; // Start with beliefs unlocked
		this.loadedDocs = new Map();
		this.collapsedDocs = new Set();

		this.initElements();
		this.initSpeech();
		this.bindEvents();
		this.loadInitialDocs();
	}

	initElements() {
		this.startBtn = document.getElementById('startBtn');
		this.chatIntro = document.querySelector('.chat-intro');
		this.chatContainer = document.getElementById('chatContainer');
		this.messages = document.getElementById('messages');
		this.status = document.getElementById('status');
		this.docsContent = document.getElementById('docsContent');
		this.unlockedCount = document.getElementById('unlockedCount');
		this.totalDocs = document.getElementById('totalDocs');
	}

	async loadInitialDocs() {
		// Set total count
		this.totalDocs.textContent = this.availableDocs.length;

		// Load and display initial doc (beliefs)
		await this.loadAndDisplayDoc('beliefs');
		this.updateUnlockCounter();
	}

	async loadAndDisplayDoc(docName, isNewlyUnlocked = false) {
		try {
			const response = await fetch(`/api/docs?doc=${docName}`);
			const docData = await response.json();

			this.loadedDocs.set(docName, docData);
			this.renderDoc(docName, docData, isNewlyUnlocked);

		} catch (error) {
			console.error(`Failed to load ${docName}:`, error);
		}
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

		// Remove glow animation after it completes
		if (isNewlyUnlocked) {
			setTimeout(() => {
				docSection.classList.remove('newly-unlocked');
			}, 2000);
		}
	}

	toggleDoc(docName) {
		const docSection = document.getElementById(`doc-${docName}`);
		const content = docSection.querySelector('.doc-content');
		const toggle = docSection.querySelector('.doc-toggle');

		if (this.collapsedDocs.has(docName)) {
			this.collapsedDocs.delete(docName);
			content.style.display = 'block';
			toggle.textContent = '▼';
		} else {
			this.collapsedDocs.add(docName);
			content.style.display = 'none';
			toggle.textContent = '▶';
		}
	}

	updateUnlockCounter() {
		this.unlockedCount.textContent = this.unlockedDocs.length;
	}

	async checkForNewUnlocks(userMessage, aiResponse) {
		// Simple keyword-based unlocking (can be enhanced later)
		const unlockRules = {
			'ai-native': ['ai native', 'ai tools', 'productivity', 'workflow'],
			'projects': ['project', 'building', 'cognition', 'extension'],
			'community': ['community', 'collaboration', 'consensus', 'collective'],
			'tools': ['tools', 'software', 'development', 'open source']
		};

		const conversationText = (userMessage + ' ' + aiResponse).toLowerCase();
		const newUnlocks = [];

		for (const [docName, keywords] of Object.entries(unlockRules)) {
			if (!this.unlockedDocs.includes(docName)) {
				const hasKeyword = keywords.some(keyword => conversationText.includes(keyword));
				if (hasKeyword) {
					newUnlocks.push(docName);
				}
			}
		}

		// Unlock new documents with animation
		for (const docName of newUnlocks) {
			await this.unlockDocument(docName);
		}
	}

	async unlockDocument(docName) {
		if (this.unlockedDocs.includes(docName)) return;

		this.unlockedDocs.push(docName);
		await this.loadAndDisplayDoc(docName, true);
		this.updateUnlockCounter();

		// Show a brief notification
		this.showUnlockNotification(docName);
	}

	showUnlockNotification(docName) {
		const notification = document.createElement('div');
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #4ecdc4;
			color: #1a1a1a;
			padding: 1rem;
			border-radius: 8px;
			font-weight: 500;
			z-index: 1000;
			animation: slideIn 0.3s ease-out;
		`;
		notification.textContent = `🔓 Unlocked: ${docName}`;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
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
		this.chatIntro.style.display = 'none';
		this.chatContainer.classList.add('active');

		// Update button for voice interactions
		this.startBtn.textContent = '🎤 Click to Speak';
		this.startBtn.onclick = () => this.toggleListening();
		this.startBtn.style.position = 'fixed';
		this.startBtn.style.bottom = '2rem';
		this.startBtn.style.right = '2rem';
		this.startBtn.style.zIndex = '1000';

		this.updateStatus('Click the microphone to start speaking');
	}

	toggleListening() {
		if (this.isListening) {
			this.stopListening();
		} else {
			this.startListening();
		}
	}

	startListening() {
		if (this.isListening) return;

		this.isListening = true;
		this.currentTranscript = '';
		this.clearPauseTimer();
		this.updateStatus('🎤 Listening... speak now');
		this.startBtn.textContent = '⏹️ Stop';
		this.recognition.start();
	}

	stopListening() {
		if (!this.isListening) return;

		this.isListening = false;
		this.clearPauseTimer();
		this.recognition.stop();
		this.startBtn.textContent = '🎤 Click to Speak';
		this.updateStatus('Click microphone to speak again');
	}

	clearPauseTimer() {
		if (this.pauseTimer) {
			clearTimeout(this.pauseTimer);
			this.pauseTimer = null;
		}
	}

	startPauseTimer() {
		this.clearPauseTimer();
		this.pauseTimer = setTimeout(() => {
			if (this.currentTranscript.trim()) {
				this.processFinalTranscript(this.currentTranscript);
			}
		}, this.pauseThreshold);
	}

	onSpeechStart() {
		this.updateStatus('🎤 Listening... speak now');
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

		// Update current transcript with final results
		if (finalTranscript) {
			this.currentTranscript += finalTranscript;
		}

		// Show what's being spoken (interim + accumulated final)
		const displayText = this.currentTranscript + interimTranscript;
		this.updateStatus(`Speaking: "${displayText}"`);

		// Reset pause timer on any speech activity
		if (interimTranscript.trim() || finalTranscript.trim()) {
			this.startPauseTimer();
		}
	}

	processFinalTranscript(transcript) {
		if (!transcript.trim()) return;

		this.addMessage(transcript, 'user');
		this.stopListening();
		this.updateStatus('🤔 Thinking...');
		this.sendToAI(transcript);
	}

	async sendToAI(transcript) {
		this.conversationHistory.push({ role: 'user', content: transcript });

		try {
			// Get relevant docs for context
			const contextDocs = this.getRelevantDocs(transcript);

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: this.conversationHistory,
					contextDocs: contextDocs
				})
			});

			const data = await response.json();
			const aiResponse = data.response;

			this.conversationHistory.push({ role: 'assistant', content: aiResponse });
			this.addMessage(aiResponse, 'ai');

			// Check for new document unlocks
			await this.checkForNewUnlocks(transcript, aiResponse);

		} catch (error) {
			this.addMessage('Sorry, something went wrong!', 'ai');
		}

		this.updateStatus('Click microphone to continue conversation');
	}

	getRelevantDocs(transcript) {
		// Return content of unlocked docs for AI context
		const relevantDocs = [];

		for (const docName of this.unlockedDocs) {
			if (this.loadedDocs.has(docName)) {
				const doc = this.loadedDocs.get(docName);
				relevantDocs.push({
					name: docName,
					content: doc.content
				});
			}
		}

		return relevantDocs;
	}

	addMessage(text, type) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${type}`;
		messageDiv.textContent = text;
		this.messages.appendChild(messageDiv);
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	onSpeechEnd() {
		// Don't auto-restart - user must click to re-engage
		this.isListening = false;
		this.startBtn.textContent = '🎤 Click to Speak';
	}

	onSpeechError(event) {
		console.error('Speech error:', event.error);
		this.updateStatus('Speech error - click microphone to try again');
		this.stopListening();
	}

	updateStatus(text) {
		this.status.textContent = text;
	}
}

// Global instance for onclick handlers
const voiceChat = new VoiceChat();

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
	@keyframes slideIn {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
	@keyframes slideOut {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(100%); opacity: 0; }
	}
`;
document.head.appendChild(style);