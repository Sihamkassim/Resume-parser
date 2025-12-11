const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');
const ResumeParser = require('./parser');
const JobHuntingAgent = require('./jobAgent');

// Load environment variables
dotenv.config();

// Validate API keys
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('\n❌ ERROR: GEMINI_API_KEY is missing or invalid!');
  console.error('📝 Please update your .env file with a valid Gemini API key.');
  console.error('🔑 Get your key from: https://aistudio.google.com/app/apikey\n');
  process.exit(1);
}

if (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === 'your_tavily_api_key_here') {
  console.warn('\n⚠️  WARNING: TAVILY_API_KEY is missing. Job search will use mock data.\n');
}

const app = express();
const port = process.env.PORT || 3000;

// Initialize job hunting agent
const jobAgent = new JobHuntingAgent(
  process.env.GEMINI_API_KEY,
  process.env.TAVILY_API_KEY
);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  }
});

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const parser = new ResumeParser();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Resume Parser API',
    version: '1.0.0',
    endpoints: {
      'POST /parse': 'Parse resume text and return structured JSON',
      'GET /health': 'Health check endpoint'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Parse resume endpoint
app.post('/parse', (req, res) => {
  try {
    let resumeText;
    
    // Handle both JSON and plain text
    if (typeof req.body === 'string') {
      resumeText = req.body;
    } else if (req.body.text) {
      resumeText = req.body.text;
    } else if (req.body.resume) {
      resumeText = req.body.resume;
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide resume text in the request body as plain text or JSON with "text" or "resume" field'
      });
    }
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty resume',
        message: 'Resume text cannot be empty'
      });
    }
    
    const result = parser.parseResume(resumeText);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse resume',
      message: error.message
    });
  }
});

// Parse uploaded resume file (PDF or TXT)
app.post('/parse-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF or TXT file'
      });
    }

    let resumeText;

    // Handle PDF files
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } catch (pdfError) {
        return res.status(400).json({
          error: 'PDF parsing failed',
          message: 'Could not extract text from PDF: ' + pdfError.message
        });
      }
    } 
    // Handle TXT files
    else if (req.file.mimetype === 'text/plain') {
      resumeText = req.file.buffer.toString('utf-8');
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty file',
        message: 'The uploaded file appears to be empty or unreadable'
      });
    }

    const result = parser.parseResume(resumeText);
    
    res.json({
      success: true,
      data: result,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error parsing file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse file',
      message: error.message
    });
  }
});

// Set user profile for chatbot
app.post('/set-profile', (req, res) => {
  try {
    const resumeData = req.body;
    
    if (!resumeData || !resumeData.name) {
      return res.status(400).json({
        error: 'Invalid profile data',
        message: 'Please provide valid resume data'
      });
    }

    jobAgent.setUserProfile(resumeData);
    jobAgent.clearHistory(); // Clear previous conversation

    res.json({
      success: true,
      message: 'Profile set successfully. You can now chat with the job assistant!'
    });

  } catch (error) {
    console.error('Error setting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set profile',
      message: error.message
    });
  }
});

// Chat with job hunting assistant
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty message',
        message: 'Please provide a message'
      });
    }

    const response = await jobAgent.chat(message);

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Chat failed',
      message: error.message
    });
  }
});

// Get conversation history
app.get('/chat-history', (req, res) => {
  try {
    const history = jobAgent.getHistory();
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get history'
    });
  }
});

// Clear conversation
app.post('/clear-chat', (req, res) => {
  try {
    jobAgent.clearHistory();
    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Resume Parser Server running!`);
  console.log(`\n📱 Web UI:        http://localhost:${port}`);
  console.log(`🔌 API Endpoint:  http://localhost:${port}/parse`);
  console.log(`❤️  Health Check:  http://localhost:${port}/health\n`);
});

module.exports = app;
