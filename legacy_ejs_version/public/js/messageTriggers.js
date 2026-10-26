
document.addEventListener('DOMContentLoaded', function() {
    // Initialize message triggers after messages.js is loaded
    setTimeout(initializeMessageTriggers, 1000);
});

function initializeMessageTriggers() {
    // Set up event listeners for common actions that should trigger messages
    
    // Assignment submission triggers
    setupAssignmentTriggers();
    
    // Unit enrollment triggers
    setupEnrollmentTriggers();
    
    // Leave request triggers
    setupLeaveRequestTriggers();
    
    // Form submission triggers
    setupFormTriggers();
    
    // Button click triggers
    setupButtonTriggers();
}

function setupAssignmentTriggers() {
    // Listen for assignment submission forms
    const assignmentForms = document.querySelectorAll('form[action*="upload"], form[action*="assignment"]');
    assignmentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const formData = new FormData(form);
            const subject = formData.get('subject') || formData.get('Subject') || 'Assignment';
            
            // Add success message
            setTimeout(() => {
                if (window.MessageManager) {
                    window.MessageManager.addSystemMessage(
                        `Assignment "${subject}" submitted successfully`,
                        'success'
                    );
                }
            }, 1000);
        });
    });
}

function setupEnrollmentTriggers() {
    // Listen for unit enrollment forms
    const enrollmentForms = document.querySelectorAll('form[data-unit-enroll]');
    enrollmentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const unitIdInput = form.querySelector('[data-unit-unitId]');
            const unitNameSpan = form.querySelector('[data-unit-name]');
            
            if (unitIdInput && unitNameSpan) {
                setTimeout(() => {
                    if (window.MessageManager) {
                        window.MessageManager.addSystemMessage(
                            `Enrolled in unit: ${unitNameSpan.textContent}`,
                            'info'
                        );
                    }
                }, 1000);
            }
        });
    });
}

function setupLeaveRequestTriggers() {
    // Leave request notifications are handled by the form submission
    // No additional triggers needed
}

function setupFormTriggers() {
    const successButtons = document.querySelectorAll('[data-success-message]');
    successButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-success-message');
            const type = this.getAttribute('data-message-type') || 'success';
            
            setTimeout(() => {

                if (window.MessageManager) {

                    window.MessageManager.addSystemMessage(message, type);
                }
            }, 500);
        });
    });
}

function setupButtonTriggers() {
    // Setup dynamic message triggers for common actions
    
    // Add click listeners to buttons that should trigger messages
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-trigger-message]');
        if (target) {
            const message = target.getAttribute('data-trigger-message');
            const type = target.getAttribute('data-message-type') || 'info';
            
            setTimeout(() => {
                if (window.MessageManager) {
                    window.MessageManager.addSystemMessage(message, type);
                }
            }, 300);
        }
    });
}

// Utility functions for manual message triggering
window.triggerMessage = function(message, type = 'info') {
    if (window.MessageManager) {
        window.MessageManager.addSystemMessage(message, type);
    }
};

window.triggerSuccessMessage = function(message) {
    window.triggerMessage(message, 'success');
};

window.triggerErrorMessage = function(message) {
    window.triggerMessage(message, 'error');
};

window.triggerWarningMessage = function(message) {
    window.triggerMessage(message, 'warning');
};

// Integration with existing SweetAlert success callbacks
window.addMessageToSuccessAlert = function(message, type = 'success') {
    return function() {
        setTimeout(() => {
            if (window.MessageManager) {
                window.MessageManager.addSystemMessage(message, type);
            }
        }, 1000);
    };
};

// Example usage functions
window.examples = {
    // Example: Add message when assignment is uploaded
    onAssignmentUpload: function(assignmentTitle) {
        window.triggerSuccessMessage(`Assignment "${assignmentTitle}" uploaded successfully`);
    },
    
    // Example: Add message when unit is created
    onUnitCreated: function(unitName) {
        window.triggerSuccessMessage(`Unit "${unitName}" created successfully`);
    },
    
    // Example: Add message when student enrolls
    onStudentEnrolled: function(unitName) {
        window.triggerInfoMessage(`Student enrolled in "${unitName}"`);
    },
    
    // Example: Add message when leave request is submitted
    onLeaveRequestSubmitted: function(reason) {
        window.triggerWarningMessage(`Leave request submitted: ${reason}`);
    }
};

// Auto-detect and trigger messages for common page actions
window.autoDetectPageActions = function() {
    // Check URL parameters for success messages
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    const errorMessage = urlParams.get('error');
    
    if (successMessage) {
        window.triggerSuccessMessage(decodeURIComponent(successMessage));
    }
    
    if (errorMessage) {
        window.triggerErrorMessage(decodeURIComponent(errorMessage));
    }
    
    // Check for flash messages in the DOM
    const flashMessages = document.querySelectorAll('.alert-success, .alert-danger, .alert-warning, .alert-info');
    flashMessages.forEach(alert => {
        const message = alert.textContent.trim();
        const type = alert.classList.contains('alert-success') ? 'success' :
                    alert.classList.contains('alert-danger') ? 'error' :
                    alert.classList.contains('alert-warning') ? 'warning' : 'info';
        
        // Add to dynamic messages if not already there
        if (window.MessageManager && !alert.dataset.converted) {
            window.MessageManager.addSystemMessage(message, type);
            alert.dataset.converted = 'true';
        }
    });
};

// Initialize auto-detection on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(window.autoDetectPageActions, 2000);
});
