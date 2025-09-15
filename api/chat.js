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
			content: `You're having a casual voice conversation with someone about building AI tools that increase individual capability. 

${documentContext}

CRITICAL: Keep responses extremely short (1-2 sentences max). Talk like you're chatting with a friend, not giving a presentation. Ask questions back rather than explaining everything. Be curious about their thoughts.`
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