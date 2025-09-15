import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { doc } = req.query;

		if (!doc) {
			return res.status(400).json({ error: 'Document name required' });
		}

		// Security: only allow alphanumeric and hyphens
		if (!/^[a-zA-Z0-9-]+$/.test(doc)) {
			return res.status(400).json({ error: 'Invalid document name' });
		}

		const docPath = join(process.cwd(), 'docs', `${doc}.md`);

		try {
			const content = readFileSync(docPath, 'utf-8');

			// Extract title from first # heading or use filename
			const titleMatch = content.match(/^# (.+)$/m);
			const title = titleMatch ? titleMatch[1] : doc.charAt(0).toUpperCase() + doc.slice(1);

			res.json({
				name: doc,
				title: title,
				content: content
			});

		} catch (fileError) {
			res.status(404).json({ error: 'Document not found' });
		}

	} catch (error) {
		console.error('Docs API Error:', error);
		res.status(500).json({ error: 'Failed to load document' });
	}
}