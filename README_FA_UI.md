# Financial Advisor Meeting Prep Assistant - UI

A professional, minimal interface for financial advisors featuring meeting preparation, client management, AI-powered insights, and report generation.

## 🎨 Design System

### Color Palette
- **Steel Blue** (#4682B4) - Primary action color for buttons, links, and highlights
- **Cool Gray** (#F2F2F4 - #C7C8CA) - Secondary backgrounds and separators
- **White** (#FFFFFF) - Main backgrounds and content panels

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Style**: Clean, professional sans-serif optimized for financial data

### Visual Language
- Crisp edges with ample whitespace
- Subtle shadows and soft card surfaces
- Minimal, trust-centered design
- Optimized for 3-7 minute pre-meeting prep

## 📋 Features

### 1. Dashboard Home
- **Meeting Prep Summary Card** - Today's upcoming clients with top 3 talking points
- **Insights & News Panel** - Market updates and client-specific holdings news
- **Task & To-Do Card** - Auto-generated tasks from AI analysis
- **Quick Metrics** - At-a-glance portfolio performance

### 2. Client Management
- **Client List** - Searchable, filterable list of all clients
- **Client Detail Screen** - Comprehensive client overview with:
  - Net worth and portfolio value
  - Performance metrics (1-day, YTD)
  - Top holdings with allocation bars
  - Recent transactions
  - Meeting history

### 3. Meeting Preparation
- **AI-Generated Talking Points** - Key discussion topics
- **Portfolio Risk Flags** - Items requiring attention
- **Recommended Questions** - Topics to discuss
- **Client-Specific News** - Relevant market updates

### 4. AI Co-Pilot Drawer
- **Natural Language Input** - Ask questions about clients
- **Quick Actions** - Pre-built prompts for common tasks
- **Chat History** - Previous conversations
- **Real-time Responses** - Powered by backend API

### 5. Report Generation
- **Drag-and-Drop Canvas** - Build custom reports
- **Component Library**:
  - Holdings Summary
  - Client Goals
  - AI Insights
  - Risks & Opportunities
- **Export Options** - PDF and email

## 🏗️ Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with OKLCH colors
- **tRPC** - Type-safe API client
- **Wouter** - Lightweight routing
- **shadcn/ui** - Component library

### Backend Stack
- **Express 4** - Server framework
- **tRPC 11** - Type-safe API
- **Drizzle ORM** - Database access
- **MySQL/TiDB** - Database
- **Manus OAuth** - Authentication

### Database Schema
- **users** - Advisor accounts with firm info
- **clients** - Client profiles and metrics
- **holdings** - Portfolio positions
- **meetings** - Meeting notes and talking points
- **tasks** - To-do items
- **newsCache** - Market news and insights
- **aiQueries** - AI interaction history

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm
- MySQL/TiDB database

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables
All environment variables are automatically injected by the Manus platform:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_TITLE` - Application title
- `OAUTH_SERVER_URL` - OAuth backend URL
- And more...

## 📱 Navigation Structure

### Sidebar Navigation
1. **Home** - Dashboard with today's meetings
2. **Clients** - Client list and management
3. **Holdings** - Portfolio positions (placeholder)
4. **Reports** - Report library (placeholder)
5. **Tasks** - Task management (placeholder)
6. **Documents** - Document storage (placeholder)
7. **AI Insights** - AI analysis dashboard (placeholder)

### Top Navigation
- **Search** - Global search for clients and holdings
- **Notifications** - System alerts
- **Settings** - User preferences
- **User Menu** - Profile and logout

## 🎯 Key User Flows

### 1. Morning Prep Workflow
1. Advisor logs in
2. Dashboard shows today's meetings
3. Click "View Details" on a meeting
4. Review AI-generated talking points
5. Check portfolio risk flags
6. Open AI drawer for additional questions
7. Generate meeting report

### 2. Client Review Workflow
1. Navigate to Clients
2. Search/filter for specific client
3. Click client name
4. Review portfolio performance
5. Check recent transactions
6. Review recommended questions
7. Generate custom report

### 3. AI Interaction Workflow
1. Open AI drawer (from any client page)
2. Type natural language question
3. Or use quick action button
4. Review AI response
5. Add insights to report
6. Continue conversation

## 🔌 API Integration

### tRPC Procedures

#### Clients
- `clients.list` - Get all clients for advisor
- `clients.getById` - Get client details
- `clients.create` - Create new client

#### Holdings
- `holdings.getByClient` - Get client holdings
- `holdings.create` - Add new holding

#### Meetings
- `meetings.getByClient` - Get meeting history
- `meetings.create` - Schedule new meeting

#### Tasks
- `tasks.list` - Get advisor tasks
- `tasks.create` - Create new task

#### AI
- `ai.query` - Send AI query
- `ai.history` - Get query history

#### News
- `news.getByTicker` - Get news for ticker

### Backend API Integration (TODO)
To integrate with the FA AI System backend:

1. Update `server/routers.ts` in the `ai.query` mutation
2. Replace mock response with actual API call:

```typescript
// TODO: Replace with actual API call
const response = await fetch('http://fa-ai-system:8000/api/v1/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: input.query,
    fa_id: ctx.user.advisorId,
    include_news: true,
  }),
});

