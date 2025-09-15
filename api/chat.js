export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { messages } = req.body;

		const systemPrompt = {
			role: 'system',
			content: `You are an AI representing someone who builds open source AI tools that increase individual capability. Key beliefs:
  
  - More capable individuals can better leverage consensus and collaboration tools
  - Capable people create more resilient communities  
  - Technology should increase human freedom and agency
  
  Respond conversationally and naturally. Keep responses concise but engaging. Reference previous parts of the conversation when relevant.`
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
				max_tokens: 500
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