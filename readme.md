# 🫀 LivePulse - Universal Semantic Engine for Dynamic Content

> AI-powered content intelligence platform that automatically keeps blog posts and articles current by identifying and updating facts that change over time, while maintaining editorial control and semantic coherence.

**Version**: 3.0 - Universal Semantic Engine  
**Status**: Ready for Testing & Deployment  
**Last Updated**: August 2025

---

## 🎯 Product Vision

**LivePulse is a SaaS content intelligence platform** that automatically keeps blog posts and articles current by identifying and updating facts that change over time, while maintaining editorial control and semantic coherence.

### Core Value Proposition
- **For Content Creators**: Never publish outdated information again
- **For Businesses**: Maintain credibility with always-current data
- **For SEO**: Fresh content gets better search rankings
- **For AI/LLM**: Reliable, cited information increases model references

### Key Features
- **AI-Powered Detection**: Automatically identifies facts that change over time
- **Semantic Clusters**: Groups related data points that must update together
- **Real-Time Updates**: Connects to trusted APIs (crypto, weather, stocks)
- **Smart Scheduling**: Updates at optimal intervals based on volatility
- **Full Editorial Control**: All changes require approval
- **Multi-Platform**: Works with any CMS or platform

---

## 🏗️ Architecture Overview

### Core Philosophy
- **Universal Data Engine**: One intelligent system handles all data types (crypto, weather, stocks, etc.)
- **Semantic Cluster Awareness**: Detects and maintains relationships between related data points
- **Relationship-Driven Updates**: Mathematical and logical consistency across dependent values
- **Headless Design**: Plugs into any CMS or platform as a service layer
- **Modular Design**: Each component has a single responsibility

### Technology Stack

**Frontend**:
- Vanilla JavaScript (ES6+) for maximum compatibility and performance
- Modern CSS with CSS Grid and Flexbox
- Web APIs (Local storage, fetch, intersection observer)
- Progressive Web App features

**Backend**:
- Netlify Functions (Serverless Node.js)
- Supabase PostgreSQL with real-time features
- Google Gemini AI for content analysis
- External APIs for data sources

**Data Sources**:
- CoinGecko API (Cryptocurrency data)
- OpenWeatherMap API (Weather data)
- AI-powered research for complex data types
- System date/time for temporal references

---

## 📁 Complete File Structure

```
lp/
├── 📄 Configuration & Documentation
│   ├── .env                           # Environment variables (API keys)
│   ├── .gitignore                     # Git ignore patterns
│   ├── package.json                   # Node.js dependencies
│   ├── netlify.toml                   # Netlify build configuration
│   ├── README.md                      # This documentation
│   └── live_pulse_engine_framework.md # Core framework documentation
│
├── 🎨 Frontend Application
│   └── src/
│       ├── index.html                 # Landing page (marketing site)
│       ├── app.html                   # Main editor application
│       └── style.css                  # Global styles & CSS
│
├── 🧩 Modular JavaScript Architecture
│   └── js/
│       ├── 🏗️ core/
│       │   ├── app.js                 # Main app initialization & coordination
│       │   ├── config.js              # Configuration constants & settings
│       │   └── utils.js               # Utility functions (debounce, formatting)
│       │
│       ├── 💾 storage/
│       │   ├── supabase-client.js     # Database connection & client
│       │   ├── article-storage.js     # Article CRUD operations
│       │   └── article-management.js  # Article UI management & display
│       │
│       ├── 🔬 analysis/
│       │   ├── pulse-analyzer.js      # Single pulse & full article analysis
│       │   ├── mock-analysis.js       # Mock/demo analysis functions
│       │   └── cluster-detection.js   # Semantic cluster logic & detection
│       │
│       ├── ⚡ pulse-management/
│       │   ├── pulse-creator.js       # Create & manage individual pulses
│       │   ├── cluster-manager.js     # Semantic cluster management
│       │   ├── pulse-updater.js       # Update pulse values (mock & real)
│       │   └── pulse-display.js       # Pulse list UI & controls
│       │
│       ├── 👁️ preview/
│       │   ├── preview-manager.js     # Live preview generation & display
│       │   ├── footnote-manager.js    # Footnotes & superscripts
│       │   └── export-manager.js      # HTML export functionality
│       │
│       ├── 🎨 ui/
│       │   ├── notification-system.js # Success/error notifications
│       │   ├── modal-manager.js       # Modal creation & management
│       │   ├── mobile-menu.js         # Mobile navigation & responsive UI
│       │   └── stats-display.js       # Statistics & metrics display
│       │
│       └── 🎛️ enhanced-controls/
│           ├── filter-system.js       # Search & filter functionality
│           ├── bulk-operations.js     # Bulk pulse operations
│           └── import-export.js       # Configuration import/export
│
└── ⚡ Serverless Backend
    └── netlify/functions/
        ├── analyze-pulse.js           # AI-powered pulse point analysis
        ├── update-content.js          # Content update processing
        ├── data-sources.js            # Universal data fetching engine
        ├── auto-update-scheduler.js   # Automated update scheduling
        ├── live-preview-staging.js    # Live preview with validation
        ├── ghost-integration.js       # Ghost CMS integration
        ├── demo-data.js              # Demo data generation
        └── env-config.js             # Environment configuration
```

