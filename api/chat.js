export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Check for API key
		if (!process.env.GROQ_API_KEY) {
			console.error('[ERROR]: GROQ_API_KEY not set in environment variables');
			return res.status(500).json({
				error: 'AI service not configured',
				details: 'Missing API key'
			});
		}

		const { messages, contextDocs = [], extractNameJob = false, chatId } = req.body;

		// Build context from ALL documents (not just unlocked)
		let documentContext = '';
		if (contextDocs.length > 0) {
			documentContext = '\n\nRELEVANT DOCUMENTATION:\n' +
				contextDocs.map(doc => `## ${doc.name}\n${doc.content}`).join('\n\n');
		}

		// If extraction requested, use special extraction prompt
		if (extractNameJob && messages.length > 0) {
			const extractionPrompt = {
				role: 'system',
				content: `Extract the user's first name and job title from the conversation.
				Return ONLY a JSON object in this exact format:
				{"userName": "FirstName", "jobTitle": "Their Job Title"}
				
				If not found, use null for missing values.
				If they mention what they do but not a formal title, infer an appropriate job title.`
			};

			const extractResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'llama-3.1-8b-instant',
					messages: [extractionPrompt, ...messages],
					temperature: 0.1,
					max_tokens: 100
				})
			});

			if (!extractResponse.ok) {
				console.log('[EXTRACTION ERROR]: HTTP', extractResponse.status);
				return res.json({ extraction: { userName: null, jobTitle: null } });
			}

			const extractData = await extractResponse.json();

			// Check if response has expected structure
			if (extractData.choices && extractData.choices[0] && extractData.choices[0].message) {
				try {
					const content = extractData.choices[0].message.content;
					console.log('[EXTRACTION RAW]:', content);
					const extracted = JSON.parse(content);
					console.log('[EXTRACTION SUCCESS]:', extracted);
					return res.json({ extraction: extracted });
				} catch (e) {
					console.log('[EXTRACTION PARSE ERROR]:', e.message);
					console.log('[EXTRACTION CONTENT]:', extractData.choices[0].message.content);
					return res.json({ extraction: { userName: null, jobTitle: null } });
				}
			} else {
				console.log('[EXTRACTION ERROR]: Invalid response structure');
				console.log('[EXTRACTION RESPONSE]:', JSON.stringify(extractData));
				return res.json({ extraction: { userName: null, jobTitle: null } });
			}
		}

		// Log the full context being sent
		console.log('\n=== CHAT REQUEST ===');
		console.log('Chat ID:', chatId);
		console.log('Messages count:', messages.length);
		console.log('Documents included:', contextDocs.map(d => d.name).join(', '));
		console.log('Context size:', documentContext.length, 'chars');

		// Normal conversation flow
		const systemPrompt = {
			role: 'system',
			content: `You're having a voice conversation about building AI-native tools that give people 10X capability.

CORE MISSION: 
1. Attract contributors (money, talent, audience)
2. Spread AI-native principles: Use AI to automate routine tasks + leverage AI for flow state thinking
3. Build tools that increase individual capability by 10X

${documentContext}

CONVERSATION CONTEXT:
- Chat ID: ${chatId}
- This is a continuous conversation, maintain context from previous messages

STAY FOCUSED: Every response should connect back to these three goals. Don't wander into abstract philosophy. Keep it practical - how do we get more capable individuals through AI-native workflows?

CRITICAL: Keep responses extremely short (1-2 sentences max). Ask questions that move toward contribution or capability building.

If the user shares their name or job/role, acknowledge it naturally but stay focused on the mission.`
		};

		const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'llama-3.1-8b-instant',
				messages: [systemPrompt, ...messages],
				temperature: 0.7,
				max_tokens: 150
			})
		});

		if (!response.ok) {
			console.error('[API ERROR]: HTTP', response.status);
			console.error('[API ERROR]: Status Text:', response.statusText);
			return res.status(500).json({
				error: 'AI service unavailable',
				details: `HTTP ${response.status}`
			});
		}

		const data = await response.json();

		// Check response structure
		if (!data.choices || !data.choices[0] || !data.choices[0].message) {
			console.error('[API ERROR]: Invalid response structure:', JSON.stringify(data));
			return res.status(500).json({
				error: 'Invalid AI response',
				details: 'Unexpected response format'
			});
		}

		const aiResponse = data.choices[0].message.content;

		console.log('[AI RESPONSE]:', aiResponse.substring(0, 100) + '...');
		res.json({ response: aiResponse });

	} catch (error) {
		console.error('[CRITICAL API ERROR]:', error.message);
		console.error('[ERROR STACK]:', error.stack);
		res.status(500).json({
			error: 'Failed to process request',
			details: error.message
		});
	}
}