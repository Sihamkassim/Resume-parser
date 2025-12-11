// DOM Elements
const resumeInput = document.getElementById('resumeInput');
const parseBtn = document.getElementById('parseBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const copyBtn = document.getElementById('copyBtn');
const charCount = document.getElementById('charCount');

// Tab elements
const textTab = document.getElementById('textTab');
const fileTab = document.getElementById('fileTab');
const textPanel = document.getElementById('textPanel');
const filePanel = document.getElementById('filePanel');

// File upload elements
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const dropZone = document.getElementById('dropZone');
const uploadPrompt = document.getElementById('uploadPrompt');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileIcon = document.getElementById('fileIcon');
const removeFileBtn = document.getElementById('removeFileBtn');
const parseFileBtn = document.getElementById('parseFileBtn');

// View toggle elements
const formViewBtn = document.getElementById('formViewBtn');
const jsonViewBtn = document.getElementById('jsonViewBtn');
const formView = document.getElementById('formView');
const jsonView = document.getElementById('jsonView');

// State elements
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const resultState = document.getElementById('resultState');
const errorMessage = document.getElementById('errorMessage');
const jsonOutput = document.getElementById('jsonOutput');

// Summary elements
const skillCount = document.getElementById('skillCount');
const expCount = document.getElementById('expCount');
const eduCount = document.getElementById('eduCount');

// Form elements
const formName = document.getElementById('formName');
const formEmail = document.getElementById('formEmail');
const formPhone = document.getElementById('formPhone');
const formSkills = document.getElementById('formSkills');
const experienceContainer = document.getElementById('experienceContainer');
const educationContainer = document.getElementById('educationContainer');

// API Configuration
const API_URL = 'http://localhost:3000/parse';
const FILE_API_URL = 'http://localhost:3000/parse-file';

// Application State - Store parsed resume data
let parsedResumeData = null;

// Current file state
let currentFile = null;
let currentView = 'form'; // 'form' or 'json'

// Sample resume data
const sampleResume = `John Doe
john.doe@email.com | +1-555-123-4567

skills: JavaScript, React.js, Node.js, Python, MongoDB, AWS, Docker, TypeScript

EXPERIENCE

Senior Software Engineer
Tech Corp Inc.
Jan 2022 - Present
Led development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines and reduced deployment time by 60%. Mentored junior developers and established coding best practices.

Software Developer
StartupXYZ
Jun 2019 - Dec 2021
Developed full-stack web applications using React and Node.js. Collaborated with cross-functional teams to deliver features on time. Optimized database queries improving performance by 40%.

education: Bachelor of Science in Computer Science, University of Technology, 2014 - 2018`;

// Tab switching
textTab.addEventListener('click', () => {
    textTab.classList.add('active');
    fileTab.classList.remove('active');
    textPanel.classList.remove('hidden');
    filePanel.classList.add('hidden');
});

fileTab.addEventListener('click', () => {
    fileTab.classList.add('active');
    textTab.classList.remove('active');
    filePanel.classList.remove('hidden');
    textPanel.classList.add('hidden');
});

// File upload handlers
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.type === 'text/plain') {
            currentFile = file;
            displayFileInfo(file);
        } else {
            showToast('Please upload a PDF or TXT file', 'error');
        }
    }
});

removeFileBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    uploadPrompt.classList.remove('hidden');
    fileInfo.classList.add('hidden');
    showEmptyState();
});

