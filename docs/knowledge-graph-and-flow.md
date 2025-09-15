# Knowledge Graph & Flow Interface

## Core Approach

Personal knowledge management should work through curated connections rather than search-and-retrieve. Instead of storing documents to search through later, capture atomic ideas and organize them into purpose-driven collections that provide focused context for thinking.

## Thought Spaces

Thought Spaces are curated collections of atomic ideas organized around a specific thinking purpose. They contain included ideas (relevant to your current thinking), excluded ideas (explicitly rejected as not relevant), and a clear purpose statement describing what you're trying to accomplish.

When you're working on a problem, you create a thought space with that purpose, then curate atomic ideas into it. The system suggests relevant ideas from your knowledge graph, and you decide what to include or exclude. This curation process creates focused context that's immediately applicable to your current thinking.

## Atomic Ideas and Curation

Atomic ideas are single concepts extracted from sources - books, conversations, articles, or thoughts. Each idea stands alone and can be connected to multiple thought spaces. The curation process involves selecting relevant text spans from sources, then creating atomic ideas from those spans.

This manual curation serves two purposes: it creates immediately useful context for your current thinking, and it generates training data for future automation. Each time you select a text span or create an atomic idea, you're teaching the system to recognize what's relevant and how to extract useful concepts.

## Knowledge Connections

Ideas connect to each other through shared concepts, similar contexts, or explicit linking. These connections enable discovery - finding related ideas you might not have remembered. The graph structure emerges naturally from how you actually think about and connect concepts, rather than imposed categories or hierarchies.

## Training Data Collection

Manual curation captures patterns in how you identify relevant information and create useful abstractions. When you select text spans, you're creating training data for span detection. When you create atomic ideas from spans, you're creating training data for idea generation. Successful thought space curation shows which ideas work well together for specific purposes.
