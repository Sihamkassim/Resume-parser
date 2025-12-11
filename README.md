# Resume Parser & AI Job Hunting Assistant

A complete AI-powered system that extracts structured information from resumes and provides an intelligent job-hunting chatbot that uses your resume data to find personalized job opportunities.

## Features

### Part 1: Resume Parser
- ✅ **Modern Web UI** - Beautiful, responsive interface built with Tailwind CSS
- ✅ **PDF & Text Upload** - Drag & drop or browse files
- ✅ Extract name, email, and phone number
- ✅ Parse and normalize skills 
- ✅ Extract work experience with role, company, duration, and description
- ✅ Parse education history
- ✅ **Auto-fill Form** - Editable form with parsed data
- ✅ **Dual View** - Switch between Form and JSON views
- ✅ REST API for easy integration

### Part 2: AI Job Hunting Assistant
- 🤖 **Gemini-Powered Chatbot** - Intelligent conversation using Google Gemini
- 🔍 **Real-time Job Search** - Integrates with Tavily Search API
- 🎯 **Personalized Results** - Matches jobs based on your resume
- 💡 **Smart Matching** - Explains why each job fits your profile
- 📊 **Match Scoring** - Shows compatibility percentage for each job
- 💬 **Natural Conversation** - Chat naturally about your job preferences

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
PORT=3000
```

**Get API Keys:**
- Google Gemini: https://makersuite.google.com/app/apikey
- Tavily: https://tavily.com/

## Usage

**Start the server:**
```bash
npm start
```

Then open your browser:
- **Resume Parser**: http://localhost:3000
- **Job Assistant**: http://localhost:3000/chatbot.html

## How It Works

### Step 1: Parse Your Resume
1. Visit http://localhost:3000
2. Upload your resume (PDF/TXT) or paste text
3. Click "Parse Resume"
4. View and edit the extracted data in form or JSON view

### Step 2: Find Jobs with AI Assistant
1. After parsing, click "Chat with Job Assistant"
2. Your resume data is automatically loaded as context
3. Ask the chatbot to find jobs (e.g., "Find frontend developer jobs")
4. The AI searches real job listings and explains why each matches your profile
5. Get personalized recommendations with match scores

## Example Interactions

**User:** "Find jobs that match my skills"
**AI:** Searches for jobs using your skills (React.js, Node.js, etc.) and explains why each job is a good fit based on your experience.

**User:** "Are there any remote frontend positions?"
**AI:** Searches specifically for remote frontend jobs and highlights matches with your React.js and JavaScript skills.

## API Endpoints

## API Endpoints

### Resume Parser
- `POST /parse` - Parse resume text
- `POST /parse-file` - Upload and parse PDF/TXT file

### Job Hunting Chatbot
- `POST /set-profile` - Set user's resume as context
- `POST /chat` - Send message to AI assistant
- `GET /chat-history` - Get conversation history
- `POST /clear-chat` - Clear conversation

## Project Structure

```
├── server.js           # Express server with all endpoints
├── parser.js           # Resume parsing logic
├── jobAgent.js         # AI job hunting agent
├── public/
│   ├── index.html      # Resume parser UI
│   ├── app.js          # Parser frontend logic
│   ├── chatbot.html    # Job assistant UI
│   └── chatbot.js      # Chatbot frontend logic
├── package.json        # Dependencies
├── .env                # API keys (create this)
└── README.md           # Documentation
```

## Technologies Used

- **Backend:** Node.js, Express, Multer, PDF-Parse
- **AI:** OpenAI GPT-3.5-turbo
- **Search:** Tavily Search API
- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript
- **Storage:** LocalStorage for resume data

## Requirements

## Requirements

- Node.js 14+
- Google Gemini API Key
- Tavily API Key

## License

ISC
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-123-4567",
    "skills": ["JavaScript", "React.js", "Node.js", "Python"],
    "experience": [
      {
        "role": "Senior Software Engineer",
        "company": "Tech Corp Inc.",
        "duration": "Jan 2022 - Present",
        "description": "Led development of microservices architecture."
      }
    ],
    "education": [
      {
        "institution": "University of Technology",
        "degree": "Bachelor of Science in Computer Science",
        "year": "2015 - 2019"
      }
    ]
  },
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

## JSON Schema

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [
    {
      "role": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "year": "string"
    }
  ]
}
```

## Project Structure

```
├── parser.js       # Core parsing logic
├── server.js       # REST API server
├── package.json    # Dependencies
└── README.md       # Documentation
```

## Requirements

- Node.js 14+

## License

ISC


"# Resume-parser" 