parseFileBtn.addEventListener('click', async () => {
    if (currentFile) {
        await parseFile(currentFile);
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        currentFile = file;
        displayFileInfo(file);
    }
}

function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Update icon based on file type
    if (file.type === 'application/pdf') {
        fileIcon.className = 'fas fa-file-pdf text-6xl text-red-500 mb-4';
    } else {
        fileIcon.className = 'fas fa-file-alt text-6xl text-blue-500 mb-4';
    }
    
    uploadPrompt.classList.add('hidden');
    fileInfo.classList.remove('hidden');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function parseFile(file) {
    showLoadingState();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(FILE_API_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to parse file');
        }
        
        const result = await response.json();
        
        if (result.success) {
            displayResult(result.data);
            showToast(`${result.fileName} parsed successfully!`, 'success');
        } else {
            throw new Error('Parsing failed');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showErrorState(error.message);
        showToast('Error: ' + error.message, 'error');
    }
}

// View toggle handlers
formViewBtn.addEventListener('click', () => {
    currentView = 'form';
    formView.classList.remove('hidden');
    jsonView.classList.add('hidden');
    formViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
    formViewBtn.classList.add('bg-indigo-100', 'text-indigo-700');
    jsonViewBtn.classList.remove('bg-indigo-100', 'text-indigo-700');
    jsonViewBtn.classList.add('bg-gray-200', 'text-gray-700');
});

jsonViewBtn.addEventListener('click', () => {
    currentView = 'json';
    jsonView.classList.remove('hidden');
    formView.classList.add('hidden');
    jsonViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
    jsonViewBtn.classList.add('bg-indigo-100', 'text-indigo-700');
    formViewBtn.classList.remove('bg-indigo-100', 'text-indigo-700');
    formViewBtn.classList.add('bg-gray-200', 'text-gray-700');
});

// Update character count
resumeInput.addEventListener('input', () => {
    const count = resumeInput.value.length;
    charCount.textContent = `${count.toLocaleString()} characters`;
});

// Load sample resume
sampleBtn.addEventListener('click', () => {
    resumeInput.value = sampleResume;
    resumeInput.dispatchEvent(new Event('input'));
    showToast('Sample resume loaded', 'success');
});

// Clear input
clearBtn.addEventListener('click', () => {
    resumeInput.value = '';
    resumeInput.dispatchEvent(new Event('input'));
    showEmptyState();
    showToast('Cleared', 'info');
});

// Copy JSON to clipboard
copyBtn.addEventListener('click', async () => {
    const text = jsonOutput.textContent;
    try {
        await navigator.clipboard.writeText(text);
        showToast('JSON copied to clipboard!', 'success');
        copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy JSON';
        }, 2000);
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
});

// Parse resume
parseBtn.addEventListener('click', async () => {
    const text = resumeInput.value.trim();
    
    if (!text) {
        showToast('Please enter resume text', 'error');
        return;
    }
    
    await parseResume(text);
});

// Parse resume function
async function parseResume(text) {
    showLoadingState();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to parse resume');
        }
        
        const result = await response.json();
        
        if (result.success) {
            displayResult(result.data);
            showToast('Resume parsed successfully!', 'success');
        } else {
            throw new Error('Parsing failed');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showErrorState(error.message);
        showToast('Error: ' + error.message, 'error');
    }
}

// Display result
function displayResult(data) {
    // Store parsed data in application state
    parsedResumeData = data;
    
    // Save to localStorage for chatbot
    localStorage.setItem('parsedResume', JSON.stringify(data));
    
    // Display JSON
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    
    // Auto-fill form with parsed data
    populateForm(data);
    
    // Update summary cards
    skillCount.textContent = data.skills?.length || 0;
    expCount.textContent = data.experience?.length || 0;
    eduCount.textContent = data.education?.length || 0;
    
    showResultState();
    copyBtn.disabled = false;
    
    // Show chatbot notification
    showChatbotNotification();
}

// Populate form with parsed resume data
function populateForm(data) {
    // Personal Information
    formName.value = data.name || '';
    formEmail.value = data.email || '';
    formPhone.value = data.phone || '';
    
    // Skills (join array with commas)
    formSkills.value = data.skills?.join(', ') || '';
    
    // Experience
    experienceContainer.innerHTML = '';
    if (data.experience && data.experience.length > 0) {
        data.experience.forEach((exp, index) => {
            const expElement = createExperienceElement(exp, index);
            experienceContainer.appendChild(expElement);
        });
    } else {
        experienceContainer.innerHTML = '<p class="text-gray-500 text-sm">No experience data found</p>';
    }
    
    // Education
    educationContainer.innerHTML = '';
    if (data.education && data.education.length > 0) {
        data.education.forEach((edu, index) => {
            const eduElement = createEducationElement(edu, index);
            educationContainer.appendChild(eduElement);
        });
    } else {
        educationContainer.innerHTML = '<p class="text-gray-500 text-sm">No education data found</p>';
    }
}

