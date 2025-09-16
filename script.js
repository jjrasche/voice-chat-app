class VoiceChat {
	constructor() {
		this.recognition = null;
		this.isListening = false;
		this.currentTranscript = '';
		this.accumulatedTranscript = '';
		this.pauseTimer = null;
		this.conversationHistory = [];
		this.availableDocs = ['beliefs', 'ai-native', 'community', 'flow-graph', 'contribute', 'platform'];
		this.unlockedDocs = ['beliefs'];
		this.activeDoc = 'beliefs';
		this.engagementStarted = false;
		this.engagementStopped = false;
		this.unlockRules = {
			'ai-native': ['ai native', 'ai tools', 'productivity', 'workflow'],
			'community': ['community', 'collaboration', 'consensus', 'collective'],
			'flow-graph': ['knowledge', 'graph', 'flow', 'thinking'],
			'contribute': ['contribute', 'build', 'help', 'join'],
			'platform': ['platform', 'technical', 'browser', 'open source']
		};

		// Mobile speech recognition enhancements
		this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		this.restartAttempts = 0;
		this.maxRestartAttempts = 50;
		this.lastInterimTime = 0;

		this.docIcons = {
			'beliefs': '📚',
			'ai-native': '🤖',
			'community': '👥',
			'flow-graph': '🧠',
			'contribute': '🔨',
			'platform': '⚡'
		};

		this.docLabels = {
			'beliefs': 'Beliefs',
			'ai-native': 'AI Native',
			'community': 'Community',
			'flow-graph': 'Flow Graph',
			'contribute': 'Contribute',
			'platform': 'Platform'
		};

		this.docContent = {
			'beliefs': `# BELIEFS
* **Voice-first AI** creates frictionless interaction enabling flow where thoughts come easily and problems solve quickly
* **Individual capability** is the foundation of freedom - AI-native tools make people more capable and impactful
* **AI democratization** prevents inequality - allows have-nots to access what only the rich had before
* **Full utility requires trust** - you can't be intimate with tools owned by corporations extracting from you
* **Privacy and data ownership** must remain yours for the deep sharing needed to maximize impact`,

			'ai-native': `# AI-NATIVE
* **Being AI-native means** human creativity plus machine efficiency working in harmony
* **Reliable task automation** - hand routine work to agent AI to multiply your impact
* **Quick access to information** and quality inference on your exact working context keeps you in flow
* **Inference access** to your knowledge and context lets you flow longer and deeper than ever possible`,

			'community': `# COMMUNITY
* **More capable individuals** create more capable, flourishing communities
* **AI solves coordination** problems - consensus and connection issues that prevent collaboration
* **Reduces information overhead** while preserving essential human connection time
* **Informed populace** understands nuance and has tools for engagement and government accountability`,

			'flow-graph': `# FLOW-GRAPH
* **Flow state requires** frictionless access to your knowledge network and previous connections
* **Accessing previous ideas** enables deeper insights and faster problem-solving through atomic linking
* **AI-native tools create** knowledge graphs as byproducts - connections emerge from usage patterns
* **Connected knowledge** creates compound insights when context and history merge seamlessly`,

			'contribute': `# CONTRIBUTE
* **Build freedom and equality** now by democratizing AI-native tools for everyone
* **Beta testers** - use tools daily, provide feedback on real workflows and pain points
* **Developers** - Chrome extensions, open source experience, modular design patterns welcome
* **Dreamers** - envision how AI-native society could heal from our current dysfunction
* **Patrons** - support affordable access to hardware, networks, and tool development`,

			'platform': `# PLATFORM
* **Browser-first** - Chrome provides universal, ever-present platform for AI tools
* **Affordable hardware** - Chrome OS devices make access economically viable for most people
* **Open source** ensures transparent, community-driven development and trust
* **Local models** when possible, cloud when needed, always with honest limitations
* **Distributed systems** - Chrome runtime enables seamless cross-context tool coordination`
		};

		this.initElements();
		this.initSpeech();
		this.bindEvents();
		this.loadConversationFromStorage();
		this.loadInitialDocs();
		this.startProgressiveEngagement();
	}

	initElements() {
		this.startBtn = document.getElementById('startBtn');
		this.chatContainer = document.getElementById('chatContainer');
		this.messages = document.getElementById('messages');
		this.docsContent = document.getElementById('docsContent');
		this.docsSidebar = document.getElementById('docsSidebar');
	}

	async loadInitialDocs() {
		this.renderSidebar();
		this.displayDoc('beliefs');
	}

	renderSidebar() {
		this.docsSidebar.innerHTML = this.availableDocs.map(docName => {
			const isUnlocked = this.unlockedDocs.includes(docName);
			const isActive = this.activeDoc === docName;
			return `
				<div class="doc-icon ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}" 
					 data-doc="${docName}" 
					 data-label="${this.docLabels[docName]}"
					 onclick="voiceChat.selectDoc('${docName}')">
					${this.docIcons[docName]}
				</div>
			`;
		}).join('');
	}

	selectDoc(docName) {
		if (!this.unlockedDocs.includes(docName)) return;
		this.activeDoc = docName;
		this.renderSidebar();
		this.displayDoc(docName);
	}

	displayDoc(docName, isNewlyUnlocked = false) {
		const content = this.docContent[docName];
		if (!content) return;

		this.docsContent.innerHTML = `
			<div class="doc-section${isNewlyUnlocked ? ' newly-unlocked' : ''}">
				${marked.parse(content)}
			</div>
		`;

		if (isNewlyUnlocked) {
			setTimeout(() => {
				const section = this.docsContent.querySelector('.newly-unlocked');
				if (section) section.classList.remove('newly-unlocked');
			}, 2000);
		}
	}

	checkForEmailUnlock = () => {
		if (this.unlockedDocs.length >= 3 && !this.emailOffered) {
			this.emailOffered = true;
			setTimeout(() => this.offerEmailCollection(), 2000);
		}
	}

	offerEmailCollection = () => {
		const emailBubble = document.createElement('div');
		emailBubble.className = 'message ai email-bubble';
		emailBubble.innerHTML = `
			<div>🔓 I see you've unlocked ${this.unlockedDocs.length} docs! Want updates on new AI tools?</div>
			<div class="email-form">
				<input type="email" placeholder="your@email.com" id="emailInput">
				<button onclick="voiceChat.submitEmail()">Submit</button>
			</div>
			<div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">I'll only send useful stuff, promise!</div>
		`;
		this.messages.appendChild(emailBubble);
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	submitEmail = async () => {
		const emailInput = document.getElementById('emailInput');
		const email = emailInput.value.trim();

		if (!email || !email.includes('@')) {
			alert('Please enter a valid email');
			return;
		}

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

			emailInput.parentElement.innerHTML = '<div style="color: #4ecdc4;">✅ Thanks! You\'re all set.</div>';
			localStorage.setItem('userEmail', email);
		} catch (error) {
			alert('Failed to save email. Please try again.');
		}
	}

	startProgressiveEngagement = () => {
		if (this.engagementStarted || this.engagementStopped) return;
		this.engagementStarted = true;

		// 1s delay + 1s typing + first message
		setTimeout(() => {
			if (this.engagementStopped) return;
			this.showTypingIndicator();

			setTimeout(() => {
				if (this.engagementStopped) return;
				this.hideTypingIndicator();
				this.addMessage("Hi! I'm curious about what you do and where AI native tools can help you most.", 'ai');

				// 10s delay + 2s typing + second message
				setTimeout(() => {
					if (this.engagementStopped) return;
					this.showTypingIndicator();

					setTimeout(() => {
						if (this.engagementStopped) return;
						this.hideTypingIndicator();
						this.addMessage("Let's talk about it - who do you use as a thought partner now?", 'ai');

						// 10s delay + 2s typing + final message
						setTimeout(() => {
							if (this.engagementStopped) return;
							this.showTypingIndicator();

							setTimeout(() => {
								if (this.engagementStopped) return;
								this.hideTypingIndicator();
								this.addMessage("Just press the microphone to start talking to me 🎤", 'ai');
							}, 2000);
						}, 10000);
					}, 2000);
				}, 10000);
			}, 1000);
		}, 1000);
	}

	showTypingIndicator = () => {
		const indicator = document.createElement('div');
		indicator.className = 'typing-indicator';
		indicator.id = 'typingIndicator';
		indicator.innerHTML = `
			<div class="typing-dots">
				<div class="dot"></div>
				<div class="dot"></div>
				<div class="dot"></div>
			</div>
		`;
		this.messages.appendChild(indicator);
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	hideTypingIndicator = () => {
		const indicator = document.getElementById('typingIndicator');
		if (indicator) indicator.remove();
	}

	saveConversationToStorage = () => {
		localStorage.setItem('chatHistory', JSON.stringify(this.conversationHistory));
		localStorage.setItem('unlockedDocs', JSON.stringify(this.unlockedDocs));
		localStorage.setItem('activeDoc', this.activeDoc);
	}

	loadConversationFromStorage = () => {
		const savedHistory = localStorage.getItem('chatHistory');
		const savedDocs = localStorage.getItem('unlockedDocs');
		const savedActiveDoc = localStorage.getItem('activeDoc');
		const savedEmail = localStorage.getItem('userEmail');

		if (savedHistory) {
			this.conversationHistory = JSON.parse(savedHistory);
			this.engagementStopped = true; // Don't show intro if conversation exists
		}
		if (savedDocs) this.unlockedDocs = JSON.parse(savedDocs);
		if (savedActiveDoc && this.unlockedDocs.includes(savedActiveDoc)) {
			this.activeDoc = savedActiveDoc;
		}
		if (savedEmail) this.emailOffered = true;
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
		this.displayDoc(docName, true);
		this.renderSidebar();
		this.checkForEmailUnlock();
		this.showUnlockNotification(docName);
	}

	showUnlockNotification = (docName) => {
		const notification = document.createElement('div');
		notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #4ecdc4; color: #1a1a1a; padding: 1rem; border-radius: 8px; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease-out;`;
		notification.textContent = `🔓 Unlocked: ${this.docLabels[docName]}`;
		document.body.appendChild(notification);
		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	// Speech recognition methods (keeping existing implementation)
	initSpeech() {
		if (!('webkitSpeechRecognition' in window)) {
			alert('Speech recognition not supported');
			return;
		}

		this.recognition = new webkitSpeechRecognition();
		this.lastInterimTime = 0;

		Object.assign(this.recognition, {
			continuous: false,
			interimResults: true,
			lang: 'en-US',
			maxAlternatives: 1
		});

		this.recognition.onstart = () => {
			this.restartAttempts = 0;
		};

		this.recognition.onresult = (e) => this.onSpeechResult(e);

		this.recognition.onend = () => {
			if (this.isListening && this.restartAttempts < this.maxRestartAttempts) {
				setTimeout(() => {
					if (this.isListening) {
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

		this.recognition.onerror = (e) => {
			console.error('Speech error:', e.error);
			switch (e.error) {
				case 'no-speech':
				case 'aborted':
					break;
				case 'network':
					console.error('Network error - check connection');
					this.stopListening();
					break;
				case 'not-allowed':
					console.error('Microphone permission denied');
					this.stopListening();
					break;
				default:
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

		if (finalTranscript.trim()) {
			this.accumulatedTranscript += finalTranscript;
		}

		// Show live transcription
		const fullText = this.accumulatedTranscript + interimTranscript;
		if (fullText.trim()) {
			this.updateLiveTranscript(fullText, !!interimTranscript.trim());
		}

		if (interimTranscript.trim()) {
			this.lastInterimTime = Date.now();
			clearTimeout(this.pauseTimer);
		} else if (this.accumulatedTranscript.trim()) {
			this.startPauseDetection();
		}
	}

	updateLiveTranscript = (text, isLive) => {
		let liveElement = document.getElementById('liveTranscript');

		if (!liveElement) {
			liveElement = document.createElement('div');
			liveElement.id = 'liveTranscript';
			liveElement.className = 'live-transcript';
			liveElement.onclick = () => this.editTranscript();
			this.messages.appendChild(liveElement);
		}

		liveElement.innerHTML = text + (isLive ? '<span class="transcript-cursor">|</span>' : '');
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	editTranscript = () => {
		const liveElement = document.getElementById('liveTranscript');
		if (!liveElement) return;

		// Create editable input
		const input = document.createElement('input');
		input.type = 'text';
		input.value = this.accumulatedTranscript;
		input.style.cssText = `
			width: 100%; 
			background: #2a2a2a; 
			border: 1px solid #4ecdc4; 
			border-radius: 4px; 
			padding: 0.5rem; 
			color: #fff; 
			font-size: 1rem;
		`;

		input.onkeydown = (e) => {
			if (e.key === 'Enter') {
				this.accumulatedTranscript = input.value;
				this.handlePauseComplete();
			} else if (e.key === 'Escape') {
				this.clearLiveTranscript();
				this.stopListening();
			}
		};

		liveElement.innerHTML = '';
		liveElement.appendChild(input);
		input.focus();
		input.select();
	}

	clearLiveTranscript = () => {
		const liveElement = document.getElementById('liveTranscript');
		if (liveElement) liveElement.remove();
	}

	startPauseDetection = () => {
		clearTimeout(this.pauseTimer);
		this.pauseTimer = setTimeout(() => {
			const timeSinceLastInterim = Date.now() - this.lastInterimTime;
			if (timeSinceLastInterim > 1500) {
				this.startCountdown();
			} else {
				this.startPauseDetection();
			}
		}, 500);
	}

	startCountdown = () => {
		let seconds = 3;
		const countdownTick = () => {
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
		this.clearLiveTranscript();
		this.addMessage(transcript, 'user');
		this.stopListening();
		this.sendToAI(transcript);
	}

	bindEvents = () => {
		this.startBtn.onclick = () => this.toggleListening();
	}

	toggleListening = () => {
		this.engagementStopped = true; // Stop progressive engagement
		this.hideTypingIndicator();
		this.isListening ? this.stopListening() : this.startListening();
	}

	startListening() {
		if (this.isListening) return;

		this.isListening = true;
		this.accumulatedTranscript = '';
		this.restartAttempts = 0;
		this.lastInterimTime = 0;
		this.clearLiveTranscript();
		this.startBtn.textContent = '⏹️';
		this.startBtn.classList.add('listening');

		try {
			this.recognition.start();
		} catch (error) {
			console.error('Failed to start recognition:', error);
			this.stopListening();
		}
	}

	stopListening() {
		if (!this.isListening) return;

		this.isListening = false;
		this.restartAttempts = this.maxRestartAttempts;
		clearTimeout(this.pauseTimer);

		this.startBtn.textContent = '🎤';
		this.startBtn.classList.remove('listening');

		try {
			this.recognition.stop();
		} catch (error) {
			console.error('Stop error:', error);
		}

		if (this.accumulatedTranscript.trim()) {
			this.processFinalTranscript(this.accumulatedTranscript);
			this.accumulatedTranscript = '';
		} else {
			this.clearLiveTranscript();
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
	}

	getRelevantDocs = () => this.unlockedDocs
		.filter(name => this.docContent[name])
		.map(name => ({ name, content: this.docContent[name] }));

	addMessage(text, type) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${type}`;
		messageDiv.textContent = text;
		this.messages.appendChild(messageDiv);
		this.messages.scrollTop = this.messages.scrollHeight;
	}
}

addEventListener('DOMContentLoaded', () => voiceChat = new VoiceChat());