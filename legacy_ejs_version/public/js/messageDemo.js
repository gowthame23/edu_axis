// Demo script to showcase dynamic message functionality
// This can be used for testing or demonstration purposes

window.messageDemo = {
    // Demo functions to trigger different types of messages
    
    showSuccessMessage: function() {
        window.triggerSuccessMessage("This is a success message demo!");
    },
    
    showErrorMessage: function() {
        window.triggerErrorMessage("This is an error message demo!");
    },
    
    showWarningMessage: function() {
        window.triggerWarningMessage("This is a warning message demo!");
    },
    
    showInfoMessage: function() {
        window.triggerMessage("This is an info message demo!", "info");
    },
    
    // Simulate assignment submission
    simulateAssignmentSubmission: function() {
        const assignmentTitle = "Sample Assignment " + Math.floor(Math.random() * 100);
        window.triggerSuccessMessage(`Assignment "${assignmentTitle}" submitted successfully`);
        
        // Also dispatch the event
        document.dispatchEvent(new CustomEvent('assignmentSubmitted', {
            detail: {
                title: assignmentTitle,
                description: "This is a demo assignment",
                deadline: new Date().toISOString()
            }
        }));
    },
    
    // Simulate unit enrollment
    simulateUnitEnrollment: function() {
        const unitName = "Demo Unit " + Math.floor(Math.random() * 10);
        window.triggerMessage(`Enrolled in unit: ${unitName}`, "info");
        
        // Also dispatch the event
        document.dispatchEvent(new CustomEvent('unitEnrolled', {
            detail: {
                unitName: unitName,
                unitCode: "DEMO" + Math.floor(Math.random() * 100)
            }
        }));
    },
    
    // Simulate leave request
    simulateLeaveRequest: function() {
        const reasons = ["Medical emergency", "Family event", "Personal reasons", "Exam preparation"];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        window.triggerWarningMessage(`Leave request submitted: ${reason}`);
        
        // Also dispatch the event
        document.dispatchEvent(new CustomEvent('leaveRequestSubmitted', {
            detail: {
                reason: reason,
                studentName: "Demo Student"
            }
        }));
    },
    
    // Simulate multiple messages at once
    simulateMultipleMessages: function() {
        setTimeout(() => this.showSuccessMessage(), 500);
        setTimeout(() => this.simulateAssignmentSubmission(), 1000);
        setTimeout(() => this.showInfoMessage(), 1500);
        setTimeout(() => this.simulateUnitEnrollment(), 2000);
        setTimeout(() => this.showWarningMessage(), 2500);
    },
    
    // Add demo buttons to the page
    addDemoButtons: function() {
        // Only add demo buttons if not in production
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            const demoContainer = document.createElement('div');
            demoContainer.id = 'messageDemoContainer';
            demoContainer.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
            `;
            
            demoContainer.innerHTML = `
                <div style="margin-bottom: 5px;"><strong>Message Demo</strong></div>
                <button onclick="messageDemo.showSuccessMessage()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Success</button>
                <button onclick="messageDemo.showErrorMessage()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Error</button>
                <button onclick="messageDemo.showWarningMessage()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Warning</button>
                <button onclick="messageDemo.showInfoMessage()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Info</button>
                <br>
                <button onclick="messageDemo.simulateAssignmentSubmission()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Assignment</button>
                <button onclick="messageDemo.simulateUnitEnrollment()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Enroll</button>
                <button onclick="messageDemo.simulateLeaveRequest()" style="margin: 2px; padding: 3px 6px; font-size: 10px;">Leave</button>
                <br>
                <button onclick="messageDemo.simulateMultipleMessages()" style="margin: 2px; padding: 3px 6px; font-size: 10px; background: #ff6b6b; color: white;">Multiple</button>
                <button onclick="messageDemo.removeDemoButtons()" style="margin: 2px; padding: 3px 6px; font-size: 10px; background: #666; color: white;">Hide</button>
            `;
            
            document.body.appendChild(demoContainer);
        }
    },
    
    removeDemoButtons: function() {
        const container = document.getElementById('messageDemoContainer');
        if (container) {
            container.remove();
        }
    }
};

// Auto-add demo buttons on page load (only in development)
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure other scripts are loaded
    setTimeout(() => {
        // Only show demo in development environment
        if (window.location.hostname === 'localhost' || 
            window.location.hostname.includes('127.0.0.1') ||
            window.location.search.includes('demo=true')) {
            window.messageDemo.addDemoButtons();
        }
    }, 2000);
});

// Export for global access
window.messageDemo = window.messageDemo;
