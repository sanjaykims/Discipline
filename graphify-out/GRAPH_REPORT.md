# Graph Report - discipline  (2026-09-19)

## Corpus Check
- Corpus is ~17,676 words - fits in a single context window. You may not need a graph.

## Summary
- 207 nodes · 222 edges · 42 communities (14 shown, 28 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Habits Page Component
- Package Scripts & Metadata
- Workout Page Component
- Graphify Add & Watch Docs
- TypeScript Config
- Next.js App Layout & Config
- Dev Dependencies
- Graphify Extraction Pipeline
- Habits Page Handlers
- Runtime Dependencies
- Today Page Actions
- Graphify Multi-Repo Merge
- Graphify Self-Improvement Loop
- Graphify Clustering & Analysis
- App Branding Concept
- Next.js Env Types
- Habits & Completions Schema
- Habit Weekly Overrides Schema
- Graphify Edge Types
- Graphify Query Traversal Modes
- Graphify Audio Transcription
- PostCSS Config
- Workout Logs Schema
- FalkorDB Export
- GraphML Export
- MCP Server Export
- Neo4j Export
- SVG Export
- Token Reduction Benchmark
- Node Explain Command
- Shortest Path Command
- Query Vocab Expansion
- Completions Table
- Completions Table (Public Schema)
- Apple Touch Icon
- PWA Icon 192px
- PWA Icon 512px
- App Apple Touch Icon
- App Favicon
- Habits Table

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `WorkoutPage()` - 10 edges
3. `graphify SKILL.md (full pipeline)` - 10 edges
4. `HabitsPage()` - 7 edges
5. `mixColor()` - 6 edges
6. `graphify project-rules section` - 6 edges
7. `scripts` - 5 edges
8. `next` - 5 edges
9. `react` - 5 edges
10. `supabase` - 5 edges

## Surprising Connections (you probably didn't know these)
- `graphify project-rules section` --conceptually_related_to--> `graphify (knowledge graph tool)`  [INFERRED]
  CLAUDE.md → .claude/skills/graphify/SKILL.md
- `graphify project-rules section` --references--> `graphify export wiki`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/references/exports.md
- `graphify claude install (native CLAUDE.md integration)` --references--> `graphify project-rules section`  [EXTRACTED]
  .claude/skills/graphify/references/hooks.md → CLAUDE.md
- `graphify SKILL.md (full pipeline)` --references--> `reference: extraction subagent prompt`  [EXTRACTED]
  .claude/skills/graphify/SKILL.md → .claude/skills/graphify/references/extraction-spec.md
- `reference: commit hook and native CLAUDE.md integration` --references--> `project CLAUDE.md (graphify integration)`  [EXTRACTED]
  .claude/skills/graphify/references/hooks.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Structural + semantic extraction merge pipeline** — claude_skills_graphify_skill_structural_extraction, claude_skills_graphify_skill_semantic_extraction, claude_skills_graphify_references_extraction_spec_node_id_format [EXTRACTED 0.90]
- **Self-improving work-memory / freshness loop** — claude_skills_graphify_references_query_save_result, claude_skills_graphify_references_query_lessons_md, claude_skills_graphify_references_hooks_post_commit_hook [EXTRACTED 0.85]
- **Cross-repo clone-and-merge flow** — claude_skills_graphify_references_github_and_merge_clone_repo, claude_skills_graphify_references_github_and_merge_merge_graphs, claude_skills_graphify_references_github_and_merge_monorepo_flow [EXTRACTED 0.85]

## Communities (42 total, 28 thin omitted)

### Community 0 - "Habits Page Component"
Cohesion: 0.14
Nodes (20): date-fns, react, @supabase/supabase-js, COLORS, EMPTY, FormState, ICONS, WeekCompletion (+12 more)

### Community 1 - "Package Scripts & Metadata"
Cohesion: 0.09
Nodes (20): name, private, scripts, build, dev, lint, start, version (+12 more)

### Community 2 - "Workout Page Component"
Cohesion: 0.15
Nodes (16): textColor(), todayStr(), WorkoutPage(), fetchLogs(), openNew(), save(), ACCENT_RGB, BackBody() (+8 more)

### Community 3 - "Graphify Add & Watch Docs"
Cohesion: 0.13
Nodes (20): project CLAUDE.md (graphify integration), .claude/CLAUDE.md (graphify trigger config), /graphify slash-command trigger instruction, graphify project-rules section, reference: add a URL and watch a folder, --watch background file watcher, /graphify add <url> ingestion, reference: extra exports and benchmark (+12 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "Next.js App Layout & Config"
Cohesion: 0.16
Nodes (8): nextConfig, next, src_app_globals, geist, metadata, viewport, BottomNav(), tabs

### Community 6 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, sharp, tailwindcss, @types/node (+3 more)

### Community 7 - "Graphify Extraction Pipeline"
Cohesion: 0.25
Nodes (8): reference: extraction subagent prompt, Discrete confidence-score rubric (0.55-0.95), Node ID format ({stem}_{entity}), Semantic extraction cache (Step B0), Graph health check (Step 4.5), Honesty Rules (never invent edges, always show cost), Semantic extraction (Part B - LLM subagents), Structural extraction (Part A - AST)

### Community 8 - "Habits Page Handlers"
Cohesion: 0.33
Nodes (3): HabitsPage(), fetchHabits(), save()

### Community 9 - "Runtime Dependencies"
Cohesion: 0.33
Nodes (6): dependencies, date-fns, next, react, react-dom, @supabase/supabase-js

### Community 11 - "Graphify Multi-Repo Merge"
Cohesion: 0.67
Nodes (3): graphify clone <github-url>, graphify merge-graphs (cross-repo graph), Multiple local subfolders (monorepo) flow

### Community 12 - "Graphify Self-Improvement Loop"
Cohesion: 1.00
Nodes (3): git post-commit auto-rebuild hook, graphify reflect / LESSONS.md, save-result work-memory feedback loop

### Community 13 - "Graphify Clustering & Analysis"
Cohesion: 0.67
Nodes (3): --cluster-only (graphify cluster-only .), Community detection / clustering (Step 4), God nodes analysis

### Community 14 - "App Branding Concept"
Cohesion: 1.00
Nodes (3): Discipline App, Favicon (Lightning Bolt Icon), Lightning Bolt Symbol

## Knowledge Gaps
- **97 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 122 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Habits Page Component` to `Package Scripts & Metadata`, `Workout Page Component`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `next` connect `Next.js App Layout & Config` to `Package Scripts & Metadata`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `date-fns` connect `Habits Page Component` to `Package Scripts & Metadata`, `Workout Page Component`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Habits Page Component` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Package Scripts & Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Graphify Add & Watch Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.12631578947368421 - nodes in this community are weakly interconnected._