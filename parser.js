class ResumeParser {
  constructor() {
    this.emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    this.phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  }

  parseResume(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    return {
      name: this.extractName(lines),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      skills: this.extractSkills(text, lines),
      experience: this.extractExperience(text, lines),
      education: this.extractEducation(text, lines)
    };
  }

  extractName(lines) {
    // First non-empty line is typically the name
    for (let line of lines) {
      if (line && !line.toLowerCase().includes('resume') && 
          !line.toLowerCase().includes('curriculum vitae') &&
          !this.emailRegex.test(line) && !this.phoneRegex.test(line)) {
        return line;
      }
    }
    return "";
  }

  extractEmail(text) {
    const match = text.match(this.emailRegex);
    return match ? match[0] : "";
  }

  extractPhone(text) {
    const match = text.match(this.phoneRegex);
    return match ? match[0] : "";
  }

  extractSkills(text, lines) {
    const skillsKeywords = ['skills', 'technical skills', 'technologies', 'expertise', 'skill'];
    const skills = new Set();
    
    let inSkillsSection = false;
    let skillsSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Check if line starts with "skills:" or "skills" or similar
      if (skillsKeywords.some(keyword => 
        lowerLine === keyword || 
        lowerLine.startsWith(keyword + ':') ||
        lowerLine.startsWith(keyword + ' ')
      )) {
        inSkillsSection = true;
        // If skills are on the same line (e.g., "skills: react, node")
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          skillsSection += ' ' + line.substring(colonIndex + 1);
        }
        continue;
      }
      
      if (inSkillsSection) {
        if (this.isSectionHeader(line)) {
          break;
        }
        skillsSection += ' ' + line;
      }
    }
    
    if (skillsSection) {
      // Split by common delimiters
      const skillArray = skillsSection.split(/[,|•·\n]/)
        .map(s => s.trim())
        .filter(s => s && s.length > 1 && s.length < 30);
      
      skillArray.forEach(skill => {
        // Normalize skill names
        const normalized = this.normalizeSkill(skill);
        if (normalized) skills.add(normalized);
      });
    }
    
    return Array.from(skills);
  }

  normalizeSkill(skill) {
    const cleanSkill = skill.replace(/[()]/g, '').trim();
    
    // Common normalizations
    const normalizations = {
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'react': 'React.js',
      'reactjs': 'React.js',
      'react.js': 'React.js',
      'nodejs': 'Node.js',
      'node': 'Node.js',
      'node.js': 'Node.js',
      'nextjs': 'Next.js',
      'next.js': 'Next.js',
      'next': 'Next.js',
      'python': 'Python',
      'mongodb': 'MongoDB',
      'mongo': 'MongoDB',
      'aws': 'AWS',
      'docker': 'Docker',
      'typescript': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS'
    };
    
    const lower = cleanSkill.toLowerCase();
    return normalizations[lower] || cleanSkill;
  }

  extractExperience(text, lines) {
    const experienceKeywords = ['experience', 'work experience', 'employment', 'work history', 'role'];
    const experiences = [];
    
    let inExperienceSection = false;
    let i = 0;
    
    // Find the experience section
    for (; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      if (experienceKeywords.some(keyword => 
        lowerLine === keyword || 
        lowerLine.startsWith(keyword + ':') ||
        lowerLine.startsWith(keyword + ' ')
      )) {
        inExperienceSection = true;
        
        // Check if role is on the same line (e.g., "role: Frontend Developer")
        const colonIndex = lines[i].indexOf(':');
        if (colonIndex !== -1) {
          const role = lines[i].substring(colonIndex + 1).trim();
          if (role) {
            experiences.push({
              role: role,
              company: "",
              duration: "",
              description: ""
            });
          }
        }
        i++;
        break;
      }
    }
    
    if (!inExperienceSection) return [];
    
    // Parse experience entries
    while (i < lines.length) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Check if we've hit another section
      if (this.isSectionHeader(line) && !experienceKeywords.some(k => lowerLine.includes(k))) {
        break;
      }
      
      // Skip empty lines
      if (!line || line.length === 0) {
        i++;
        continue;
      }
      
      // Skip if current line is a date (orphaned duration)
      if (this.containsDateRange(line)) {
        i++;
        continue;
      }
      
      // Start of a new experience entry (role line)
      const role = line;
      i++;
      
      // Next line should be company (skip if empty)
      let company = "";
      if (i < lines.length && lines[i] && !this.isSectionHeader(lines[i]) && !this.containsDateRange(lines[i])) {
        company = lines[i];
        i++;
      }
      
      // Next line should be duration
      let duration = "";
      if (i < lines.length && this.containsDateRange(lines[i])) {
        duration = lines[i];
        i++;
      }
      
      // Collect description lines until next role or section
      let description = "";
      while (i < lines.length) {
        const nextLine = lines[i];
        
        // Stop if we hit a section header
        if (this.isSectionHeader(nextLine)) {
          break;
        }
        
        // Stop if we hit what looks like a new role (line followed by a date line)
        if (i + 2 < lines.length && 
            !this.containsDateRange(nextLine) &&
            nextLine.length > 0 &&
            lines[i + 1] && 
            !this.containsDateRange(lines[i + 1]) &&
            lines[i + 2] &&
            this.containsDateRange(lines[i + 2])) {
          break;
        }
        
        // Stop if next line looks like a new role (has date on line after next)
        if (i + 1 < lines.length &&
            !this.containsDateRange(nextLine) &&
            nextLine.length > 0 &&
            lines[i + 1] &&
            this.containsDateRange(lines[i + 1])) {
          break;
        }
        
        if (nextLine && nextLine.length > 0 && !this.containsDateRange(nextLine)) {
          description += (description ? ' ' : '') + nextLine;
        }
        i++;
      }
      
      if (role) {
        experiences.push({
          role: role,
          company: company,
          duration: duration,
          description: this.summarizeDescription(description)
        });
      }
    }
    
    return experiences.filter(exp => exp.role);
  }

  extractEducation(text, lines) {
    const educationKeywords = ['education', 'academic', 'qualification', 'degree'];
    const education = [];
    
    let inEducationSection = false;
    let currentEdu = null;
    let expectingDegree = false;
    let expectingInstitution = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (educationKeywords.some(keyword => 
        lowerLine === keyword || 
        lowerLine.startsWith(keyword + ':') ||
        lowerLine.startsWith(keyword + ' ')
      )) {
        inEducationSection = true;
        expectingDegree = true;
        
        // Check if education is on the same line (e.g., "education: Tech College")
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const eduInfo = line.substring(colonIndex + 1).trim();
          if (eduInfo) {
            currentEdu = {
              institution: eduInfo,
              degree: "",
              year: ""
            };
            expectingDegree = false;
          }
        }
        continue;
      }
      
      if (inEducationSection) {
        if (this.isSectionHeader(line) && !educationKeywords.some(k => lowerLine.includes(k))) {
          if (currentEdu && (currentEdu.degree || currentEdu.institution)) education.push(currentEdu);
          break;
        }
        
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch && currentEdu) {
          // Year line
          currentEdu.year = line;
          expectingDegree = true;
          expectingInstitution = false;
        } else if (expectingDegree) {
          // First line is degree
          if (currentEdu && (currentEdu.degree || currentEdu.institution)) education.push(currentEdu);
          currentEdu = {
            institution: "",
            degree: line,
            year: ""
          };
          expectingDegree = false;
          expectingInstitution = true;
        } else if (expectingInstitution && currentEdu) {
          // Second line is institution
          currentEdu.institution = line;
          expectingInstitution = false;
        }
      }
    }
    
    if (currentEdu && (currentEdu.degree || currentEdu.institution)) education.push(currentEdu);
    
    return education.filter(edu => edu.degree || edu.institution);
  }

  isSectionHeader(line) {
    const headers = [
      'experience', 'work experience', 'employment', 'work history',
      'education', 'academic', 'qualification',
      'skills', 'technical skills', 'technologies', 'skill',
      'projects', 'certifications', 'awards', 'summary', 'objective',
      'role', 'degree'
    ];
    const lower = line.toLowerCase().replace(/[:\-]/g, '').trim();
    return headers.includes(lower) || headers.some(h => lower.startsWith(h + ' ') || lower.startsWith(h + ':'));
  }

  containsDateRange(text) {
    const patterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /\b(19|20)\d{2}\b/,
      /\bpresent\b/i,
      /\bcurrent\b/i
    ];
    return patterns.some(pattern => pattern.test(text));
  }

  summarizeDescription(description) {
    if (!description) return "";
    
    // Take first 2 sentences or 150 chars
    const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
    const summary = sentences.slice(0, 2).join(' ').trim();
    
    return summary.length > 200 ? summary.substring(0, 197) + '...' : summary;
  }
}

module.exports = ResumeParser;
