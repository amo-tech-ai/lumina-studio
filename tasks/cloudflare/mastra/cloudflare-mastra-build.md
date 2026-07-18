Context Engineering: Building Intelligent AI Agents with Memory using Mastra on Cloudflare
Alex Fuentes
Alex Fuentes

Follow
8 min read
·
Oct 12, 2025





Press enter or click to view image in full size

Building Intelligent AI Agents with Memory using Mastra on Cloudflare
Everything is Context Engineering
In AI development, there’s a fundamental truth: everything is context engineering. Whether you’re crafting prompts, building RAG pipelines, or designing workflows — you’re managing the context window, the total information visible to your language model at any given time.

This is where Mastra excels — a comprehensive open-source framework that unifies agents, memory, workflows, and deployment infrastructure into one cohesive platform, purpose-built for Cloudflare’s edge.

What Makes Mastra Different?
Mastra isn’t another AI wrapper. It’s a complete production ecosystem featuring agents with tools and memory, state-machine workflows with human-in-the-loop capabilities, evaluation frameworks for non-deterministic outputs, integrated storage for RAG pipelines, and a local development playground with graph-based visualization.

What sets Mastra apart is its edge-first architecture. While most AI frameworks assume traditional cloud deployment, Mastra is designed from the ground up to leverage Cloudflare’s global edge network, bringing AI compute closer to users worldwide.

The Three Pillars of Context in Mastra
Mastra orchestrates context through three distinct components:

1. Message History
Recent messages (typically the last 10–20 exchanges) provide immediate conversational context. This is short-term memory — what was just said. Mastra’s lastMessages configuration lets you balance context richness against token costs.

2. Semantic Recall
This is Mastra’s superpower. Using vector embeddings, agents can search through entire conversation histories to find semantically relevant information from days or weeks ago. Unlike keyword search, semantic recall understands meaning — if a user asks “What was that restaurant I mentioned last month?” the agent finds it even with different words.

3. Working Memory
Structured, persistent knowledge about users — preferences, account details, ongoing projects — that survives across all conversations. This is the difference between remembering a conversation and remembering a person.

Mastra’s Memory Architecture: Threads and Resources
Every message in Mastra uses two identifiers:

threadId: Individual conversation sessions (like support_123). Each thread is a distinct conversation with clear boundaries.

resourceId: The persistent user identity (like user_123). One user can have multiple threads, all connected through their resource ID.

This architecture enables powerful patterns. You can isolate conversations while maintaining user-level context, scale across multiple conversations per user, query at thread or resource level, and share working memory across all user threads. A user might discuss different topics in separate threads, but their core preferences follow them everywhere.

Why Cloudflare + Mastra is Revolutionary
The combination of Mastra and Cloudflare creates something unprecedented in AI deployment:

Cloudflare D1: SQL at the Edge
D1 replicates your conversation data globally across 300+ cities. When a user in Tokyo sends a message, their conversation history loads from Tokyo’s edge — sub-10ms latency with zero cold starts. Traditional databases live in single regions, adding 100–300ms of latency for global users. D1 eliminates this entirely.

Cloudflare Vectorize: Edge-Native Vector Search
Most vector databases require separate infrastructure — you deploy your application in one place, your vector database in another. This adds latency and complexity. Vectorize runs alongside your code at the edge, making semantic search a native edge capability with microsecond queries. The embedding and indexing happen automatically when you store messages.

Cloudflare Workers: Global Compute Layer
Workers deploy your Mastra agents to 300+ cities automatically. A user in Tokyo hits Tokyo’s edge; a user in London hits London’s. This global distribution is transparent — you write code once, it runs everywhere. Sub-50ms cold starts mean agents are effectively always warm, and automatic scaling handles traffic from 10 to 10 million users without configuration.

Cloudflare Workers AI: The Complete Edge AI Stack
Mastra’s integration with Cloudflare extends beyond D1, Vectorize, and Workers. Cloudflare Workers AI completes the edge AI stack by bringing language models directly to the edge, eliminating external API calls entirely.

Workers AI provides access to popular open-source models like Llama, Mistral, and others running on Cloudflare’s global GPU infrastructure. Instead of sending requests to OpenAI or Anthropic (which adds latency and cost), you can run inference at the edge alongside your conversation data and vector search.

For use cases requiring lower latency, reduced costs, or data sovereignty, Workers AI transforms the architecture. Your entire AI stack — from conversation storage in D1, to vector search in Vectorize, to model inference in Workers AI — runs on Cloudflare’s edge. A user request in Tokyo is handled entirely by Tokyo’s edge location, with no data leaving the region.

This is particularly powerful for applications with strict data residency requirements or high-volume scenarios where API costs become significant. The combination of Mastra’s memory orchestration and Workers AI’s edge inference creates a truly distributed AI system that scales globally while maintaining single-digit millisecond latency.

The Economic Advantage
Cloudflare doesn’t charge egress fees between services. Your Workers query D1 and Vectorize millions of times without data transfer charges. For AI agents making frequent database and vector searches, this makes Cloudflare dramatically more economical than traditional clouds where egress fees often exceed compute costs.

