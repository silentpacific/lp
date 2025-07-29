# LivePulse - Universal Semantic Engine for Dynamic Content

## 🎯 Project Overview

**LivePulse** is an intelligent content analysis and update system that automatically identifies, tracks, and refreshes dynamic facts in blog posts while preserving semantic meaning and contextual relationships. The system uses AI-powered analysis to detect "Pulse Points" - specific facts that are likely to change over time - and enables controlled, scheduled updates with full semantic cluster preservation.

**Version**: 3.0 - Universal Semantic Engine  
**Status**: Ready for Testing & Deployment  
**Last Updated**: July 26, 2025

## 🏗️ Architecture Overview

### Core Philosophy
- **Universal Data Engine**: One intelligent system handles all data types (crypto, weather, stocks, etc.)
- **Semantic Cluster Awareness**: Detects and maintains relationships between related data points
- **Relationship-Driven Updates**: Mathematical and logical consistency across dependent values
- **Headless Design**: Plugs into any CMS or platform as a service layer

### Technology Stack

**Frontend**:
- Vanilla JavaScript (ES6+) for maximum compatibility
- Modern CSS with CSS Grid and Flexbox
- Responsive design with mobile-first approach

**Backend**:
- Netlify Functions (Serverless Node.js)
- Supabase PostgreSQL with real-time features
- Google Gemini AI for content analysis

**Data Sources**:
- CoinGecko API (Cryptocurrency data)
- OpenWeatherMap API (Weather data)
- AI-powered research for complex data types
- System date/time for temporal references

## 🔧 File Structure

```
lp/
├── src/
│   ├── index.html              # Modern UI with semantic cluster support
│   ├── app.js                  # Universal frontend with cluster management
│   └── style.css               # Professional styling (existing)
├── netlify/functions/
│   ├── data-sources.js         # Universal data fetching engine
│   ├── analyze-pulse.js        # Smart semantic cluster detection
│   ├── update-content.js       # Universal content updates
│   └── auto-update-scheduler.js # Cluster-aware scheduling
├── database/
│   └── schema.sql              # Enhanced schema with semantic clusters
├── package.json                # Dependencies and configuration
├── netlify.toml               # Build configuration
└── README.md                  # This file
```

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

#### `semantic_clusters` (NEW)
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

#### `pulse_relationships` (NEW)
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

#### `pulse_updates`
Complete history of all pulse updates with cluster tracking.
```sql
- id (UUID, primary key)
- pulse_id (UUID, foreign key)
- cluster_id (UUID) - Track cluster updates
- old_value, new_value (TEXT, not null)
- update_source (TEXT) - Data source URL
- update_method (TEXT) - auto|manual|scheduled|cluster_cascade
- validation_status (TEXT) - approved|rejected|pending|cluster_failed
- rejection_reason (TEXT)
- cluster_changes (JSONB) - All related changes in cluster
- user_id (UUID)
- confidence_score (DECIMAL)
- data_source_metadata (JSONB) - Rich metadata from APIs
- updated_at (TIMESTAMP)
```

#### `validation_logs` (NEW)
Tracks validation results for quality control.
```sql
- id (UUID, primary key)
- pulse_update_id (UUID, foreign key)
- validation_type (TEXT) - semantic|factual|tone|cluster_consistency
- validation_result (BOOLEAN)
- validation_details (JSONB)
- cluster_validation_results (JSONB)
- processed_at (TIMESTAMP)
```

#### `pulse_data_cache` (NEW)
Caches external API data to reduce API calls.
```sql
- id (UUID, primary key)
- pulse_type, specific_type (TEXT, not null)
- data_value, data_context (TEXT)
- data_source (TEXT, not null)
- confidence_score (DECIMAL)
- metadata (JSONB)
- cached_at, expires_at (TIMESTAMP)
```

## 🔄 Core Functions

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

**Example Cluster Detection**:
```
Input: "Tesla shares closed at $248.50, down 3.2% from $257.75"
Output: 3-pulse semantic cluster:
- Primary: "$248.50" (drives updates)
- Dependent: "3.2%" (calculated from price change)
- Dependent: "down" (direction from price comparison)
```

### 3. Universal Content Updates (`update-content.js`)
**Purpose**: Updates individual pulses and semantic clusters  
**Features**:
- **Single Pulse Updates**: Enhanced with context preservation
- **Semantic Cluster Updates**: Atomic updates of related pulse points
- **Validation Engine**: Grammar, tone, scale, factual accuracy
- **Relationship Calculations**: Percentage changes, directions, comparisons
- **Context-Aware Generation**: Preserves writing style and meaning

**Cluster Update Process**:
1. Fetch new data for primary pulse
2. Calculate dependent values using relationship rules
3. Validate entire cluster for mathematical consistency
4. Apply atomic update (all or nothing)

### 4. Intelligent Scheduling (`auto-update-scheduler.js`)
**Purpose**: Coordinates automated updates with cluster awareness  
**Features**:
- **Priority-Based Processing**: Clusters first, then individual pulses
- **Dependency Management**: Updates in correct order
- **Failure Isolation**: Failed updates don't stop the process
- **Performance Monitoring**: Success rates and timing metrics
- **Maintenance Tasks**: Cache cleanup and statistics refresh

## 🎨 User Interface Features

