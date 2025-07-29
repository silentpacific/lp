# 🢀 LivePulse Engine Framework (v1.2)
> A headless, AI-powered content updater that detects, clusters, and refreshes live facts across blog posts — embedded inside any CMS.

---

## 🔍 1. Identifying Pulse Points

When a user enters or pastes text:
- The engine **scans for facts** that are likely to change over time.
- Each Pulse Point is:
  - Highlighted **directly in the WYSIWYG editor**
  - Given a **confidence score** (based on change likelihood and source trustworthiness)
  - Assigned a **type** (e.g. numeric, date-based, entity-based, relational)
  - Evaluated for **context and dependencies** (to determine if it forms a cluster)

If a fact has:
- **No dependencies**, it's a standalone Pulse Point
- **Dependencies**, it forms part of a **Cluster** for unified updates

Each Pulse Point is tagged with:
- A proposed **data source** (OpenAI API or fallback Gemini API)
- A suggested **update frequency**
- A **Pulse Category** (e.g. Economic, Tech, Health, Climate, etc.)

---

## 📌 2. Pulse Point Rules

1. Match dates, quantities, percentages (e.g. "23%", "in 2022", "15 million users")
2. Detect relative time references: *last week*, *this quarter*, *five years ago*
3. Identify standalone **factual statements**
4. If the article is time-bound (e.g. “in 2020”), freeze the facts. Else, auto-update.
5. If a **specific source** is cited, fetch updates from it. Else, flag for manual source selection.
6. All Pulse Points appear as inline highlights in the editor with:
   - Confidence Score
   - Pulse Category
   - Editable source assignment

---

## 🔗 3. Cluster Identification Rules

Clusters = groups of interrelated Pulse Points.

1. Semantic analysis checks for:
   - Subject references: *it*, *this*, *they*
   - Contextual glue: *like*, *towards*, *representing*, *compared to*
   - Topic matching with title/headings
2. Named Entity Recognition links mentions across paragraphs (e.g., “Apple,” “iPhone,” “the company”)
3. A **Confidence Score** is calculated for each cluster suggestion
4. Editors can:
   - Merge Pulse Points into a cluster
   - Break clusters apart
   - Override or confirm clustering suggestions

---

## ♻️ 4. Pulse Point Update Rules

1. Ask: **Will this fact change over time?**
   - Historical events: ❌ no updates
   - Dynamic data: ✅ set refresh rate
2. Suggested refresh rates (minimum = 1 hour):
   - Weather → Hourly (via OpenWeather API)
   - Stock data → Daily (via Yahoo Finance)
   - National data → Quarterly (e.g. ABS for Australia)
3. Updates are:
   - **Server-side only**
   - SEO-readable and crawlable
   - Stored in version history

4. **Conflict resolution:**
   - If fact update breaks sentence/paragraph logic → Engine auto-rewrites
   - If rewrite results are uncertain → Flag for editor

---

## 👀 5. Live Preview Rules

The **Live Preview pane is the staging environment.**

Before publishing:
1. Run AI grammar check
2. Ensure semantic coherence across sentence, paragraph, and article
3. Check if the rewrite preserves **meaning** while updating facts
4. If anything is unclear:
   - Flag for editor review
   - Highlight suspected logic breaks

---

## 🧑‍💻 6. Editor Control Panel

Editors have full visibility and manual control:

### Pulse Control
- Add / remove Pulse Points
- Edit values, source, confidence score
- Approve or reject AI refreshes
- View full version history and restore past values

### Cluster Control
- Merge or split Pulse Points
- Review cluster confidence suggestions
- Manually edit sentence groups

### Platform & Article Management
- Connect CMS platforms (WordPress, Shopify, etc.)
- View all articles and Pulse summaries
- Filter articles by:
  - State: Draft, Archived, Published
  - Date range
  - Tags, categories, authors
  - Pulse category (e.g. Economic, Political)
- Search by blog title or keyword

### Source & Rule Settings
- Assign trusted APIs per site/domain
  - e.g. “Always use ABS for Australian economic data”
- Add custom APIs per category
  - Weather, Stocks, Currency, etc.

---

## 🚀 7. Publishing Rules

- Manual approval from editors required (editorial control stays with user)
- One-click **push to CMS** (via:
  - WordPress plugin/API
  - Shopify app/API
  - JSON/Markdown for manual copy-paste)

---

## 🔌 8. Integrations

### Live Today
- OpenAI (GPT-4) for all updates
- Gemini API as fallback
- WordPress integration (via REST API or plugin)
- Shopify (via custom app or Admin API)

### Coming Soon
- Optional integrations for:
  - OpenWeather API
  - Yahoo Finance
  - World Bank, IMF, and ABS datasets
- Built-in AI grammar tools (e.g. JenniAI)
- Agency/CMS-level API access

> Note: Image updates (e.g. DALL·E) deferred for later phase

---

## 🔮 Long-Term Vision

**LivePulse is a SaaS content tool**, not just a plugin or widget.

- Headless by design — embeddable in any CMS or system
- AI-first — always-on content freshness
- Focused on high-quality editorial support, not just automation
- Future-ready with pluggable APIs, LLM integrations, and editorial intelligence

