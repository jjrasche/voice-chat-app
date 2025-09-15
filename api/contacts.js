import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { email, chatHistory, unlockedDocs } = req.body;

		if (!email || !email.includes('@')) {
			return res.status(400).json({ error: 'Valid email required' });
		}

		// Create table if it doesn't exist
		await sql`
			CREATE TABLE IF NOT EXISTS conversations (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				email TEXT NOT NULL,
				chat_history JSONB NOT NULL,
				unlocked_docs TEXT[] NOT NULL,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`;

		// Insert conversation
		await sql`
			INSERT INTO conversations (email, chat_history, unlocked_docs)
			VALUES (${email}, ${JSON.stringify(chatHistory)}, ${unlockedDocs})
		`;

		res.json({ success: true, message: 'Contact saved successfully' });

	} catch (error) {
		console.error('Contact API Error:', error);
		res.status(500).json({ error: 'Failed to save contact' });
	}
}