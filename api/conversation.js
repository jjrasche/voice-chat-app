import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { chatId, email, userName, jobTitle, messages, unlockedDocs } = req.body;

		if (!chatId) {
			return res.status(400).json({ error: 'Chat ID required' });
		}

		console.log('\n=== CONVERSATION SAVE ===');
		console.log('Chat ID:', chatId);
		console.log('Email:', email || 'none');
		console.log('User:', userName || 'unknown', '/', jobTitle || 'unknown');
		console.log('Messages:', messages.length);
		console.log('Unlocked docs:', unlockedDocs);

		// First, try to check if table exists with old schema
		try {
			const tableCheck = await sql`
				SELECT column_name 
				FROM information_schema.columns 
				WHERE table_name = 'conversations'
			`;

			const columns = tableCheck.rows.map(row => row.column_name);

			// If table exists but doesn't have chat_id column, drop it
			if (columns.length > 0 && !columns.includes('chat_id')) {
				console.log('[DB] Dropping old conversations table...');
				await sql`DROP TABLE IF EXISTS conversations`;
			}
		} catch (e) {
			// Table doesn't exist, that's fine
			console.log('[DB] No existing table found');
		}

		// Create table with new schema if it doesn't exist
		await sql`
			CREATE TABLE IF NOT EXISTS conversations (
				chat_id UUID PRIMARY KEY,
				email TEXT,
				user_name TEXT,
				job_title TEXT,
				messages JSONB NOT NULL,
				unlocked_docs TEXT[],
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			)
		`;

		// Upsert conversation - update if exists, insert if new
		await sql`
			INSERT INTO conversations (chat_id, email, user_name, job_title, messages, unlocked_docs)
			VALUES (${chatId}, ${email}, ${userName}, ${jobTitle}, ${JSON.stringify(messages)}, ${unlockedDocs})
			ON CONFLICT (chat_id) 
			DO UPDATE SET 
				email = COALESCE(EXCLUDED.email, conversations.email),
				user_name = COALESCE(EXCLUDED.user_name, conversations.user_name),
				job_title = COALESCE(EXCLUDED.job_title, conversations.job_title),
				messages = EXCLUDED.messages,
				unlocked_docs = EXCLUDED.unlocked_docs,
				updated_at = NOW()
		`;

		console.log('[DB] Conversation saved successfully');
		res.json({ success: true, message: 'Conversation saved' });

	} catch (error) {
		console.error('[DB ERROR]:', error.message);
		console.error('Full error:', error);
		res.status(500).json({ error: 'Failed to save conversation', details: error.message });
	}
}