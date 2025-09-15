export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { messages, contextDocs = [] } = req.body;

		// Build context from unlocked documents
		let documentContext = '';
		if (contextDocs.length > 0) {
			documentContext = '\n\nRELEVANT DOCUMENTATION:\n' +
				contextDocs.map(doc => `## ${doc.name}\n${doc.content}`).join('\n\n');
		}

		const systemPrompt = {
			role: 'system',
			content: `You're having a voice conversation about building AI-native tools that give people 10X capability.

CORE MISSION: 
1. Attract contributors (money, talent, audience)
2. Spread AI-native principles: Use AI to automate routine tasks + leverage AI for flow state thinking
3. Build tools that increase individual capability by 10X

${documentContext}

STAY FOCUSED: Every response should connect back to these three goals. Don't wander into abstract philosophy. Keep it practical - how do we get more capable individuals through AI-native workflows?

CRITICAL: Keep responses extremely short (1-2 sentences max). Ask questions that move toward contribution or capability building.`
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

		const data = await response.json();
		const aiResponse = data.choices[0].message.content;

		res.json({ response: aiResponse });

	} catch (error) {
		console.error('API Error:', error);
		res.status(500).json({ error: 'Failed to get AI response' });
	}
}