// Import components
import { initializeImageUpload } from './components/ImageUpload.js';
import { initializeAnalysis } from './components/Analysis.js';
import { initializeEducation } from './components/Education.js';
import { initializeSubscription } from './components/Subscription.js';

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const startAnalysisBtn = document.getElementById('start-analysis-btn');

// Initialize components when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('SymptomSentryAI Web App Initialized');
    
    // Initialize components
    initializeImageUpload(document.getElementById('image-upload-component'));
    initializeAnalysis(document.getElementById('analysis-results-component'));
    initializeEducation(document.getElementById('education-component'));
    initializeSubscription(document.getElementById('subscription-component'));
    
    // Set up navigation
    setupNavigation();
    
    // Setup other event listeners
    setupEventListeners();
    
    // Initialize theme based on system preference
    initializeTheme();
});

// Setup navigation between app pages
function setupNavigation() {
    // Handle navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Update active state for nav links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
            
            // Show the target page, hide others
            showPage(targetPage);
        });
    });
    
    // Start Analysis button on home page
    if (startAnalysisBtn) {
        startAnalysisBtn.addEventListener('click', () => {
            // Update active state for nav links
            navLinks.forEach(navLink => {
                if (navLink.getAttribute('data-page') === 'analyze') {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            });
            
            // Show the analysis page
            showPage('analyze');
        });
    }
}

// Show a specific page and hide others
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Setup additional event listeners
function setupEventListeners() {
    // Check if TensorFlow.js is loaded
    if (window.tf) {
        console.log('TensorFlow.js loaded successfully:', tf.version);
        
        // Warm up TensorFlow.js
        tf.ready().then(() => {
            console.log('TensorFlow.js is ready');
        });
    } else {
        console.error('TensorFlow.js failed to load');
    }
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', () => {
        // Add any responsive layout adjustments here if needed
    });
}

// Initialize theme based on system preference
function initializeTheme() {
    // Check if the user's system prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply the theme based on system preference
    if (prefersDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        console.log('Applied dark theme based on system preference');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        console.log('Applied light theme based on system preference');
    }
    
    // Listen for changes in system preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        const newTheme = event.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        console.log(`Theme switched to ${newTheme} based on system preference change`);
    });
    
    // Add theme toggle to navbar
    addThemeToggle();
}

// Add theme toggle button to navbar
function addThemeToggle() {
    const navbar = document.querySelector('.navbar-nav');
    if (!navbar) return;
    
    // Create theme toggle button
    const themeToggleItem = document.createElement('li');
    themeToggleItem.className = 'nav-item theme-toggle-container';
    
    const themeToggle = document.createElement('a');
    themeToggle.className = 'nav-link theme-toggle';
    themeToggle.href = '#';
    themeToggle.innerHTML = `
        <i class="fas fa-moon theme-toggle-icon dark-icon"></i>
        <i class="fas fa-sun theme-toggle-icon light-icon"></i>
    `;
    
    themeToggleItem.appendChild(themeToggle);
    navbar.appendChild(themeToggleItem);
    
    // Add event listener to toggle theme
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        console.log(`Theme manually switched to ${newTheme}`);
    });
}

// Utility function to make API requests
export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // Use absolute URL instead of relative path for Replit environment
        const baseUrl = window.location.hostname.includes('replit') 
            ? window.location.origin
            : '';
        
        const response = await fetch(`${baseUrl}/api/${endpoint}`, options);
        console.log(`API request to: ${baseUrl}/api/${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}
