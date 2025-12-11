// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const profileStatus = document.getElementById('profileStatus');
const profileInfo = document.getElementById('profileInfo');
const profileLoaded = document.getElementById('profileLoaded');
const loadFromParserBtn = document.getElementById('loadFromParserBtn');

// Profile display elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileSkills = document.getElementById('profileSkills');
const profileExp = document.getElementById('profileExp');

// Quick prompts
const quickPrompts = document.querySelectorAll('.quick-prompt');

// State
let userProfile = null;
let isLoading = false;

// API URLs
const SET_PROFILE_URL = 'http://localhost:3000/set-profile';
const CHAT_URL = 'http://localhost:3000/chat';
const CLEAR_CHAT_URL = 'http://localhost:3000/clear-chat';

// Initialize
window.addEventListener('load', () => {
    loadProfileFromStorage();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    clearChatBtn.addEventListener('click', clearChat);
    loadFromParserBtn.addEventListener('click', loadProfileFromStorage);

    quickPrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent.trim();
            sendMessage();
        });
    });
}

// Load profile from localStorage
function loadProfileFromStorage() {
    const storedProfile = localStorage.getItem('parsedResume');
    
    if (storedProfile) {
        try {
            userProfile = JSON.parse(storedProfile);
            displayProfile(userProfile);
            setProfileOnServer(userProfile);
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Failed to load profile', 'error');
        }
    } else {
        showToast('No profile found. Please parse your resume first.', 'error');
    }
}

// Display profile in sidebar
function displayProfile(profile) {
    profileName.textContent = profile.name || 'Not provided';
    profileEmail.textContent = profile.email || 'Not provided';
    
    // Display skills as tags
    profileSkills.innerHTML = '';
    if (profile.skills && profile.skills.length > 0) {
        profile.skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded';
            tag.textContent = skill;
            profileSkills.appendChild(tag);
        });
    } else {
        profileSkills.innerHTML = '<span class="text-gray-500 text-xs">No skills listed</span>';
    }

    // Display experience count
    const expCount = profile.experience?.length || 0;
    profileExp.textContent = `${expCount} ${expCount === 1 ? 'position' : 'positions'}`;

    // Update UI
    profileInfo.classList.add('hidden');
    profileLoaded.classList.remove('hidden');
    profileStatus.classList.add('hidden');
    
    // Enable chat
    chatInput.disabled = false;
    sendBtn.disabled = false;
}

// Set profile on server
async function setProfileOnServer(profile) {
    try {
        const response = await fetch(SET_PROFILE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });

        const data = await response.json();
        
        if (data.success) {
            addBotMessage('Profile loaded! I can now help you find jobs that match your skills. What kind of job are you looking for?');
        }
    } catch (error) {
        console.error('Error setting profile:', error);
        showToast('Failed to connect to server', 'error');
    }
}

// Send message
async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message || isLoading) return;
    
    // Add user message to chat
    addUserMessage(message);
    chatInput.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    isLoading = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (data.success) {
            addBotMessage(data.message);
            
            // Display jobs if found
            if (data.searchPerformed && data.jobs && data.jobs.length > 0) {
                displayJobResults(data.jobs);
            }
        } else {
            addBotMessage('Sorry, I encountered an error. Please try again.');
        }

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addBotMessage('Sorry, I\'m having trouble connecting. Please check if the server is running.');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
    }
}

// Add user message to chat
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start justify-end';
    messageDiv.innerHTML = `
        <div class="bg-purple-600 text-white rounded-lg px-4 py-3 shadow-sm max-w-md">
            <p class="text-sm">${escapeHtml(text)}</p>
        </div>
        <div class="bg-purple-600 rounded-full p-2 ml-3 text-white">
            <i class="fas fa-user"></i>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message to chat
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start';
    messageDiv.innerHTML = `
        <div class="bg-purple-100 rounded-full p-2 mr-3">
            <i class="fas fa-robot text-purple-600"></i>
        </div>
        <div class="bg-white rounded-lg px-4 py-3 shadow-sm max-w-2xl">
            <p class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(text)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Display job results
function displayJobResults(jobs) {
    const jobsDiv = document.createElement('div');
    jobsDiv.className = 'flex items-start';
    
    let jobsHtml = '<div class="bg-purple-100 rounded-full p-2 mr-3"><i class="fas fa-briefcase text-purple-600"></i></div>';
    jobsHtml += '<div class="bg-white rounded-lg px-4 py-4 shadow-sm max-w-2xl w-full"><h4 class="font-semibold text-gray-800 mb-3"><i class="fas fa-search mr-2 text-purple-600"></i>Job Openings Found:</h4><div class="space-y-3">';
    
    jobs.forEach((job, index) => {
        const matchScore = job.match?.score || 50;
        const matchColor = matchScore >= 75 ? 'green' : matchScore >= 50 ? 'yellow' : 'gray';
        
        jobsHtml += `
            <div class="border-l-4 border-${matchColor}-400 pl-3 py-2 bg-gray-50 rounded">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h5 class="font-semibold text-gray-800 text-sm">${escapeHtml(job.title)}</h5>
                        <p class="text-xs text-gray-600">${escapeHtml(job.company || 'Company not specified')} ${job.location ? '• ' + escapeHtml(job.location) : ''}</p>
                        ${job.match?.reasons ? `<p class="text-xs text-${matchColor}-700 mt-1">✓ ${job.match.reasons.join(' • ')}</p>` : ''}
                    </div>
                    <span class="bg-${matchColor}-100 text-${matchColor}-700 text-xs px-2 py-1 rounded font-semibold ml-2">${matchScore}%</span>
                </div>
                ${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank" class="text-xs text-purple-600 hover:text-purple-800 mt-1 inline-block"><i class="fas fa-external-link-alt mr-1"></i>View Job</a>` : ''}
            </div>
        `;
    });
    
    jobsHtml += '</div></div>';
    jobsDiv.innerHTML = jobsHtml;
    chatMessages.appendChild(jobsDiv);
    scrollToBottom();
}

// Typing indicator
function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'flex items-start';
    typingDiv.innerHTML = `
        <div class="bg-purple-100 rounded-full p-2 mr-3">
            <i class="fas fa-robot text-purple-600"></i>
        </div>
        <div class="bg-white rounded-lg px-4 py-3 shadow-sm">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// Clear chat
async function clearChat() {
    try {
        await fetch(CLEAR_CHAT_URL, { method: 'POST' });
        
        // Clear messages except welcome
        chatMessages.innerHTML = `
            <div class="flex items-start">
                <div class="bg-purple-100 rounded-full p-2 mr-3">
                    <i class="fas fa-robot text-purple-600"></i>
                </div>
                <div class="bg-white rounded-lg px-4 py-3 shadow-sm max-w-md">
                    <p class="text-sm text-gray-800">Conversation cleared! How can I help you find your next job?</p>
                </div>
            </div>
        `;
        
        showToast('Conversation cleared', 'success');
    } catch (error) {
        showToast('Failed to clear conversation', 'error');
    }
}

// Utility functions
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
