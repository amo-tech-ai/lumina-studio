---
name: memory-management
description: Two-tier memory system that makes Claude a true workplace collaborator. Decodes shorthand, acronyms, nicknames, and internal language so Claude understands requests like a colleague would. CLAUDE.md for working memory, memory/ directory for the full knowledge base.
metadata:
  priority: 2
---

# Memory Management

Two-tier memory system for project knowledge.

## Tier 1: CLAUDE.md (Working Memory)
- Project conventions, commands, architecture
- Active context — what's being worked on now
- Key decisions and rationale
- Updated each session

## Tier 2: memory/ directory (Knowledge Base)
- Detailed reference docs
- Historical decisions and trade-offs
- Persona definitions
- Process documentation
- External integrations

## Idiom Decoding

Maintain a glossary of project-specific shorthand:
- Acronyms (IPI, PLT, COM, DNA, AIOR)
- Internal nicknames for services, repos, features
- Domain-specific terminology

## Maintenance

| Frequency | Action |
|-----------|--------|
| Each session | Update CLAUDE.md working memory |
| Weekly | Review memory/ for stale entries |
| On decision | Document rationale in memory/ |
| On discovery | Add new shorthand to glossary |