// Create experience form element
function createExperienceElement(exp, index) {
    const div = document.createElement('div');
    div.className = 'border-l-4 border-purple-400 pl-4 space-y-2';
    div.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">Experience ${index + 1}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <input type="text" value="${escapeHtml(exp.role)}" 
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onchange="updateExperience(${index}, 'role', this.value)">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <input type="text" value="${escapeHtml(exp.company)}" 
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onchange="updateExperience(${index}, 'company', this.value)">
            </div>
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Duration</label>
            <input type="text" value="${escapeHtml(exp.duration)}" 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onchange="updateExperience(${index}, 'duration', this.value)">
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea rows="2" 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onchange="updateExperience(${index}, 'description', this.value)">${escapeHtml(exp.description)}</textarea>
        </div>
    `;
    return div;
}

// Create education form element
function createEducationElement(edu, index) {
    const div = document.createElement('div');
    div.className = 'border-l-4 border-orange-400 pl-4 space-y-2';
    div.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Education ${index + 1}</span>
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Degree</label>
            <input type="text" value="${escapeHtml(edu.degree)}" 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onchange="updateEducation(${index}, 'degree', this.value)">
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Institution</label>
            <input type="text" value="${escapeHtml(edu.institution)}" 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onchange="updateEducation(${index}, 'institution', this.value)">
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input type="text" value="${escapeHtml(edu.year)}" 
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onchange="updateEducation(${index}, 'year', this.value)">
        </div>
    `;
    return div;
}

// Update functions for form editing
window.updateExperience = (index, field, value) => {
    if (parsedResumeData && parsedResumeData.experience[index]) {
        parsedResumeData.experience[index][field] = value;
        updateJsonOutput();
    }
};

window.updateEducation = (index, field, value) => {
    if (parsedResumeData && parsedResumeData.education[index]) {
        parsedResumeData.education[index][field] = value;
        updateJsonOutput();
    }
};

// Update JSON output when form is edited
function updateJsonOutput() {
    if (parsedResumeData) {
        jsonOutput.textContent = JSON.stringify(parsedResumeData, null, 2);
    }
}

// Listen to personal info and skills changes
formName.addEventListener('input', (e) => {
    if (parsedResumeData) {
        parsedResumeData.name = e.target.value;
        updateJsonOutput();
    }
});

formEmail.addEventListener('input', (e) => {
    if (parsedResumeData) {
        parsedResumeData.email = e.target.value;
        updateJsonOutput();
    }
});

formPhone.addEventListener('input', (e) => {
    if (parsedResumeData) {
        parsedResumeData.phone = e.target.value;
        updateJsonOutput();
    }
});

formSkills.addEventListener('input', (e) => {
    if (parsedResumeData) {
        parsedResumeData.skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
        updateJsonOutput();
    }
});

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show chatbot notification
function showChatbotNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <i class="fas fa-robot text-2xl"></i>
            <div class="flex-1">
                <h4 class="font-semibold mb-1">Resume Parsed Successfully!</h4>
                <p class="text-sm text-purple-100 mb-3">Ready to find jobs that match your skills?</p>
                <a href="chatbot.html" class="inline-block bg-white text-purple-600 px-4 py-2 rounded font-semibold text-sm hover:bg-purple-50 transition">
                    <i class="fas fa-comment-dots mr-2"></i>Chat with Job Assistant
                </a>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-purple-200 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }
    }, 10000);
}

// State management
function showLoadingState() {
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    parseBtn.disabled = true;
    parseBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Parsing...';
}

function showEmptyState() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    parseBtn.disabled = false;
    parseBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Parse Resume';
    copyBtn.disabled = true;
}

function showErrorState(message) {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    resultState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessage.textContent = message;
    parseBtn.disabled = false;
    parseBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Parse Resume';
    copyBtn.disabled = true;
}

function showResultState() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultState.classList.remove('hidden');
    parseBtn.disabled = false;
    parseBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Parse Resume';
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-50`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    .animate-slide-up {
        animation: slide-up 0.3s ease;
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to parse
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        parseBtn.click();
    }
    // Ctrl/Cmd + K to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearBtn.click();
    }
});

// Initialize
showEmptyState();
