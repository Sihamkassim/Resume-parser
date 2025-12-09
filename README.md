# Resume Parser API

A Node.js REST API with a beautiful web UI that extracts structured information from resume text and returns it in a clean JSON format.

## Features

- ✅ **Modern Web UI** - Beautiful, responsive interface built with Tailwind CSS
- ✅ Extract name, email, and phone number
- ✅ Parse and normalize skills 
- ✅ Extract work experience with role, company, duration, and description
- ✅ Parse education history
- ✅ REST API for easy integration
- ✅ Real-time parsing with loading states
- ✅ Copy JSON results to clipboard
- ✅ Sample resume loader
- ✅ Keyboard shortcuts (Ctrl+Enter to parse, Ctrl+K to clear)

## Installation

```bash
npm install
```

## Usage

**Start the server:**
```bash
npm start
```

Then open your browser and visit: **http://localhost:3000**

## Web UI Features

- 📝 **Paste or type** resume text in the input area
- 🎯 **Load sample** resume with one click
- ⚡ **Fast parsing** with real-time feedback
- 📊 **Visual summary** showing skills, experience, and education counts
- 📋 **Copy JSON** output to clipboard
- 🎨 **Beautiful UI** with smooth animations and transitions

## API Usage

**Endpoint:** `POST http://localhost:3000/parse`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "text": "John Doe\njohn.doe@email.com\n+1-555-123-4567\n\nSKILLS\nJavaScript, React.js, Node.js, Python\n\nEXPERIENCE\n\nSenior Software Engineer\nTech Corp Inc.\nJan 2022 - Present\nLed development of microservices architecture.\n\nEDUCATION\n\nBachelor of Science in Computer Science\nUniversity of Technology\n2015 - 2019"
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
