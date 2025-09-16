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
		this.hasVoiceSupport = false;

		// User tracking
		this.chatId = null;
		this.userName = null;
		this.jobTitle = null;
		this.userEmail = null;

		// Mobile speech recognition enhancements
		this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		this.restartAttempts = 0;
		this.maxRestartAttempts = 50;
		this.lastInterimTime = 0;

		this.documents = {
			'beliefs': {
				icon: '📚',
				label: 'Beliefs',
				unlockRules: [], // Always unlocked
				content: `# BELIEFS
* **Voice-first AI** creates frictionless interaction enabling flow where thoughts come easily and problems solve quickly
* **Individual capability** is the foundation of freedom - AI-native tools make people more capable and impactful
* **AI democratization** prevents inequality - allows have-nots to access what only the rich had before
* **Full utility requires trust** - you can't be intimate with tools owned by corporations extracting from you
* **Privacy and data ownership** must remain yours for the deep sharing needed to maximize impact`
			},
			'ai-native': {
				icon: '🤖',
				label: 'AI Native',
				unlockRules: ['ai native', 'ai tools', 'productivity', 'workflow'],
				content: `# AI-NATIVE
* **Being AI-native means** human creativity plus machine efficiency working in harmony
* **Reliable task automation** - hand routine work to agent AI to multiply your impact
* **Quick access to information** and quality inference on your exact working context keeps you in flow
* **Inference access** to your knowledge and context lets you flow longer and deeper than ever possible`
			},
			'community': {
				icon: '👥',
				label: 'Community',
				unlockRules: ['community', 'collaboration', 'consensus', 'collective'],
				content: `# COMMUNITY
* **More capable individuals** create more capable, flourishing communities
* **AI solves coordination** problems - consensus and connection issues that prevent collaboration
* **Reduces information overhead** while preserving essential human connection time
* **Informed populace** understands nuance and has tools for engagement and government accountability`
			},
			'flow-graph': {
				icon: '🧠',
				label: 'Flow Graph',
				unlockRules: ['knowledge', 'graph', 'flow', 'thinking'],
				content: `# FLOW-GRAPH
* **Flow state requires** frictionless access to your knowledge network and previous connections
* **Accessing previous ideas** enables deeper insights and faster problem-solving through atomic linking
* **AI-native tools create** knowledge graphs as byproducts - connections emerge from usage patterns
* **Connected knowledge** creates compound insights when context and history merge seamlessly`
			},
			'contribute': {
				icon: '🔨',
				label: 'Contribute',
				unlockRules: ['contribute', 'build', 'help', 'join'],
				content: `# CONTRIBUTE
* **Build freedom and equality** now by democratizing AI-native tools for everyone
* **Beta testers** - use tools daily, provide feedback on real workflows and pain points
* **Developers** - Chrome extensions, open source experience, modular design patterns welcome
* **Dreamers** - envision how AI-native society could heal from our current dysfunction
* **Patrons** - support affordable access to hardware, networks, and tool development`
			},
			'platform': {
				icon: '⚡',
				label: 'Platform',
				unlockRules: ['platform', 'technical', 'browser', 'open source'],
				content: `# PLATFORM
* **Browser-first** - Chrome provides universal, ever-present platform for AI tools
* **Affordable hardware** - Chrome OS devices make access economically viable for most people
* **Open source** ensures transparent, community-driven development and trust
* **Local models** when possible, cloud when needed, always with honest limitations
* **Distributed systems** - Chrome runtime enables seamless cross-context tool coordination`
			}
		};

		this.initElements();
		this.initChatId();
		this.checkVoiceSupport();
		this.initInterface();
		this.bindEvents();
		this.loadConversationFromStorage();
		this.loadInitialDocs();
		this.startProgressiveEngagement();
	}

	generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	initChatId() {
		this.chatId = localStorage.getItem('chatId');
		if (!this.chatId) {
			this.chatId = this.generateUUID();
			localStorage.setItem('chatId', this.chatId);
			console.log('New chat session:', this.chatId);
		}
	}

	initElements() {
		this.startBtn = document.getElementById('startBtn');
		this.textInputContainer = document.getElementById('textInputContainer');
		this.textInput = document.getElementById('textInput');
		this.sendTextBtn = document.getElementById('sendTextBtn');
		this.chatContainer = document.getElementById('chatContainer');
		this.messages = document.getElementById('messages');
		this.docsContent = document.getElementById('docsContent');
		this.docsSidebar = document.getElementById('docsSidebar');
	}

	checkVoiceSupport() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.hasVoiceSupport = !!SpeechRecognition;

		if (this.hasVoiceSupport) {
			this.initSpeech();
		}
	}

	initInterface() {
		if (this.hasVoiceSupport) {
			// Show voice button, hide text input
			this.startBtn.style.display = 'flex';
			this.textInputContainer.style.display = 'none';
		} else {
			// Hide voice button, show text input
			this.startBtn.style.display = 'none';
			this.textInputContainer.style.display = 'block';
		}
	}

	async loadInitialDocs() {
		this.renderSidebar();
		this.displayDoc('beliefs');
	}

	renderSidebar() {
		this.docsSidebar.innerHTML = this.availableDocs.map(docName => {
			const isUnlocked = this.unlockedDocs.includes(docName);
			const isActive = this.activeDoc === docName;
			const doc = this.documents[docName];
			return `
				<div class="doc-icon ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}" 
					 data-doc="${docName}" 
					 data-label="${doc.label}"
					 onclick="voiceChat.selectDoc('${docName}')">
					${doc.icon}
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
		const doc = this.documents[docName];
		if (!doc) return;

		this.docsContent.innerHTML = `
			<div class="doc-section${isNewlyUnlocked ? ' newly-unlocked' : ''}">
				${marked.parse(doc.content)}
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

		this.userEmail = email;
		localStorage.setItem('userEmail', email);
		await this.saveConversation();
		emailInput.parentElement.innerHTML = '<div style="color: #4ecdc4;">✅ Thanks! You\'re all set.</div>';
	}

	startProgressiveEngagement = () => {
		if (this.engagementStarted || this.engagementStopped) return;
		this.engagementStarted = true;

		setTimeout(() => {
			if (this.engagementStopped) return;
			this.showTypingIndicator();

			setTimeout(() => {
				if (this.engagementStopped) return;
				this.hideTypingIndicator();
				this.addMessage("Hi! I'm building AI-native tools to give people 10x capability. What's your name?", 'ai');

				setTimeout(() => {
					if (this.engagementStopped) return;
					this.showTypingIndicator();

					setTimeout(() => {
						if (this.engagementStopped) return;
						this.hideTypingIndicator();
						this.addMessage("What do you do for work? I'm curious where AI can help you most.", 'ai');

						setTimeout(() => {
							if (this.engagementStopped) return;
							this.showTypingIndicator();

							setTimeout(() => {
								if (this.engagementStopped) return;
								this.hideTypingIndicator();
								const instruction = this.hasVoiceSupport
									? "Just press and hold the microphone to start talking 🎤"
									: "Type your thoughts in the box below and hit send 💬";
								this.addMessage(instruction, 'ai');
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

	async saveConversation() {
		const messagesWithMetadata = this.conversationHistory.map(msg => ({
			role: msg.role,
			content: msg.content,
			metadata: msg.role === 'user'
				? { name: this.userName || null, job: this.jobTitle || null }
				: { name: 'AI' },
			timestamp: msg.timestamp || new Date().toISOString()
		}));

		try {
			await fetch('/api/conversation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chatId: this.chatId,
					email: this.userEmail,
					userName: this.userName,
					jobTitle: this.jobTitle,
					messages: messagesWithMetadata,
					unlockedDocs: this.unlockedDocs
				})
			});
		} catch (error) {
			console.error('Failed to save conversation:', error);
		}
	}

	saveConversationToStorage = () => {
		localStorage.setItem('chatHistory', JSON.stringify(this.conversationHistory));
		localStorage.setItem('unlockedDocs', JSON.stringify(this.unlockedDocs));
		localStorage.setItem('activeDoc', this.activeDoc);
		localStorage.setItem('userName', this.userName || '');
		localStorage.setItem('jobTitle', this.jobTitle || '');
	}

	loadConversationFromStorage = () => {
		const savedHistory = localStorage.getItem('chatHistory');
		const savedDocs = localStorage.getItem('unlockedDocs');
		const savedActiveDoc = localStorage.getItem('activeDoc');
		const savedEmail = localStorage.getItem('userEmail');
		const savedName = localStorage.getItem('userName');
		const savedJob = localStorage.getItem('jobTitle');

		if (savedHistory) {
			this.conversationHistory = JSON.parse(savedHistory);
			this.engagementStopped = true;
			this.conversationHistory.forEach(msg =>
				this.renderMessage(msg.content, msg.role === 'user' ? 'user' : 'ai')
			);
		}
		if (savedDocs) this.unlockedDocs = JSON.parse(savedDocs);
		if (savedActiveDoc && this.unlockedDocs.includes(savedActiveDoc)) {
			this.activeDoc = savedActiveDoc;
		}
		if (savedEmail) {
			this.userEmail = savedEmail;
			this.emailOffered = true;
		}
		if (savedName) this.userName = savedName;
		if (savedJob) this.jobTitle = savedJob;
	}

	resetEverything = () => {
		// Visual feedback
		const btn = this.hasVoiceSupport ? this.startBtn : this.sendTextBtn;
		const originalBg = btn.style.backgroundColor;
		btn.style.backgroundColor = '#ff3333';
		setTimeout(() => {
			btn.style.backgroundColor = originalBg;
		}, 500);

		// Clear all state
		localStorage.clear();
		this.conversationHistory = [];
		this.unlockedDocs = ['beliefs'];
		this.activeDoc = 'beliefs';
		this.userName = null;
		this.jobTitle = null;
		this.userEmail = null;
		this.engagementStarted = false;
		this.engagementStopped = false;

		// Generate new chat ID
		this.chatId = this.generateUUID();
		localStorage.setItem('chatId', this.chatId);

		// Clear UI
		this.messages.innerHTML = '';
		if (this.textInput) this.textInput.value = '';
		this.renderSidebar();
		this.displayDoc('beliefs');

		// Restart engagement
		this.startProgressiveEngagement();
		console.log('Reset complete. New chat:', this.chatId);
	}

	async checkForNewUnlocks(userMessage, aiResponse) {
		const conversationText = (userMessage + ' ' + aiResponse).toLowerCase();
		const newUnlocks = Object.entries(this.documents)
			.filter(([docName, doc]) =>
				!this.unlockedDocs.includes(docName) &&
				doc.unlockRules.some(keyword => conversationText.includes(keyword))
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
		await this.saveConversation();
	}

	showUnlockNotification = (docName) => {
		const notification = document.createElement('div');
		notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #4ecdc4; color: #1a1a1a; padding: 1rem; border-radius: 8px; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease-out;`;
		notification.textContent = `🔓 Unlocked: ${this.documents[docName].label}`;
		document.body.appendChild(notification);
		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	// Speech recognition methods
	initSpeech() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognition();
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
				case 'aborted':
					if (this.isListening) {
						setTimeout(() => {
							if (this.isListening && this.restartAttempts < this.maxRestartAttempts) {
								try {
									this.restartAttempts++;
									this.recognition.start();
								} catch (err) {
									this.stopListening();
								}
							}
						}, 500);
					}
					break;
				case 'no-speech':
					break;
				case 'network':
				case 'not-allowed':
					console.error(`Speech error: ${e.error}`);
					this.stopListening();
					break;
				default:
					if (this.isListening && this.restartAttempts < this.maxRestartAttempts) {
						setTimeout(() => {
							if (this.isListening) {
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

		const fullText = this.accumulatedTranscript + interimTranscript;
		if (fullText.trim()) {
			this.updateLiveTranscript(fullText, !!interimTranscript.trim());
		}
	}

	updateLiveTranscript = (text, isLive) => {
		let liveElement = document.getElementById('liveTranscript');

		if (!liveElement) {
			liveElement = document.createElement('div');
			liveElement.id = 'liveTranscript';
			liveElement.className = 'live-transcript';
			this.messages.appendChild(liveElement);
		}

		liveElement.innerHTML = text + (isLive ? '<span class="transcript-cursor">|</span>' : '');
		this.messages.scrollTop = this.messages.scrollHeight;
	}

	clearLiveTranscript = () => {
		const liveElement = document.getElementById('liveTranscript');
		if (liveElement) liveElement.remove();
	}

	processFinalTranscript = (transcript) => {
		if (!transcript.trim()) return;
		this.clearLiveTranscript();
		this.addMessage(transcript, 'user');
		this.stopListening();
		this.sendToAI(transcript);
	}

	// Text input methods
	sendTextMessage = () => {
		const message = this.textInput.value.trim();
		if (!message) return;

		// Visual feedback
		this.sendTextBtn.textContent = '✓';
		this.sendTextBtn.style.background = '#4CAF50';
		this.sendTextBtn.disabled = true;

		setTimeout(() => {
			this.textInput.value = '';
			this.sendTextBtn.textContent = 'Send';
			this.sendTextBtn.style.background = '';
			this.sendTextBtn.disabled = false;

			this.addMessage(message, 'user');
			this.sendToAI(message);
		}, 200);
	}

	bindEvents = () => {
		// Text input events
		if (this.textInput && this.sendTextBtn) {
			this.sendTextBtn.addEventListener('click', this.sendTextMessage);

			this.textInput.addEventListener('keydown', (e) => {
				if (e.ctrlKey && e.key === 'Enter') {
					e.preventDefault();
					this.sendTextMessage();
				}
			});

			// Auto-resize textarea
			this.textInput.addEventListener('input', () => {
				this.textInput.style.height = 'auto';
				this.textInput.style.height = Math.min(this.textInput.scrollHeight, 120) + 'px';
			});
		}

		// Voice button events (only if voice is supported)
		if (this.hasVoiceSupport && this.startBtn) {
			let pressTimer = null;
			let longPressTriggered = false;
			let isPressed = false;

			const handlePressStart = (e) => {
				if (isPressed) return;
				isPressed = true;
				longPressTriggered = false;
				pressTimer = setTimeout(() => {
					longPressTriggered = true;
					this.resetEverything();
				}, 3000);
			};

			const handlePressEnd = (e) => {
				if (!isPressed) return;
				isPressed = false;
				clearTimeout(pressTimer);
				pressTimer = null;

				if (!longPressTriggered) {
					if (e.type.startsWith('touch')) {
						e.preventDefault();
					}
					setTimeout(() => this.toggleListening(), 10);
				}
			};

			// Mouse events for desktop
			if (!this.isMobile) {
				this.startBtn.addEventListener('mousedown', handlePressStart);
				this.startBtn.addEventListener('mouseup', handlePressEnd);
				this.startBtn.addEventListener('mouseleave', handlePressEnd);
			}

			// Touch events for mobile
			if (this.isMobile) {
				this.startBtn.addEventListener('touchstart', handlePressStart, { passive: false });
				this.startBtn.addEventListener('touchend', handlePressEnd, { passive: false });
				this.startBtn.addEventListener('touchcancel', handlePressEnd, { passive: false });
				this.startBtn.addEventListener('click', (e) => e.preventDefault());
			}
		}
	}

	toggleListening = () => {
		if (!this.recognition) return;
		this.engagementStopped = true;
		this.hideTypingIndicator();
		this.isListening ? this.stopListening() : this.startListening();
	}

	startListening() {
		if (this.isListening || !this.recognition) return;

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
		if (!this.isListening || !this.recognition) return;

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

	async extractUserInfo() {
		if (this.userName && this.jobTitle) return;
		if (this.conversationHistory.length < 2) return;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: this.conversationHistory,
					extractNameJob: true,
					chatId: this.chatId
				})
			});

			const { extraction } = await response.json();
			if (extraction) {
				if (extraction.userName && !this.userName) {
					this.userName = extraction.userName;
					console.log('Extracted name:', this.userName);
				}
				if (extraction.jobTitle && !this.jobTitle) {
					this.jobTitle = extraction.jobTitle;
					console.log('Extracted job:', this.jobTitle);
				}
				this.saveConversationToStorage();
				await this.saveConversation();
			}
		} catch (error) {
			console.error('Failed to extract user info:', error);
		}
	}

	async sendToAI(message) {
		this.engagementStopped = true;
		this.showTypingIndicator();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: this.conversationHistory,
					contextDocs: this.getAllDocs(),
					chatId: this.chatId
				})
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data = await response.json();

			if (data.error) {
				console.error('API Error:', data.error, data.details);
				throw new Error(data.error);
			}

			const aiResponse = data.response;
			if (!aiResponse) {
				throw new Error('No response from AI');
			}

			this.hideTypingIndicator();
			this.addMessage(aiResponse, 'ai');

			await this.checkForNewUnlocks(message, aiResponse);
			await this.extractUserInfo();
			await this.saveConversation();
		} catch (error) {
			console.error('Error in sendToAI:', error);
			this.hideTypingIndicator();
			this.addMessage('Sorry, I\'m having trouble connecting right now. Please try again.', 'ai');
		}
	}

	getAllDocs = () => Object.entries(this.documents)
		.map(([name, doc]) => ({ name, content: doc.content }));

	addMessage(text, type) {
		const timestamp = new Date().toISOString();
		const role = type === 'user' ? 'user' : 'assistant';
		this.conversationHistory.push({ role, content: text, timestamp });
		this.renderMessage(text, type);
		this.saveConversationToStorage();
	}

	renderMessage(text, type) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${type}`;
		messageDiv.textContent = text;
		this.messages.appendChild(messageDiv);
		this.messages.scrollTop = this.messages.scrollHeight;
	}
}

addEventListener('DOMContentLoaded', () => voiceChat = new VoiceChat());