---

## 🔍 Pulse Point Detection Rules

### What Qualifies as a Pulse Point?
1. **Quantitative Data**: Prices, percentages, statistics, counts
2. **Temporal References**: Dates, "last quarter", "this year", relative time
3. **Dynamic Facts**: Stock prices, weather, population figures, market data
4. **Comparative Statements**: "higher than", "increased by", "compared to"

### What Should NOT Be Pulse Points?
- ❌ Historical events with fixed dates ("World War II ended in 1945")
- ❌ Permanent facts ("Paris is the capital of France")
- ❌ Subjective opinions or editorial content
- ❌ Branded content or marketing copy

### Confidence Scoring Rules
- **High (🔥)**: Well-formatted numbers with clear data types ($67,500, 25°C, 15%)
- **Medium (⚡)**: Recognizable patterns but some ambiguity
- **Low (⚠️)**: Potential pulse points requiring manual review

---

## 🔗 Semantic Clustering Logic

### When to Create Clusters
Pulse points should be clustered when they have:
1. **Mathematical Relationships**: Price → Percentage change → Direction
2. **Temporal Dependencies**: Current value → Historical comparison
3. **Contextual Links**: Subject references, entity relationships
4. **Logical Consistency**: Related facts that must update together

### Cluster Types
- **Mathematical**: Price, percentage, direction (e.g., "Tesla at $248, up 3.2%")
- **Comparative**: Current vs historical values (e.g., "25°C, 5 degrees warmer")
- **Temporal**: Time-based relationships (e.g., "Q3 2024 vs Q3 2023")
- **Descriptive**: Related facts about same entity

### Semantic Cluster Examples

#### Financial Cluster
```
Original: "Tesla shares closed at $248.50, down 3.2% from $257.75"
Update Process:
1. Primary: $248.50 → $275.30 (new API data)
2. Calculate: ((275.30 - 257.75) / 257.75) × 100 = 6.8%
3. Direction: $275.30 > $257.75 → "down" becomes "up"
Result: "Tesla shares closed at $275.30, up 6.8% from $257.75"
```

#### Weather Comparison Cluster
```
Original: "Adelaide is 25°C, 5 degrees warmer than yesterday's 20°C"
Update Process:
1. Primary: 25°C → 18°C (new weather data)
2. Calculate: 18 - 20 = -2 degrees
3. Direction: "warmer" becomes "cooler"
Result: "Adelaide is 18°C, 2 degrees cooler than yesterday's 20°C"
```

---

## 📊 Database Schema

### Core Tables

#### `articles`
Stores blog posts and article content with pulse tracking.
```sql
- id (UUID, primary key)
- title (TEXT, not null)
- content_html (TEXT, not null) 
- raw_content (TEXT, not null)
- author_id (UUID)
- pulse_count (INTEGER, default 0)
- last_pulse_update (TIMESTAMP)
- article_context (TEXT) - Article themes and topics
- metadata (JSONB) - Additional article data
- created_at, updated_at (TIMESTAMP)
```