How Memory Flows Through Mastra Agents
When a user sends a message, Mastra orchestrates a sophisticated context assembly in milliseconds:

First, thread identification determines if this is a new or existing conversation. Then working memory loads persistent user information — structured data about preferences, account details, and learned facts. Recent history fetches the last N messages for immediate context.

If semantic recall is enabled, Mastra embeds the user message and searches the vector store for relevant past messages. The search can be scoped to the current thread or across all user threads. For each relevant message found, surrounding messages provide context.

All sources — working memory, recent history, and semantically recalled messages — combine into a single context window with automatic deduplication. The assembled context flows to the language model, which generates a response with full awareness of recent conversation, relevant history, and persistent user knowledge.

Finally, the new messages are stored and embedded for future semantic recall. This entire orchestration is transparent — you simply call the agent’s generate method.

Mastra’s Production Feature Set
Beyond memory, Mastra provides complete production infrastructure:

Tools and Function Calling — Agents can invoke external functions for actions like looking up orders, creating tickets, checking inventory, or processing refunds. Tool calls are tracked in conversation history, maintaining consistency across interactions.

State-Machine Workflows — Build complex multi-step processes with human-in-the-loop capabilities. Workflows can suspend to wait for human approval, then resume when ready. Essential for processes requiring oversight like large refunds or sensitive account changes.

Evals for Quality Tracking — Since AI outputs aren’t deterministic, Mastra provides specialized evaluation tools. Define criteria like helpfulness, accuracy, and tone, then track quality metrics over time. Catch regressions when updating prompts or models.

Local Development Playground — A web interface showing how data flows through your system. Visualize which messages are recalled from semantic search, what working memory is active, and which tools are called. This visibility is invaluable during development.

Real-World Application: Customer Support at Scale
Consider a customer support agent built with Mastra on Cloudflare. When a customer contacts support from Singapore, the request hits Cloudflare’s Singapore edge. The agent loads conversation history from D1 Singapore in under 10ms. Semantic recall searches Vectorize Singapore for relevant past interactions. The entire context assembly happens at the edge, with no round trips to distant data centers.

Working memory captures structured information — contact preferences, account tier, known issues, resolution history — available in every conversation without customers repeating themselves. Semantic recall lets the agent reference past conversations: “I’m having the same problem as last month” triggers a search that finds and references that previous issue.

Tool integration allows the agent to look up order status, create tickets, and process refunds. The agent both answers questions and takes actions. As the relationship grows, the agent becomes more helpful — it knows the customer’s history, preferences, and patterns.

This runs globally with consistent sub-100ms response times and scales automatically from 10 to 10 million concurrent users. The economic model is predictable — you pay only for actual requests, with no egress fees for database access.

Best Practices for Production Deployment
Scope Strategy: Use thread scope for isolated conversations on distinct topics. Use resource scope when continuity matters — customer support, personal assistants, ongoing relationships. Resource scope lets the agent know everything about the user regardless of which conversation they’re currently in.

Memory Tuning: Start with lastMessages of 10–15 and adjust based on your use case. Monitor token usage and quality metrics. For semantic recall, topK of 3–5 typically provides the most important information without overwhelming context.

Working Memory Management: Define clear schemas guiding what should be captured. Update working memory when important information is shared, but avoid cluttering it with ephemeral details. Implement periodic reviews to keep information current.

Vector Hygiene: Implement cleanup strategies for old conversations. After six months or a year, archive history to cold storage and remove embeddings from active database. This keeps costs predictable and performance high.

Observability: Mastra’s built-in OpenTelemetry tracing captures agent invocations, tool calls, memory operations, token usage, and latency metrics. This provides comprehensive visibility into production behavior.

The Cloudflare Advantage for AI Agents
Traditional AI deployments face a fundamental tradeoff: you can have low latency (by running in specific regions) or global availability (by deploying worldwide), but achieving both is expensive and complex.

Cloudflare’s edge architecture eliminates this tradeoff. Your Mastra agent runs in 300+ cities automatically. D1 replicates conversation data globally. Vectorize distributes vector search worldwide. Every user, regardless of location, gets consistently low latency.

The serverless model means you never pay for idle capacity. Traditional deployments require maintaining servers in multiple regions, paying for capacity whether used or not. Cloudflare charges only for actual requests, making economics favorable for variable workloads.

The integrated platform eliminates glue code. D1, Vectorize, and Workers are designed to work together. You don’t write database connection managers, implement connection pooling, or handle service discovery. The platform handles infrastructure complexity.

The Future of Context Engineering
As AI systems mature, successful agents will remember user preferences across sessions, retrieve relevant information intelligently from long histories, maintain consistent personality and knowledge, scale efficiently across millions of users, and provide observability for debugging and optimization.

Mastra on Cloudflare delivers all of these capabilities today. The architecture scales from prototype to production without changes. As AI capabilities improve, Mastra’s design accommodates them naturally.

The age of stateless chatbots is over. The future belongs to agents that remember, learn, and grow with their users. Mastra and Cloudflare make building them straightforward and production-ready, with global edge deployment, predictable economics, and enterprise-grade reliability.