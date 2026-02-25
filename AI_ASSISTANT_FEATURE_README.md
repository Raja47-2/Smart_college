# AI Assistant Feature - Smart College

## Overview
A new **AI Assistant** section has been added to the Smart College management system that helps students and teachers resolve academic doubts instantly using an AI-powered question and answer system.

## What Was Added

### Frontend Components

#### 1. **[src/pages/AiDoubt.jsx](src/pages/AiDoubt.jsx)** - Main AI Assistant Page
- Interactive chat interface for asking questions
- Real-time message display with user and AI responses
- **6 Question Categories**:
  - General Question
  - Subject Help
  - Assignment Help
  - Concept Clarification
  - Exam Preparation
  - Career Guidance

- **Features**:
  - Message history display
  - Category-based responses
  - Quick suggestion buttons for common questions
  - Loading indicators while AI processes
  - Responsive design (works on mobile and desktop)
  - Scroll-to-bottom auto-scroll for messages
  - Keyboard shortcut (Enter to send, Shift+Enter for new line)

#### 2. **[src/pages/AiDoubt.css](src/pages/AiDoubt.css)** - Styling
- Modern gradient design (purple/blue theme)
- Responsive layout with sidebar navigation
- Animations for message display
- Mobile-friendly bottom navigation support

### Backend Components

#### 1. **[server/routes/ai.js](server/routes/ai.js)** - API Routes
Provides three main endpoints:

- **POST `/api/ai/ask-doubt`** - Main endpoint for submitting questions
  - Accepts question, category, user type, and conversation context
  - Returns AI-generated response with sources
  - Stores history in database

- **GET `/api/ai/doubt-history`** - Retrieves user's question history
  - Returns last 50 doubts asked by the user
  - Sorted by most recent first

- **GET `/api/ai/stats`** - Gets user's AI usage statistics
  - Total doubts asked
  - Number of categories explored

#### 2. **[server/migrate_ai_doubts.js](server/migrate_ai_doubts.js)** - Database Setup
Migration script to create the `ai_doubts` table with columns:
- `id` (Primary Key)
- `user_id` (Links to users table)
- `question` (The question asked)
- `category` (Question category)
- `response` (AI-generated response)
- `user_type` (Student/Teacher/Admin)
- `timestamp` (When the question was asked)

### Navigation & Integration

#### 1. **[src/App.jsx](src/App.jsx)** - Updated Routes
- Added import for `AiDoubt` component
- New route: `/ai-doubt` for accessing the AI Assistant

#### 2. **[src/components/Layout.jsx](src/components/Layout.jsx)** - Navigation Menu
- Added Lightbulb icon import from lucide-react
- Added "AI Assistant" menu item in sidebar
- Accessible to all users (Students, Teachers, and Admins)

#### 3. **[server/index.js](server/index.js)** - Server Configuration
- Added import for AI routes
- Registered routes at `/api/ai` prefix

## How to Use

### For Students:
1. Click **"AI Assistant"** in the sidebar menu
2. Select a question category (or keep it as "General Question")
3. Type your doubt/question in the input field
4. Press **Enter** or click the **Send** button
5. Get instant AI-powered response with explanations

### For Teachers:
1. Same process as students
2. Use the **Career Guidance** category for professional questions
3. Use **Concept Clarification** for explaining complex topics

## Setup Instructions

### 1. Create the Database Table
Run the migration script before using the feature:
```bash
node server/migrate_ai_doubts.js
```

### 2. Start the Application
Ensure both frontend and backend are running:
```bash
# Terminal 1 - Start backend server
npm run server:dev

# Terminal 2 - Start frontend
npm run dev
```

### 3. Access the Feature
- Login to the Smart College portal
- Click on **"AI Assistant"** in the sidebar
- Start asking questions!

## AI Response System

The AI system uses a **category-based response generator** with built-in knowledge about:
- **Derivatives** - Mathematical concepts and applications
- **Photosynthesis** - Biology fundamentals
- **Study Tips** - Learning strategies and techniques
- **General Topics** - Basic explanations and guidance

### How It Works:
1. User submits a question with a category
2. AI analyzes the question content
3. Generates contextual response based on category
4. Stores the Q&A in database for history
5. Returns response with source attribution

## Database Schema

```sql
CREATE TABLE ai_doubts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    response TEXT NOT NULL,
    user_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Future Enhancements

The system is ready to integrate with:
- **OpenAI GPT API** - For more sophisticated responses
- **Google APIs** - For real-time information
- **Database of Learning Materials** - To provide citations
- **Machine Learning Models** - For personalized responses
- **Multi-language Support** - For diverse student base
- **Voice Input/Output** - For accessibility

## Files Modified/Created

| File | Type | Purpose |
|------|------|---------|
| [src/pages/AiDoubt.jsx](src/pages/AiDoubt.jsx) | NEW | Main AI chat interface |
| [src/pages/AiDoubt.css](src/pages/AiDoubt.css) | NEW | Styling for AI page |
| [server/routes/ai.js](server/routes/ai.js) | NEW | API endpoints |
| [server/migrate_ai_doubts.js](server/migrate_ai_doubts.js) | NEW | Database migration |
| [src/App.jsx](src/App.jsx) | MODIFIED | Added AI route |
| [server/index.js](server/index.js) | MODIFIED | Added AI route handler |
| [src/components/Layout.jsx](src/components/Layout.jsx) | MODIFIED | Added AI menu item |

## Notes

- The feature requires user authentication (users must be logged in)
- All doubts are stored with user ID for personalization
- Requires token-based authentication (JWT)
- Responses are built-in demonstrations; production use should integrate real AI service
- Mobile-responsive design ensures usability on all devices

---

**Status**: ✅ Ready to use
**Authentication**: Required (JWT Token)
**Access Level**: All authenticated users