#### `pulses`
Individual pulse points with enhanced context and cluster support.
```sql
- id (UUID, primary key)
- article_id (UUID, foreign key)
- pulse_type (TEXT, not null) - crypto|weather|stock|date|etc
- specific_type (TEXT) - Detailed identifier
- selected_text (TEXT, not null) - Original selected text
- current_value (TEXT, not null) - Current dynamic value
- static_prefix (TEXT) - Text before dynamic part
- static_suffix (TEXT) - Text after dynamic part
- surrounding_sentences (TEXT) - Context sentences
- paragraph (TEXT) - Full paragraph context
- article_context (TEXT) - Article themes
- action, subject, emotion, entity (TEXT) - Semantic components
- prompt_template (TEXT, not null)
- update_frequency (INTEGER, not null) - Minutes between updates
- confidence_score (DECIMAL) - Detection confidence (0.00-1.00)
- semantic_cluster_id (UUID) - Links to semantic cluster
- is_primary_in_cluster (BOOLEAN) - Is this the main pulse in cluster
- superscript_id (INTEGER) - For footnote linking
- is_active (BOOLEAN, default true)
- next_update (TIMESTAMP)
- last_updated (TIMESTAMP)
- update_count (INTEGER, default 0)
- source_url, source_name (TEXT)
- created_at (TIMESTAMP)
```

#### `semantic_clusters`
Groups related pulse points that must update together.
```sql
- id (UUID, primary key)
- article_id (UUID, foreign key)
- cluster_name (TEXT, not null) - Descriptive name
- primary_pulse_id (UUID) - Main pulse that drives updates
- semantic_rule (TEXT, not null) - Natural language description
- cluster_type (TEXT) - mathematical|temporal|comparative|descriptive
- update_priority (INTEGER) - Processing order
- is_active (BOOLEAN, default true)
- created_at, updated_at (TIMESTAMP)
```

#### `pulse_relationships`
Maps dependencies between pulse points in clusters.
```sql
- id (UUID, primary key)
- cluster_id (UUID, foreign key)
- source_pulse_id (UUID) - Pulse providing input data
- target_pulse_id (UUID) - Pulse being calculated
- relationship_type (TEXT) - percentage_change|direction|comparison|reference_point
- calculation_rule (TEXT) - Mathematical/logical rule
- dependency_order (INTEGER) - Update sequence
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

---

## ⚡ Update Frequency Guidelines

### Business Rules for Update Timing
- **High Volatility Data** (Crypto, Stocks): 1-4 hours
- **Moderate Change Data** (Weather, News): 3-12 hours  
- **Stable Data** (Demographics, Research): Daily to Monthly
- **Seasonal Data** (Reports, Statistics): Quarterly/Annually

### Priority System
1. **Critical**: Financial data during market hours
2. **High**: Breaking news, weather alerts, crypto during volatility
3. **Medium**: General statistics, population data, research findings
4. **Low**: Historical comparisons, background information

---

## 👀 Editorial Control Requirements

### Manual Approval Workflow
1. **Detection Phase**: AI suggests pulse points with confidence scores
2. **Review Phase**: Editor approves/rejects suggestions and sets sources
3. **Update Phase**: System fetches new data and shows preview
4. **Publishing Phase**: Editor approves changes before going live

### Editor Override Capabilities
- Manually edit any pulse point value
- Change data sources and update frequencies
- Pause/resume individual pulses or entire clusters
- Rollback to previous versions
- Add custom validation rules

---

## 🛡️ Quality Assurance Rules

### Pre-Publication Validation
1. **Grammar Check**: Ensure updated content reads naturally
2. **Semantic Coherence**: Verify meaning is preserved
3. **Fact Consistency**: Check mathematical relationships are correct
4. **Source Validation**: Confirm data source is reliable and current

### Conflict Resolution
- **Logic Breaks**: If update creates grammatical errors → Auto-rewrite with AI
- **Inconsistencies**: If cluster relationships break → Flag for manual review
- **Source Failures**: If data unavailable → Use last known value + timestamp
- **Validation Errors**: If content doesn't pass checks → Hold for editor approval

---

## 🔧 Core Functions

### 1. Universal Data Sources (`data-sources.js`)
**Purpose**: Centralized data fetching for all pulse types  
**Features**:
- Intelligent routing to appropriate data sources
- Standardized response format across all APIs
- AI fallback for complex data types
- Rich metadata and confidence scoring
- Error handling with graceful degradation

**Supported Data Types**:
- **Crypto**: Bitcoin, Ethereum prices via CoinGecko
- **Weather**: Real-time conditions via OpenWeatherMap
- **Stocks**: AI-powered research (API integration ready)
- **Dates**: System date/time with timezone support
- **Population/Sports/News**: AI-powered research with Gemini

### 2. Smart Semantic Analysis (`analyze-pulse.js`)
**Purpose**: Detects pulse points and semantic relationships  
**Features**:
- **Single Pulse Mode**: Analyze selected text for relationships
- **Full Article Scan**: Discover all potential pulse points
- **Semantic Cluster Detection**: Find related data that must update together
- **Relationship Mapping**: Mathematical and logical dependencies
- **Context Extraction**: Sentence → Paragraph → Article hierarchy

### 3. Universal Content Updates (`update-content.js`)
**Purpose**: Updates individual pulses and semantic clusters  
**Features**:
- **Single Pulse Updates**: Enhanced with context preservation
- **Semantic Cluster Updates**: Atomic updates of related pulse points
- **Validation Engine**: Grammar, tone, scale, factual accuracy
- **Relationship Calculations**: Percentage changes, directions, comparisons
- **Context-Aware Generation**: Preserves writing style and meaning

### 4. Intelligent Scheduling (`auto-update-scheduler.js`)
**Purpose**: Coordinates automated updates with cluster awareness  
**Features**:
- **Priority-Based Processing**: Clusters first, then individual pulses
- **Dependency Management**: Updates in correct order
- **Failure Isolation**: Failed updates don't stop the process
- **Performance Monitoring**: Success rates and timing metrics
- **Maintenance Tasks**: Cache cleanup and statistics refresh

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Netlify CLI
- Supabase account
- API keys for external data sources

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NETLIFY_URL=your_netlify_site_url

# Optional but recommended
OPENWEATHER_API_KEY=your_openweather_key
COINGECKO_API_KEY=your_coingecko_key
```

