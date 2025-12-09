const ResumeParser = require('./parser');
const fs = require('fs');
const path = require('path');

async function main() {
  const parser = new ResumeParser();
  
  // Example usage with text input
  const sampleResume = `
John Doe
Email: john.doe@email.com
Phone: +1-555-123-4567

SKILLS
JavaScript, React.js, Node.js, Python, MongoDB, AWS, Docker

EXPERIENCE

Senior Software Engineer
Tech Corp Inc.
Jan 2022 - Present
Led development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines and reduced deployment time by 60%.

Software Developer
StartupXYZ
Jun 2019 - Dec 2021
Developed full-stack web applications using React and Node.js. Collaborated with cross-functional teams to deliver features on time.

EDUCATION

Bachelor of Science in Computer Science
University of Technology
2015 - 2019
  `;

  try {
    console.log('Parsing resume...\n');
    const result = await parser.parseResume(sampleResume);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error parsing resume:', error.message);
  }
}

main();
