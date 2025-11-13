# Financial Advisor UI - TODO

## Phase 1: Setup
- [x] Database schema for clients, holdings, meetings
- [x] Design system with steel blue/gray/white palette
- [x] Global CSS variables and typography

## Phase 2: Dashboard Layout
- [x] Top navigation bar with advisor info
- [x] Left sidebar with navigation tabs
- [x] Dashboard home page with meeting prep summary
- [x] Insights & news panel
- [x] Task & to-do card

## Phase 3: Client Detail Screen
- [x] Client header with key metrics
- [x] Two-column layout (overview + meeting prep)
- [x] Holdings summary with steel blue bars
- [x] Recent transactions display
- [x] Talking points generator section
- [x] Portfolio risk flags
- [x] Recommended questions

## Phase 4: AI Interaction
- [x] Slide-in AI drawer from right
- [x] Natural language input box
- [x] Regenerate, validate, add to report buttons
- [x] Prompt history display
- [x] Quick action buttons
- [x] Backend API integration for queries

## Phase 5: Report Generation
- [x] Report canvas with drag-drop components
- [x] Holdings summary component
- [x] Client goals component
- [x] AI insights component
- [x] Risks & opportunities component
- [x] Export to PDF functionality

## Phase 6: Final Polish
- [x] Test all features end-to-end
- [x] Verify responsive design
- [x] Check accessibility
- [x] Create checkpoint
- [x] Documentation

## Phase 7: Backend Integration & Data
- [x] Integrate FA AI System backend API (http://localhost:8000)
- [x] Connect ai.query to interactive supervisor workflow
- [x] Handle API errors and timeouts gracefully

## Phase 8: PDF Export
- [x] Install PDF generation library
- [x] Create PDF template for reports
- [x] Implement export functionality
- [ ] Add email integration (future enhancement)

## Phase 9: Extended Database Schema
- [x] Add households table (200 per advisor)
- [x] Add accounts table (7 per household)
- [x] Extend holdings table with S&P 500 data
- [x] Add advisor hierarchy relationships

## Phase 10: Synthetic Data Generation
- [x] S&P 500 ticker list and company data
- [x] Generate 4,000 advisors with firm info
- [x] Generate 800,000 households (200 per advisor)
- [x] Generate 5.6M accounts (7 per household)
- [x] Generate 84M holdings (15 per account)
- [x] Realistic portfolio allocations and performance
- [x] Test data generator (100 advisors for quick testing)

## Phase 11: Salesforce Integration
- [x] Design Salesforce data extraction schema
- [x] Create sub-agent for Salesforce API
- [x] Map Salesforce objects to database tables
- [x] Implement full sync functionality
- [x] Handle authentication and rate limits
- [ ] Implement incremental sync (future enhancement)

## Phase 12: Testing & Integration
- [x] Populate database with demo data (5 advisors, 25 households, 175 accounts, 2,625 holdings)
- [x] Database schema migration completed
- [x] All data generators working (demo, test, production)
- [x] Salesforce integration ready
- [x] Ready for deployment

## Phase 13: Production Integration
- [x] Expose FA AI System API with temporary public URL (https://8000-iobtysnaf9hp9h92n3sxp-1d223801.manusvm.computer)
- [x] Update FA AI backend URL in UI
- [x] Test real-time AI queries with exposed backend
- [x] Verify error handling and timeouts

## Phase 14: Salesforce-Style Database
- [x] Add interactions table (emails, calls, meetings, notes)
- [x] Link interactions to advisors and households
- [x] Track interaction history and timeline
- [x] Generate synthetic interaction data

## Phase 15: Scale Testing
- [x] Generate test data (100 advisors) with interactions (in progress)
- [x] Fixed database schema for account types
- [x] Test data generator working correctly
- [ ] Display interaction timeline in client detail (future enhancement)

## Phase 16: Interaction Timeline
- [x] Create Activity section in client detail page
- [x] Build timeline component with chronological display
- [x] Add filtering by interaction type
- [x] Show interaction details (subject, description, outcome)
- [x] Add visual timeline with icons
- [x] Integrate with tRPC backe## Phase 17: Real-Time Portfolio Sync
- [x] Design custodian API integration framework
- [x] Add scheduled job for nightly sync (2 AM)
- [x] Implement Schwab API client
- [x] Implement Fidelity API client
- [x] Create comprehensive documentation
- [ ] Test sync with real credentials (requires API keys)mapping and reconciliatio## Phase 18: AI Meeting Notes
- [x] Add Meeting Recorder component to client detail
- [x] Implement speech-to-text transcription with Whisper API
- [x] Generate structured notes with Claude
- [x] Extract action items and next steps automatically
- [x] Save meeting notes as interactions
- [x] Real-time recording with timer
- [x] Copy notes to clipboard functionalitytable

## Phase 19: Dashboard Analytics
- [x] Add portfolio performance charts (YTD returns)
- [x] Create asset allocation pie chart
- [x] Build AUM trends over time
- [x] Add interactive drill-downs by advisor
- [x] Show top performers and underperformers
- [x] Client distribution by AUM
- [x] Sector allocation bar chart
- [x] KPI cards (Total AUM, Portfolio Return, Total Clients, Avg Portfolio Size)
- [x] Analytics navigation link in sidebar

## Phase 20: Client Portal
- [x] Create separate client-facing routes (/portal)
- [x] Read-only holdings view for households
- [x] Performance summary for clients
- [x] Document access for clients (mock data)
- [x] Asset allocation pie chart
- [x] Portfolio metrics (total value, gain/loss, return %)
- [ ] Secure authentication for clients (future - requires separate auth system)

## Phase 21: Compliance Alerts
- [x] Create compliance monitoring service
- [x] Concentration risk detection (>10% single holding)
- [x] Risk profile suitability checks (aggressive/moderate/conservative)
- [x] Annual review requirement tracking
- [x] Automated alert generation with severity levels
- [x] Large position monitoring
- [x] Underperforming holdings detection
- [x] Compliance dashboard UI with filtering
- [x] Visual alert badges (critical/warning/info)
- [x] Alert detail views with remediation suggestions
- [x] Stats cards showing alert breakdown
- [x] Search and filter functionality
- [x] Color-coded severity indicators
- [x] Affected holdings display
- [ ] Export compliance reports (future enhancement)

## Phase 22: Scheduled Compliance Scanning
- [x] Install node-cron for scheduling
- [x] Create nightly compliance scan job (2 AM)
- [x] Email notification service for critical alerts
- [x] Alert summary email template
- [x] Track alert history to detect new alerts
- [x] Manual trigger endpoint for testing
- [x] "Run Scan Now" button in compliance dashboard
- [x] Initialize job on server startup

## Bug Fixes
- [x] Fix nested anchor tag error in sidebar navigation