### Installation Steps

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/livepulse
cd livepulse
npm install
```

2. **Database Setup**
```bash
# Run the enhanced schema SQL on your Supabase database
# File: database/schema.sql
```

3. **Configure Environment**
```bash
cp .env.example .env
# Add your API keys to .env file
```

4. **Local Development**
```bash
netlify dev  # Start local development server
```

5. **Deploy to Production**
```bash
netlify deploy --prod  # Deploy to production
```

### Automated Scheduling Setup
Set up external cron job to trigger updates every 15 minutes:
```bash
# Using cron-job.org or similar service
# POST to: https://your-site.netlify.app/.netlify/functions/auto-update-scheduler
```

---

## 🧪 Testing Workflow

### 1. Basic Pulse Points
Test with simple, single-value updates:
```
- "Bitcoin is at $67,500" → Updates price only
- "Weather is 25°C today" → Updates temperature
- "Population is 5.4 million" → Updates demographic data
```

### 2. Semantic Clusters
Test with related data points:
```
- "Tesla at $248.50, down 3.2% from $257.75"
- "Adelaide is 25°C, 5 degrees warmer than yesterday's 20°C"
- "Sales grew 15% to $2.5M from last quarter's $2.17M"
```

### 3. Full Article Scanning
Test with complete articles containing multiple pulse points and clusters.

### 4. Edge Cases
- Mathematical inconsistencies
- Invalid data sources
- Network failures
- Validation rejections

---

## 🔌 Integration Requirements

### CMS Platform Support
- **WordPress**: Plugin + REST API integration
- **Ghost**: Admin API integration
- **Shopify**: Custom app for product descriptions
- **Custom CMS**: JSON/API endpoints + webhook support

### Data Source Standards
- **Primary Sources**: Official APIs (CoinGecko, OpenWeather, Yahoo Finance)
- **Government Data**: Bureau of Statistics, Fed APIs, Official databases
- **Fallback Sources**: AI research with citations and confidence scoring
- **Custom Sources**: User-provided APIs with validation

### Authentication & Security
- **API Key Management**: Secure storage and rotation
- **Rate Limiting**: Respect API limits and implement backoff
- **Data Privacy**: No storage of sensitive user content
- **Audit Trail**: Log all changes and data sources

---

## 📊 Success Metrics & KPIs

### Technical Performance
- **Pulse Detection Accuracy**: >90% precision, <5% false positives
- **Update Success Rate**: >95% successful automated updates
- **Response Time**: <2 seconds for analysis, <5 seconds for updates
- **Uptime**: >99.9% availability for critical update functions

### Business Impact  
- **Content Freshness**: Reduce stale data by 40%+
- **User Engagement**: Increase time on page by 20%+
- **SEO Performance**: Improve search rankings by 15-25%
- **Editorial Efficiency**: Reduce manual fact-checking time by 60%+

---

## 🚀 Deployment & Scaling Strategy

### Launch Phases
1. **Phase 1**: WordPress plugin for financial and crypto blogs
2. **Phase 2**: Ghost integration and weather/news pulse points
3. **Phase 3**: Enterprise features and custom integrations
4. **Phase 4**: White-label solutions and API marketplace

### Pricing Model
- **Free Tier**: 5 pulse points, basic sources, manual updates
- **Creator Tier** ($29/mo): 50 pulse points, auto-updates, premium sources
- **Business Tier** ($99/mo): Unlimited pulses, custom sources, team features
- **Enterprise**: Custom pricing, dedicated support, white-label options

---

## 🔮 Future Roadmap

### Short-term (3-6 months)
- Real-time WebSocket updates for critical data
- Advanced clustering with ML-based relationship detection
- Bulk import/export for large content migration
- Multi-language support for international markets

### Medium-term (6-12 months)
- Predictive analytics for content performance
- A/B testing framework for updated vs static content
- Integration marketplace with third-party data providers
- Advanced workflow automation and approval chains

### Long-term (12+ months)
- AI-generated content suggestions based on pulse patterns
- Real-time collaboration features for editorial teams
- Custom dashboard and analytics suite
- Mobile app for on-the-go pulse management

---

## 🎭 User Personas & Use Cases

### Primary Users
- **Solo Bloggers**: Tech, finance, and news content creators
- **Content Teams**: Marketing teams, news organizations, corporate blogs
- **Agency Clients**: Digital agencies managing multiple client sites
- **E-commerce**: Product descriptions with dynamic pricing/inventory

### Business Applications
- **Financial News**: Stock prices, market data, economic indicators
- **Weather Reports**: Current conditions, forecasts, comparisons
- **Sports Coverage**: Scores, standings, player statistics
- **Technology News**: Product specs, pricing, market share
- **Research Articles**: Population data, study results, surveys

### Success Stories (Target)
- *"Our crypto blog's traffic increased 40% after implementing LivePulse"*
- *"We reduced fact-checking time from hours to minutes while improving accuracy"*  
- *"Search rankings improved significantly with constantly fresh content"*
- *"Readers trust our financial content more knowing prices are always current"*

---

## 📋 Technical Requirements Summary

### Must-Have Features
- ✅ AI-powered pulse point detection
- ✅ Semantic cluster management
- ✅ Real-time data source integration
- ✅ Editorial approval workflow
- ✅ WordPress plugin compatibility

### Should-Have Features
- 🔄 Ghost CMS integration
- 🔄 Advanced analytics dashboard
- 🔄 Bulk operations and management
- 🔄 Multi-user collaboration tools

### Nice-to-Have Features
- 💭 Predictive content insights
- 💭 Custom ML model training
- 💭 Advanced workflow automation
- 💭 White-label solutions

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the modular architecture
4. Test thoroughly across different browsers and devices
5. Submit a pull request with detailed description

### Code Standards
- ES6+ JavaScript with clear documentation
- Responsive CSS with mobile-first approach
- Modular design with single responsibility principle
- Comprehensive error handling and validation

---

## 📞 Support & Documentation

### API Documentation
- **Analyze Pulse**: `POST /.netlify/functions/analyze-pulse`
- **Update Content**: `POST /.netlify/functions/update-content`
- **Data Sources**: `POST /.netlify/functions/data-sources`
- **Scheduler**: `POST /.netlify/functions/auto-update-scheduler`

### Error Codes & Troubleshooting
- **400**: Missing required parameters
- **500**: Internal server error (check logs)
- **API Failures**: Graceful fallback to AI research
- **Validation Failures**: Detailed rejection reasons provided

---

## 🎯 Current Status & Next Steps

### ✅ Completed
- Complete modular JavaScript architecture (22 files)
- Frontend editor with full pulse management interface
- Landing page with marketing content and demo
- Serverless backend functions for analysis and updates
- Mock analysis system for development and demonstration
- Enhanced controls for filtering, bulk operations, and import/export

### 🧪 Ready for Testing
- End-to-end pulse creation and update workflows
- Semantic cluster detection and relationship management
- Multi-device responsive interface
- Import/export functionality for pulse configurations

### 🔜 Planned Enhancements
- Real API integrations for production data sources
- User authentication and multi-tenant support
- WordPress and Ghost CMS plugins
- Advanced analytics and reporting dashboard
- A/B testing for updated vs static content performance

---

**LivePulse Universal Semantic Engine v3.0**  
*Built with intelligence, designed for scale, optimized for results.*

**Framework Version**: 3.0 | **Last Updated**: August 2025