const result = await response.json();
```

## 🎨 Design Principles

### 1. Professional & Trust-Centered
- Restrained color palette
- Clean typography
- Ample whitespace
- Subtle shadows

### 2. Speed of Understanding
- Card-based layout
- Clear hierarchy
- Scannable content
- Progressive disclosure

### 3. Data Accuracy
- Type-safe API
- Validation at all layers
- Error handling
- Loading states

### 4. Advisor Efficiency
- Quick actions
- Keyboard shortcuts
- Optimized workflows
- Minimal clicks

## 📊 Performance Targets

- **Meeting Prep**: < 3 minutes
- **Client Search**: < 1 second
- **AI Response**: < 5 seconds
- **Report Generation**: < 10 seconds

## 🔒 Security

- **OAuth Authentication** - Manus OAuth integration
- **Session Management** - Secure JWT tokens
- **Role-Based Access** - Admin vs. user roles
- **Data Encryption** - HTTPS only
- **Input Validation** - Zod schemas

## 📱 Responsive Design

- **Desktop First** - Optimized for 1400px+ screens
- **Tablet Support** - 768px+ breakpoints
- **Mobile Friendly** - Collapsible navigation
- **Touch Optimized** - Large tap targets

## 🎓 Next Steps

### Immediate
1. Integrate with FA AI System backend API
2. Implement PDF export functionality
3. Add email integration
4. Complete placeholder pages

### Future Enhancements
1. Real-time notifications
2. Calendar integration
3. Document upload/storage
4. Advanced charting
5. Mobile app
6. Offline mode

## 📝 Development Notes

### Adding New Features
1. Update database schema in `drizzle/schema.ts`
2. Run `pnpm db:push`
3. Add query helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build UI components in `client/src/`
6. Use `trpc.*.useQuery/useMutation` hooks

### Component Structure
```
client/src/
├── components/
│   ├── layout/        # Navigation, header, sidebar
│   ├── dashboard/     # Dashboard-specific components
│   ├── client/        # Client management components
│   ├── ai/            # AI drawer and chat
│   └── ui/            # shadcn/ui components
├── pages/             # Route pages
└── lib/               # Utilities and tRPC client
```

### Styling Guidelines
- Use Tailwind utilities
- Leverage design tokens (bg-primary, text-muted-foreground)
- Use card-shadow utilities for consistency
- Follow steel blue color scheme
- Maintain whitespace and breathing room

## 🤝 Contributing

This is a production-ready template. To customize:
1. Update color palette in `client/src/index.css`
2. Modify navigation items in `client/src/components/layout/Sidebar.tsx`
3. Add new pages in `client/src/pages/`
4. Register routes in `client/src/App.tsx`

## 📄 License

Copyright © 2025 Advisor AI. All rights reserved.

---

**Built with ❤️ for Financial Advisors**