### Modern Professional Design
- **Card-based layout** with clear visual hierarchy
- **Status indicators** for engine health and updates
- **Responsive design** that works on all devices
- **Accessibility support** with ARIA labels and keyboard shortcuts

### Smart Analysis Interface
- **Visual cluster breakdown** showing relationships
- **Role indicators** (Primary, Dependent, Reference)
- **Confidence scoring** with color-coded badges
- **Real-time preview** with highlighted pulse points

### Comprehensive Management
- **Cluster-aware display** showing related pulse points
- **Bulk operations** (pause all, update all, export/import)
- **Visual footnote system** grouping related citations
- **Developer tools** with debugging interface

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Netlify CLI
- Supabase account
- API keys for data sources

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NETLIFY_URL=your_netlify_site_url

# Optional but recommended
OPENWEATHER_API_KEY=your_openweather_key
```

### Installation Steps

1. **Clone and Install**
```bash
git clone https://github.com/silentpacific/lp
cd lp
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

4. **Deploy to Netlify**
```bash
netlify dev  # Test locally
netlify deploy --prod  # Deploy to production
```

### Automated Scheduling Setup
Set up external cron job to trigger updates every 15 minutes:
```bash
# Using cron-job.org or similar service
# POST to: https://your-site.netlify.app/.netlify/functions/auto-update-scheduler
```

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

## 📈 Semantic Cluster Examples

### Financial Cluster
```
Original: "Tesla shares closed at $248.50, down 3.2% from $257.75"
Update Process:
1. Primary: $248.50 → $275.30 (new API data)
2. Calculate: ((275.30 - 257.75) / 257.75) × 100 = 6.8%
3. Direction: $275.30 > $257.75 → "down" becomes "up"
Result: "Tesla shares closed at $275.30, up 6.8% from $257.75"
```

### Weather Comparison Cluster
```
Original: "Adelaide is 25°C, 5 degrees warmer than yesterday's 20°C"
Update Process:
1. Primary: 25°C → 18°C (new weather data)
2. Calculate: 18 - 20 = -2 degrees
3. Direction: "warmer" becomes "cooler"
Result: "Adelaide is 18°C, 2 degrees cooler than yesterday's 20°C"
```

## 🎯 Business Applications

### Content Types That Benefit
- **Financial News**: Stock prices, market data, economic indicators
- **Weather Reports**: Current conditions, forecasts, comparisons
- **Sports Coverage**: Scores, standings, player statistics
- **Technology News**: Product specs, pricing, market share
- **Research Articles**: Population data, study results, surveys

### SEO & LLM Benefits
- **Search Rankings**: Fresh content gets better rankings
- **User Engagement**: Current data increases time on page
- **LLM Citations**: AI models prefer recent, accurate information
- **Trust Signals**: Automated updates with source attribution

### Use Cases
- **News Websites**: Automatic price and statistic updates
- **Corporate Blogs**: Real-time market data and metrics
- **Research Sites**: Current demographic and study data
- **E-commerce**: Dynamic pricing and inventory information

## 🔮 Roadmap & Future Features

### Phase 1: Core Engine (✅ COMPLETE)
- Universal data sources
- Semantic cluster detection
- Relationship-aware updates
- Intelligent scheduling

### Phase 2: Platform Integration (Next)
- WordPress plugin development
- Ghost CMS integration
- API endpoints for third-party platforms
- Webhook support for external triggers

### Phase 3: Advanced Intelligence
- Predictive update recommendations
- Content performance analytics
- A/B testing for updated vs. static content
- Machine learning optimization

### Phase 4: Enterprise Features
- Multi-user collaboration
- Advanced permissions and workflows
- Custom data source integrations
- White-label solutions

## 📊 Success Metrics

### Technical Performance
- **Detection Accuracy**: >90% precision in pulse point identification
- **Cluster Accuracy**: >95% accuracy in relationship detection
- **Update Success Rate**: >95% successful automated updates
- **Response Time**: <2 seconds analysis, <5 seconds cluster updates

### Business Impact
- **Content Freshness**: 40% reduction in stale data
- **SEO Improvement**: 15-25% increase in search rankings
- **User Engagement**: 20% increase in time on page
- **LLM Citations**: 50% more AI model references

## 🚀 Deployment Status

### Production Ready Features
- ✅ Universal data sources engine
- ✅ Enhanced database schema with clusters
- ✅ Smart semantic cluster detection
- ✅ Relationship-aware content updates
- ✅ Intelligent auto-update scheduling
- ✅ Modern frontend interface
- ✅ Professional HTML structure

### Testing Required
- 🧪 End-to-end cluster update workflows
- 🧪 High-volume concurrent updates
- 🧪 External API failure scenarios
- 🧪 Complex mathematical relationships

### Deployment Checklist
- [ ] Database schema deployed to Supabase
- [ ] Environment variables configured
- [ ] External cron job scheduled
- [ ] API keys tested and validated
- [ ] Frontend deployed and accessible
- [ ] Error monitoring configured

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Run local development environment
4. Test changes thoroughly
5. Submit pull request with description

### Code Standards
- ES6+ JavaScript with clear documentation
- Responsive CSS with mobile-first approach
- SQL with proper indexing and relationships
- Error handling with graceful degradation

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

**LivePulse Universal Semantic Engine v3.0**  
Built with intelligence, designed for scale, optimized for results.

*Last Updated: July 26, 2025*