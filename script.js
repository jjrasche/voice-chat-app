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
		this.initSpeech();
		this.bindEvents();
		this.loadConversationFromStorage();
		this.loadInitialDocs();
		this.startProgressiveEngagement();
	}

	showBrowserWarning() {
		const warningDiv = document.createElement('div');
		warningDiv.className = 'message ai';
		warningDiv.style.background = '#ff6b6b';
		warningDiv.innerHTML = `
			<div>⚠️ Speech recognition is not supported in Firefox.</div>
			<div style="font-size: 0.9rem; margin-top: 0.5rem;">Please use Chrome, Edge, or Safari for voice features.</div>
		`;
		this.messages.appendChild(warningDiv);
		this.startBtn.style.display = 'none';
	}

	// Generate UUID for chat tracking
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

		// Save to backend with conversation
		await this.saveConversation();

		emailInput.parentElement.innerHTML = '<div style="color: #4ecdc4;">✅ Thanks! You\'re all set.</div>';
	}

	startProgressiveEngagement = () => {
		if (this.engagementStarted || this.engagementStopped) return;
		this.engagementStarted = true;

		// Modified to ask for name and role
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
								this.addMessage("Just press and hold the microphone to start talking 🎤", 'ai');
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
		// Build messages with metadata
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
		// Show confirmation effect
		this.startBtn.style.backgroundColor = '#ff3333';
		setTimeout(() => {
			this.startBtn.style.backgroundColor = '';
		}, 500);

		// Clear all state
		localStorage.clear();

		// Reset instance variables
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
		await this.saveConversation(); // Save unlock state
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
		// Check for both standard and webkit-prefixed API
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognition) {
			// Show Firefox/unsupported browser message
			this.showBrowserWarning();
			return;
		}

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

		// COMMENTED OUT AUTO-SEND ON PAUSE
		// if (interimTranscript.trim()) {
		// 	this.lastInterimTime = Date.now();
		// 	clearTimeout(this.pauseTimer);
		// 	const liveElement = document.getElementById('liveTranscript');
		// 	if (liveElement) {
		// 		liveElement.classList.remove('countdown');
		// 	}
		// } else if (this.accumulatedTranscript.trim()) {
		// 	this.startPauseDetection();
		// }
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

	// COMMENTED OUT - NO AUTO-SEND
	// startPauseDetection = () => {
	// 	clearTimeout(this.pauseTimer);
	// 	this.pauseTimer = setTimeout(() => {
	// 		const timeSinceLastInterim = Date.now() - this.lastInterimTime;
	// 		if (timeSinceLastInterim > 1500) {
	// 			this.startCountdown();
	// 		} else {
	// 			this.startPauseDetection();
	// 		}
	// 	}, 500);
	// }

	// startCountdown = () => {
	// 	const liveElement = document.getElementById('liveTranscript');
	// 	if (liveElement) {
	// 		liveElement.classList.add('countdown');
	// 	}
	// 	let seconds = 5;
	// 	const countdownTick = () => {
	// 		seconds--;
	// 		if (seconds > 0) {
	// 			this.pauseTimer = setTimeout(countdownTick, 1000);
	// 		} else {
	// 			this.handlePauseComplete();
	// 		}
	// 	};
	// 	this.pauseTimer = setTimeout(countdownTick, 1000);
	// }

	// handlePauseComplete = () => {
	// 	if (!this.accumulatedTranscript.trim()) return;
	// 	const liveElement = document.getElementById('liveTranscript');
	// 	if (liveElement) {
	// 		liveElement.classList.remove('countdown');
	// 	}
	// 	const transcript = this.accumulatedTranscript;
	// 	this.accumulatedTranscript = '';
	// 	this.processFinalTranscript(transcript);
	// }

	processFinalTranscript = (transcript) => {
		if (!transcript.trim()) return;
		this.clearLiveTranscript();
		this.addMessage(transcript, 'user');
		this.stopListening();
		this.sendToAI(transcript);
	}

	bindEvents = () => {
		let pressTimer = null;
		let longPressTriggered = false;
		let touchHandled = false; // Prevent double events

		const handlePressStart = (e) => {
			longPressTriggered = false;
			touchHandled = false;
			pressTimer = setTimeout(() => {
				longPressTriggered = true;
				touchHandled = true;
				this.resetEverything();
			}, 3000);
		};

		const handlePressEnd = (e) => {
			clearTimeout(pressTimer);
			pressTimer = null;

			if (!longPressTriggered && !touchHandled) {
				touchHandled = true;
				// Prevent default to stop click event on mobile
				if (e.type.startsWith('touch')) {
					e.preventDefault();
				}
				setTimeout(() => this.toggleListening(), 10);
			}
		};

		// Mouse events for desktop only
		if (!this.isMobile) {
			this.startBtn.addEventListener('mousedown', handlePressStart);
			this.startBtn.addEventListener('mouseup', handlePressEnd);
			this.startBtn.addEventListener('mouseleave', handlePressEnd);
		}

		// Touch events for mobile - prevent click events
		if (this.isMobile) {
			this.startBtn.addEventListener('touchstart', handlePressStart, { passive: false });
			this.startBtn.addEventListener('touchend', handlePressEnd, { passive: false });
			this.startBtn.addEventListener('touchcancel', handlePressEnd, { passive: false });
		}
	}

	toggleListening = () => {
		// Don't allow if speech recognition not available
		if (!this.recognition) {
			console.log('Speech recognition not available');
			return;
		}

		this.engagementStopped = true;
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

	async extractUserInfo() {
		// Only extract if we don't have both name and job
		if (this.userName && this.jobTitle) return;

		// Only extract if we have enough conversation
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

	async sendToAI(transcript) {
		this.showTypingIndicator();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: this.conversationHistory,
					contextDocs: this.getAllDocs(), // Send ALL docs now
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

			// Check for unlocks and extract user info
			await this.checkForNewUnlocks(transcript, aiResponse);
			await this.extractUserInfo();

			// Save conversation after each exchange
			await this.saveConversation();
		} catch (error) {
			console.error('Error in sendToAI:', error);
			this.hideTypingIndicator();
			this.addMessage('Sorry, I\'m having trouble connecting right now. Please try again.', 'ai');
		}
	}

	// Changed to return ALL documents for context
	getAllDocs = () => Object.entries(this.documents)
		.map(([name, doc]) => ({ name, content: doc.content }));

	// Deprecated but kept for backwards compatibility
	getRelevantDocs = () => this.getAllDocs();

	addMessage(text, type) {
		const timestamp = new Date().toISOString();
		const role = type === 'user' ? 'user' : 'assistant';

		// Add to conversation history with timestamp
		this.conversationHistory.push({ role, content: text, timestamp });

		// Add to UI
		this.renderMessage(text, type);

		// Save to storage
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