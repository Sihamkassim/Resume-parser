const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class JobHuntingAgent {
  constructor(geminiKey, tavilyKey) {
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      throw new Error('❌ GEMINI_API_KEY is missing or invalid. Please set it in your .env file. Get your key from: https://aistudio.google.com/app/apikey');
    }
    if (!tavilyKey || tavilyKey === 'your_tavily_api_key_here') {
      console.warn('⚠️  TAVILY_API_KEY is missing. Job search will use mock data.');
    }
    
    this.genAI = new GoogleGenerativeAI(geminiKey);
    // Use gemini-2.5-flash which is available on the current API
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });
    this.tavilyKey = tavilyKey;
    this.conversationHistory = [];
    this.userProfile = null;
  }

  // Set user's resume data as context
  setUserProfile(resumeData) {
    this.userProfile = resumeData;
    console.log('User profile set:', resumeData.name);
  }

  // Search for jobs using Tavily API
  async searchJobs(query, maxResults = 5) {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyKey,
        query: query,
        search_depth: 'advanced',
        max_results: maxResults,
        include_domains: ['linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com']
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Tavily search error:', error.message);
      // Fallback to mock data if Tavily fails
      return this.getMockJobResults(query);
    }
  }

  // Fallback mock job data
  getMockJobResults(query) {
    const mockJobs = [
      {
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        url: 'https://example.com/job1',
        content: 'Looking for experienced React.js developer with 3+ years experience. Strong knowledge of Next.js, TypeScript, and modern frontend tools required.'
      },
      {
        title: 'Full Stack Engineer',
        company: 'StartUp Labs',
        location: 'Remote',
        url: 'https://example.com/job2',
        content: 'Join our fast-growing startup! Need developer skilled in React, Node.js, MongoDB. Work on cutting-edge web applications.'
      },
      {
        title: 'Frontend Software Engineer',
        company: 'Digital Solutions',
        location: 'New York, NY',
        url: 'https://example.com/job3',
        content: 'Build beautiful user interfaces with React.js and Tailwind CSS. Experience with responsive design and modern JavaScript required.'
      }
    ];

    return mockJobs.slice(0, 3);
  }

  // Generate search query based on user profile
  generateSearchQuery(userMessage) {
    if (!this.userProfile) {
      return userMessage;
    }

    const skills = this.userProfile.skills?.slice(0, 3).join(', ') || 'software developer';
    const role = this.userProfile.experience?.[0]?.role || 'developer';
    
    // If user asks generic question, use their profile
    if (userMessage.toLowerCase().includes('find') || 
        userMessage.toLowerCase().includes('job') ||
        userMessage.toLowerCase().includes('opportunity')) {
      return `${role} jobs ${skills} openings`;
    }
    
    return userMessage;
  }

  // Analyze job match based on user profile
  analyzeJobMatch(job) {
    if (!this.userProfile) {
      return { score: 50, reasons: ['Profile not available'] };
    }

    const reasons = [];
    let score = 0;

    const jobText = (job.title + ' ' + job.content).toLowerCase();
    const userSkills = this.userProfile.skills || [];
    
    // Check skill matches
    const matchedSkills = userSkills.filter(skill => 
      jobText.includes(skill.toLowerCase())
    );

    if (matchedSkills.length > 0) {
      score += matchedSkills.length * 15;
      reasons.push(`Matches your skills: ${matchedSkills.join(', ')}`);
    }

    // Check experience level
    if (this.userProfile.experience?.length > 0) {
      const currentRole = this.userProfile.experience[0].role.toLowerCase();
      if (jobText.includes(currentRole) || job.title.toLowerCase().includes(currentRole)) {
        score += 20;
        reasons.push('Matches your current role');
      }
    }

    // Ensure minimum score
    score = Math.max(score, 40);
    score = Math.min(score, 100);

    return { score, reasons };
  }

  // Main chat function
  async chat(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Check if user is asking for jobs
      const isJobQuery = this.isJobSearchQuery(userMessage);
      let jobResults = [];
      let searchPerformed = false;

      if (isJobQuery && this.userProfile) {
        // Generate search query
        const searchQuery = this.generateSearchQuery(userMessage);
        console.log('Searching jobs with query:', searchQuery);
        
        // Search for jobs
        jobResults = await this.searchJobs(searchQuery);
        searchPerformed = true;

        // Analyze matches
        jobResults = jobResults.map(job => ({
          ...job,
          match: this.analyzeJobMatch(job)
        }));
      }

      // Build context for Gemini
      const prompt = this.buildPromptWithContext(jobResults, searchPerformed, userMessage);

      // Call Google Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const assistantMessage = response.text();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return {
        message: assistantMessage,
        jobs: searchPerformed ? jobResults : [],
        searchPerformed
      };

    } catch (error) {
      console.error('Chat error:', error.message);
      console.error('Full error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('API key not valid')) {
        throw new Error('❌ Invalid Gemini API Key. Please check your GEMINI_API_KEY in .env file. Get a new key from: https://aistudio.google.com/app/apikey');
      } else if (error.message.includes('404 Not Found') || error.message.includes('not found')) {
        throw new Error(`❌ Model "gemini-flash-latest" not found. Error: ${error.message}`);
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('⚠️  API quota exceeded. Please check your Gemini API usage limits.');
      } else {
        throw new Error('Failed to process your request: ' + error.message);
      }
    }
  }

  // Check if message is a job search query
  isJobSearchQuery(message) {
    const keywords = ['job', 'position', 'opportunity', 'opening', 'hiring', 'career', 'find', 'search', 'looking for', 'available'];
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Build complete prompt with context for Gemini
  buildPromptWithContext(jobResults, searchPerformed, userMessage) {
    let prompt = `You are an intelligent job-hunting assistant. You help users find jobs that match their resume and skills.

`;

    if (this.userProfile) {
      prompt += `USER PROFILE:
Name: ${this.userProfile.name || 'Not provided'}
Email: ${this.userProfile.email || 'Not provided'}
Skills: ${this.userProfile.skills?.join(', ') || 'Not provided'}
`;

      if (this.userProfile.experience?.length > 0) {
        prompt += `\nExperience:\n`;
        this.userProfile.experience.forEach((exp, i) => {
          prompt += `${i + 1}. ${exp.role} at ${exp.company} (${exp.duration})\n`;
        });
      }

      if (this.userProfile.education?.length > 0) {
        prompt += `\nEducation:\n`;
        this.userProfile.education.forEach((edu, i) => {
          prompt += `${i + 1}. ${edu.degree} from ${edu.institution} (${edu.year})\n`;
        });
      }
    }

    if (searchPerformed && jobResults.length > 0) {
      prompt += `\n\nJOB SEARCH RESULTS:
I found ${jobResults.length} job openings. Here are the details:\n\n`;

      jobResults.forEach((job, i) => {
        prompt += `Job ${i + 1}:
Title: ${job.title}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Match Score: ${job.match?.score || 50}%
Why it matches: ${job.match?.reasons?.join(', ') || 'Based on general fit'}
Description: ${job.content?.substring(0, 200)}...
URL: ${job.url}

`;
      });

      prompt += `\nYour task: Present these job opportunities to the user in a friendly, conversational way. Explain WHY each job is a good match based on their skills and experience. Highlight the most relevant matches first. Be encouraging and helpful.`;
    } else if (searchPerformed && jobResults.length === 0) {
      prompt += `\n\nNo specific job listings were found. Provide helpful advice on how to improve their job search or suggest alternative strategies.`;
    } else {
      prompt += `\n\nThe user hasn't asked for a job search yet. Be helpful and ask how you can assist them in their job search. Mention that you can find jobs that match their resume.`;
    }

    // Add conversation history
    if (this.conversationHistory.length > 1) {
      prompt += `\n\nCONVERSATION HISTORY:\n`;
      this.conversationHistory.slice(-6).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    prompt += `\n\nUser's current message: ${userMessage}\n\nRespond in a helpful, friendly, and professional manner.`;

    return prompt;
  }

  // Build system prompt with context (kept for compatibility but not used with Gemini)
  buildSystemPrompt(jobResults, searchPerformed) {
    let prompt = `You are an intelligent job-hunting assistant. You help users find jobs that match their resume and skills.

`;

    if (this.userProfile) {
      prompt += `USER PROFILE:
Name: ${this.userProfile.name || 'Not provided'}
Email: ${this.userProfile.email || 'Not provided'}
Skills: ${this.userProfile.skills?.join(', ') || 'Not provided'}
`;

      if (this.userProfile.experience?.length > 0) {
        prompt += `\nExperience:\n`;
        this.userProfile.experience.forEach((exp, i) => {
          prompt += `${i + 1}. ${exp.role} at ${exp.company} (${exp.duration})\n`;
        });
      }

      if (this.userProfile.education?.length > 0) {
        prompt += `\nEducation:\n`;
        this.userProfile.education.forEach((edu, i) => {
          prompt += `${i + 1}. ${edu.degree} from ${edu.institution} (${edu.year})\n`;
        });
      }
    }

    if (searchPerformed && jobResults.length > 0) {
      prompt += `\n\nJOB SEARCH RESULTS:
I found ${jobResults.length} job openings. Here are the details:\n\n`;

      jobResults.forEach((job, i) => {
        prompt += `Job ${i + 1}:
Title: ${job.title}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Match Score: ${job.match?.score || 50}%
Why it matches: ${job.match?.reasons?.join(', ') || 'Based on general fit'}
Description: ${job.content?.substring(0, 200)}...
URL: ${job.url}

`;
      });

      prompt += `\nYour task: Present these job opportunities to the user in a friendly, conversational way. Explain WHY each job is a good match based on their skills and experience. Highlight the most relevant matches first. Be encouraging and helpful.`;
    } else if (searchPerformed && jobResults.length === 0) {
      prompt += `\n\nNo specific job listings were found. Provide helpful advice on how to improve their job search or suggest alternative strategies.`;
    } else {
      prompt += `\n\nThe user hasn't asked for a job search yet. Be helpful and ask how you can assist them in their job search. Mention that you can find jobs that match their resume.`;
    }

    return prompt;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }
}

module.exports = JobHuntingAgent;
