const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const ResumeParser = require('./parser');

const app = express();
const port = 3000;

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
