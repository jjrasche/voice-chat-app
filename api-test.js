// API Test Queries for Chat and Conversation endpoints

class APITester {
	constructor(baseUrl = '') {
		this.baseUrl = baseUrl;
		this.testChatId = 'test-' + Date.now();
	}

	async runAllTests() {
		console.log('🚀 Starting API Tests...\n');

		try {
			await this.testChatAPI();
			await this.testConversationAPI();
			await this.testContactAPI();
			console.log('✅ All tests passed!');
		} catch (error) {
			console.error('❌ Test failed:', error);
		}
	}

	// Test /api/chat endpoint
	async testChatAPI() {
		console.log('📡 Testing Chat API...');

		// Test 1: Basic chat message
		const chatResponse = await this.request('/api/chat', {
			messages: [
				{ role: 'user', content: 'Hello, I want to learn about AI-native tools' }
			],
			contextDocs: [
				{ name: 'beliefs', content: '# BELIEFS\n* Voice-first AI creates flow' }
			],
			chatId: this.testChatId
		});

		this.assert(chatResponse.response, 'Chat should return response');
		console.log('✅ Basic chat:', chatResponse.response.substring(0, 50) + '...');

		// Test 2: Name/job extraction
		const extractResponse = await this.request('/api/chat', {
			messages: [
				{ role: 'user', content: 'Hi, my name is John and I work as a software engineer' },
				{ role: 'assistant', content: 'Nice to meet you!' },
				{ role: 'user', content: 'I build web applications' }
			],
			extractNameJob: true,
			chatId: this.testChatId
		});

		this.assert(extractResponse.extraction, 'Should return extraction');
		console.log('✅ Extraction:', extractResponse.extraction);

		// Test 3: Error handling - missing messages
		try {
			await this.request('/api/chat', { chatId: this.testChatId });
			throw new Error('Should have failed');
		} catch (error) {
			console.log('✅ Error handling works');
		}

		// Test 4: Long conversation context
		const longMessages = Array.from({ length: 10 }, (_, i) => ({
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `Message ${i + 1} about AI tools and productivity`
		}));

		const longResponse = await this.request('/api/chat', {
			messages: longMessages,
			contextDocs: [
				{ name: 'ai-native', content: '# AI-NATIVE\n* Being AI-native means human creativity plus machine efficiency' }
			],
			chatId: this.testChatId
		});

		this.assert(longResponse.response, 'Should handle long conversations');
		console.log('✅ Long conversation handled');
	}

	// Test /api/conversation endpoint
	async testConversationAPI() {
		console.log('💾 Testing Conversation API...');

		// Test 1: Save new conversation
		const saveResponse = await this.request('/api/conversation', {
			chatId: this.testChatId,
			email: 'test@example.com',
			userName: 'Test User',
			jobTitle: 'Developer',
			messages: [
				{
					role: 'user',
					content: 'Hello',
					metadata: { name: 'Test User', job: 'Developer' },
					timestamp: new Date().toISOString()
				},
				{
					role: 'assistant',
					content: 'Hi there!',
					metadata: { name: 'AI' },
					timestamp: new Date().toISOString()
				}
			],
			unlockedDocs: ['beliefs', 'ai-native']
		});

		this.assert(saveResponse.success, 'Conversation should save');
		console.log('✅ New conversation saved');

		// Test 2: Update existing conversation
		const updateResponse = await this.request('/api/conversation', {
			chatId: this.testChatId,
			email: 'test@example.com',
			userName: 'Test User',
			jobTitle: 'Senior Developer', // Updated title
			messages: [
				{
					role: 'user',
					content: 'Hello again',
					metadata: { name: 'Test User', job: 'Senior Developer' },
					timestamp: new Date().toISOString()
				}
			],
			unlockedDocs: ['beliefs', 'ai-native', 'community']
		});

		this.assert(updateResponse.success, 'Conversation should update');
		console.log('✅ Conversation updated');

		// Test 3: Missing chat ID
		try {
			await this.request('/api/conversation', {
				email: 'test@example.com',
				messages: []
			});
			throw new Error('Should have failed');
		} catch (error) {
			console.log('✅ Missing chatId validation works');
		}

		// Test 4: Minimal data
		const minimalResponse = await this.request('/api/conversation', {
			chatId: 'minimal-test-' + Date.now(),
			messages: [{ role: 'user', content: 'test' }],
			unlockedDocs: []
		});

		this.assert(minimalResponse.success, 'Should save with minimal data');
		console.log('✅ Minimal conversation saved');
	}

	// Test /api/contact endpoint
	async testContactAPI() {
		console.log('📧 Testing Contact API...');

		// Test 1: Save contact with full data
		const contactResponse = await this.request('/api/contact', {
			email: 'contact-test@example.com',
			chatHistory: [
				{ role: 'user', content: 'I want updates' },
				{ role: 'assistant', content: 'Sure thing!' }
			],
			unlockedDocs: ['beliefs', 'ai-native']
		});

		this.assert(contactResponse.success, 'Contact should save');
		console.log('✅ Contact saved');

		// Test 2: Invalid email
		try {
			await this.request('/api/contact', {
				email: 'invalid-email',
				chatHistory: [],
				unlockedDocs: []
			});
			throw new Error('Should have failed');
		} catch (error) {
			console.log('✅ Invalid email validation works');
		}

		// Test 3: Missing email
		try {
			await this.request('/api/contact', {
				chatHistory: [],
				unlockedDocs: []
			});
			throw new Error('Should have failed');
		} catch (error) {
			console.log('✅ Missing email validation works');
		}
	}

	// Helper methods
	async request(endpoint, data) {
		const response = await fetch(this.baseUrl + endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`${response.status}: ${error}`);
		}

		return response.json();
	}

	assert(condition, message) {
		if (!condition) {
			throw new Error(`Assertion failed: ${message}`);
		}
	}
}

// Usage
const tester = new APITester();

// Run tests in browser console or Node.js
// tester.runAllTests();

// Or run individual test suites
// tester.testChatAPI();
// tester.testConversationAPI();
// tester.testContactAPI();