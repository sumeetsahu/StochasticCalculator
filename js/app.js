/**
 * Main application entry point for the Retirement Corpus Stochastic Calculator web application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Controller
    const uiController = new UIController();
    
    // Add event listeners for processing keyboard input shortcuts
    document.addEventListener('keydown', (event) => {
        // If Alt+B is pressed, navigate to basic mode
        if (event.altKey && event.key === 'b') {
            document.getElementById('basic-tab').click();
        }
        
        // If Alt+A is pressed, navigate to advanced mode
        if (event.altKey && event.key === 'a') {
            document.getElementById('advanced-tab').click();
        }
        
        // If Alt+H is pressed, navigate to help
        if (event.altKey && event.key === 'h') {
            document.getElementById('help-tab').click();
        }
    });
    
    // Display version info in console
    console.log(`Retirement Corpus Stochastic Calculator - Web Edition
Version: 1.0.0
Date: ${new Date().toLocaleDateString()}
Based on the original Java application by Sumeet Sahu
---
GitHub: https://github.com/yourusername/StochasticCalculator
`);
    
    // Create Web Workers for heavy calculations if browser supports it
    if (window.Worker) {
        console.log('Web Workers are supported in this browser. Some calculations will be offloaded for better performance.');
    } else {
        console.log('Web Workers are not supported in this browser. All calculations will run in the main thread.');
    }
});

// Add service worker for PWA support if in production
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
