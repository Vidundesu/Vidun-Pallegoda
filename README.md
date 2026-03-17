## 🏗️ Architecture Overview

### Core Idea

The system follows a structured pipeline:


``Raw HTML → TOON Transformation → AI Analysis → Recommendations → UI``


### Why TOON?

Instead of sending raw HTML directly to the model, this system uses **TOON (Token-Optimized Object Notation)** as an intermediate representation.

#### Benefits:

**Reduced Token Usage**
- Removes unnecessary markup, scripts, and noise
- Sends only meaningful, structured data to the model

**Improved AI Reasoning**
- Models work better with structured inputs than raw HTML
- Encourages deterministic, schema-aligned outputs

**Consistency**
- Standardized format ensures stable prompt behavior across pages

---

### System Layers

#### 1. Data Extraction Layer
- Scrapes webpage content
- Extracts:
  - headings (H1, H2, H3)
  - word count
  - images & alt text
  - CTA elements
  - links

#### 2. TOON Transformation Layer
- Converts extracted data into structured TOON format
- Filters irrelevant data
- Normalizes structure for AI consumption

#### 3. AI Analysis Layer

Split into two deterministic stages:

**a. Analysis Engine**
- Produces structured evaluation:
  - SEO structure
  - messaging clarity
  - CTA usage
  - content depth
  - UX concerns

**b. Recommendation Engine**
- Converts analysis + metrics into:
  - prioritized actions
  - measurable improvements
  - evidence-backed reasoning

#### 4. Frontend (SPA)
- Built with Next.js (React)
- Displays:
  - factual metrics
  - AI insights
  - recommendations

---

## 🤖 AI Design Decisions

### 1. Structured AI Instead of “Chat AI”

The system avoids free-form responses.

Instead:


``Input → constrained prompts → strict JSON output``


This ensures:
- predictable responses
- easier parsing
- production readiness

---

### 2. Prompt Engineering Strategy

Prompts are designed with:

**Strict Constraints**
- No hallucination
- Must reference real metrics
- No generic advice

**Evidence-Based Reasoning**

Every insight must:
- include a claim
- reference exact metric values

**Deterministic Output Schema**
- Fixed JSON structure
- Enforced fields
- No extra text

---

### 3. Two-Step AI Pipeline

Instead of a single large prompt:


``Step 1 → Analysis (understanding)``
``Step 2 → Recommendations (decision-making)``


#### Why this matters:
- improves reasoning clarity
- reduces prompt complexity
- mimics real-world decision systems

---

### 4. AI as a Reasoning Engine (Not Just Generator)

The system treats the model as:


``structured reasoning layer``


Not:


``text generator``


This is key to building reliable AI systems.

---

## ⚖️ Trade-offs

### Using Gemini Instead of Claude

#### Why Gemini?
- Free tier availability
- Lower experimentation cost
- Faster iteration during development

---

### Trade-offs Accepted

| Area | Impact |
|------|-------|
| Reasoning Depth | Slightly weaker than Claude |
| Output Consistency | More prompt tuning required |
| Complex Analysis | Less reliable in edge cases |

---

### Why this was acceptable

For this assignment:
- strong prompt constraints compensate for model limitations
- structured input (TOON) reduces ambiguity
- cost efficiency enables rapid iteration

---

## 🚀 What I Would Improve With More Time

### 1. Switch to Claude (Anthropic)
- stronger reasoning capabilities
- better adherence to structured prompts
- more reliable outputs under strict constraints

---

### 2. Implement RAG (Retrieval-Augmented Generation)

#### Current Limitation

The system relies only on:
- page data
- prompt instructions

---

#### With RAG

The system could incorporate:
- SEO best practices database
- UX heuristics
- industry benchmarks

---

#### Result:


``AI becomes context-aware instead of purely reactive``


#### Examples:
- compare page against industry standards
- provide richer, more informed recommendations
- reduce reliance on prompt engineering

---

### 3. Scoring System
- SEO score
- Content quality score
- UX score

#### This would:
- improve usability
- enable benchmarking
- make the tool feel production-ready

---

### 4. Feedback Loop / Learning System
- store past audits
- refine recommendations over time
- adapt to different industries

---

## 💡 Final Thoughts

This project is not just an AI feature.

It is an attempt to build a:


``structured, explainable AI decision system``


---

### Key principles:
- reduce ambiguity (TOON)
- constrain behavior (prompt engineering)
- separate reasoning from action (2-step AI pipeline)

---

## What Makes This Different

Most AI apps:


``input → LLM → output``


## This system:


``structured data → controlled reasoning → explainable decisions``