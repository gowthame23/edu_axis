// Dynamic Messages System - No Fetching Required
class MessageManager {
    constructor() {
        this.messagesContainer = null;
        this.messageCounter = 0;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMessageSystem());
        } else {
            this.setupMessageSystem();
        }
    }

    setupMessageSystem() {
        // Find the messages container in the modal
        this.messagesContainer = document.querySelector('#messagesModal .container-fluid');
        
        if (this.messagesContainer) {
            // Initialize with server data if available
            this.initializeFromServerData();
            
            // Add event listeners for dynamic updates
            this.setupEventListeners();
            
            // Set up periodic refresh (optional)
            this.startPeriodicRefresh();
        }
    }

    initializeFromServerData() {
        // Check if there's server data available in the page
        const serverMessages = window.serverMessages || [];
        
        if (serverMessages.length > 0) {
            // Clear loading placeholder
            this.messagesContainer.innerHTML = '';
            
            // Sort messages by creation date (newest first)
            const sortedMessages = serverMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Add each message dynamically
            sortedMessages.forEach(messageData => {
                const messageElement = this.createMessageElement(messageData);
                this.messagesContainer.appendChild(messageElement);
            });
        } else {
            // Show no messages placeholder
            this.messagesContainer.innerHTML = '<div class="uk-text-center uk-text-muted uk-padding"><p>No messages available</p></div>';
        }
        
        this.updateMessageCount();
    }

    setupEventListeners() {
        // Listen for custom events that trigger message updates
        document.addEventListener('messageAdded', (event) => {
            this.addMessage(event.detail.message);
        });

        document.addEventListener('messageRead', (event) => {
            this.markMessageAsRead(event.detail.messageId);
        });

        document.addEventListener('messagesMarkedAsRead', () => {
            this.markAllMessagesAsRead();
        });

        document.addEventListener('messagesDeleted', () => {
            this.clearAllMessages();
        });

        // Listen for assignment submissions, enrollments, etc.
        document.addEventListener('assignmentSubmitted', (event) => {
            this.addSystemMessage(`Assignment "${event.detail.title}" submitted successfully`, 'success');
        });

        document.addEventListener('unitEnrolled', (event) => {
            this.addSystemMessage(`Enrolled in unit: ${event.detail.unitName}`, 'info');
        });

        document.addEventListener('leaveRequestSubmitted', (event) => {
            this.addSystemMessage(`Leave request submitted: ${event.detail.reason}`, 'warning');
        });
    }

    addMessage(messageData) {
        // Ensure proper message structure
        const formattedMessage = {
            ...messageData,
            type: messageData.type || 'info',
            read: false,
            createdAt: messageData.createdAt || new Date()
        };

        const messageElement = this.createMessageElement(formattedMessage);
        this.messagesContainer.insertBefore(messageElement, this.messagesContainer.firstChild);
        this.updateMessageCount();
        this.animateNewMessage(messageElement);

        // Update badge count
        const badge = document.querySelector('.badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
        }
    }

    createMessageElement(messageData) {
        const messageId = `msg-${Date.now()}-${this.messageCounter++}`;
        const isNew = !messageData.read;
        const statusIcon = isNew ? '🔴' : '🟢';
        const statusText = isNew ? 'New' : 'Read';
        const statusClass = isNew ? 'message-status unread' : 'message-status read';
        
        const timeString = new Date(messageData.createdAt || Date.now()).toLocaleTimeString();
        const dateString = this.formatDate(messageData.createdAt || Date.now());

        const messageHTML = `
            <div class="nature-card" id="${messageId}" data-message-id="${messageData.id || messageId}" data-read="${messageData.read || false}">
                <div class="uk-card uk-card-small uk-card-default">
                    <div class="uk-card-header">
                        <div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
                            <div class="uk-width-expand" title="Alert" data-uk-tooltip>
                                <span class="cat-txt message-header-text">Alert</span>
                            </div>
                            <div class="uk-width-auto uk-text-right" title="Status" data-uk-tooltip>
                                <span class="${statusClass}">
                                    <span class="status-icon">${statusIcon}</span>
                                    ${statusText}
                                </span>
                            </div>
                            <div class="uk-width-auto uk-text-right">
                                <button 
                                    type="button" 
                                    class="uk-icon-link uk-text-danger" 
                                    title="Delete Message" 
                                    data-uk-tooltip
                                    data-uk-icon="icon: trash"
                                    onclick="window.messageManager.deleteMessage('${messageData.id || messageId}')"
                                ></button>
                            </div>
                        </div>
                    </div>
                    <div class="uk-card-media"></div>
                    <div class="uk-card-body">
                        <h6 class="uk-margin-small-bottom uk-margin-remove-adjacent uk-text-bold message-title">
                            ${messageData.title || messageData.message}
                        </h6>
                        <p class="uk-text-small uk-text-muted">
                            ${dateString} at ${timeString}
                        </p>
                    </div>
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = messageHTML;
        return tempDiv.firstElementChild;
    }

    addSystemMessage(message, type = 'info') {
        const messageData = {
            title: message,
            read: false,
            createdAt: new Date(),
            id: `system-${Date.now()}`
        };

        // Add visual indicator for system messages
        const messageElement = this.createMessageElement(messageData);
        const cardElement = messageElement.querySelector('.uk-card');
        
        // Add type-specific styling
        switch(type) {
            case 'success':
                cardElement.classList.add('uk-card-primary');
                break;
            case 'warning':
                cardElement.classList.add('uk-card-secondary');
                break;
            case 'error':
                cardElement.classList.add('uk-card-danger');
                break;
            default:
                cardElement.classList.add('uk-card-muted');
        }

        this.messagesContainer.insertBefore(messageElement, this.messagesContainer.firstChild);
        this.updateMessageCount();
        this.animateNewMessage(messageElement);
    }

    markMessageAsRead(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusSpan = messageElement.querySelector('.message-status');
            
            if (statusSpan) {
                statusSpan.className = 'message-status read';
                statusSpan.innerHTML = '<span class="status-icon">🟢</span> Read';
                messageElement.dataset.read = 'true';
            }
        }
        this.updateMessageCount();
    }

    markAllMessagesAsRead() {
        const messages = this.messagesContainer.querySelectorAll('.nature-card');
        messages.forEach(messageElement => {
            const statusSpan = messageElement.querySelector('.uk-width-auto span');
            const statusText = messageElement.querySelector('.uk-width-auto');
            
            if (statusSpan && statusText) {
                statusSpan.textContent = '🟢';
                statusSpan.className = 'uk-text-success';
                statusText.innerHTML = '<span class="uk-text-success">🟢</span> Read';
                messageElement.dataset.read = 'true';
            }
        });
        this.updateMessageCount();
    }

    deleteMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        // Add delete animation class
        messageElement.classList.add('message-delete-animation');

        // Persist to server if possible
        try {
            const modal = document.getElementById('messagesModal');
            const userId = modal?.dataset.userId;
            const userType = modal?.dataset.userType;
            if (userId && userType) {
                fetch(`/${userType}/messages/delete/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ messageId })
                }).then(res => {
                    if (!res.ok) throw new Error('Server did not delete');
                }).catch(err => {
                    console.warn('Server delete failed, reverting UI:', err);
                    messageElement.classList.remove('message-delete-animation');
                    return; // Stop the UI removal
                });
            }
        } catch (e) {
            console.warn('Error issuing delete request', e);
        }

        setTimeout(() => {
            messageElement.remove();
            this.updateMessageCount();

            // Check if no messages left
            const remainingMessages = this.messagesContainer.querySelectorAll('.nature-card');
            if (remainingMessages.length === 0) {
                this.messagesContainer.innerHTML = '<div class="uk-text-center uk-text-muted uk-padding"><p>No messages available</p></div>';
            }
        }, 300);
    }

    clearAllMessages() {
        this.messagesContainer.innerHTML = '<div class="uk-text-center uk-text-muted uk-padding"><p>No messages available</p></div>';
        this.updateMessageCount();
    }

    updateMessageCount() {
        const newMessageCount = this.messagesContainer.querySelectorAll('.nature-card:not([data-read="true"])').length;
        
        // Update message count in navigation/header
        const messageCountElements = document.querySelectorAll('[data-message-count]');
        messageCountElements.forEach(element => {
            element.textContent = newMessageCount;
            element.style.display = newMessageCount > 0 ? 'inline' : 'none';
        });

        // Update message button badges
        const messageButtons = document.querySelectorAll('[data-bs-target="#messagesModal"]');
        messageButtons.forEach(button => {
            let badge = button.querySelector('.badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge bg-danger position-absolute top-0 start-100 translate-middle';
                badge.style.fontSize = '0.6em';
                button.style.position = 'relative';
                button.appendChild(badge);
            }
            
            if (newMessageCount > 0) {
                badge.textContent = newMessageCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        });

        // Update modal footer buttons
        const markAsReadBtn = document.querySelector('#messagesModal .btn-primary');
        const noNewMessagesBtn = document.querySelector('#messagesModal .btn-info');
        
        if (newMessageCount > 0) {
            if (markAsReadBtn) markAsReadBtn.style.display = 'inline-block';
            if (noNewMessagesBtn) noNewMessagesBtn.style.display = 'none';
        } else {
            if (markAsReadBtn) markAsReadBtn.style.display = 'none';
            if (noNewMessagesBtn) noNewMessagesBtn.style.display = 'inline-block';
        }
    }

    animateNewMessage(messageElement) {
        // Add fade-in animation class
        messageElement.classList.add('message-fade-in');

        // Add a subtle highlight effect
        messageElement.classList.add('new-message-highlight');
        setTimeout(() => {
            messageElement.classList.remove('new-message-highlight');
        }, 2000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getUTCDate();
        const month = date.toLocaleString("default", { month: "long" });
        const year = date.getUTCFullYear();
        return `${day}, ${month}, ${year}`;
    }

    startPeriodicRefresh() {
        // Optional: Refresh message count every 30 seconds
        setInterval(() => {
            this.updateMessageCount();
        }, 30000);
    }

    // Public API methods for external use
    static addMessage(messageData) {
        if (window.messageManager) {
            window.messageManager.addMessage(messageData);
        }
    }

    static addSystemMessage(message, type) {
        if (window.messageManager) {
            window.messageManager.addSystemMessage(message, type);
        }
    }

    static markAsRead(messageId) {
        if (window.messageManager) {
            window.messageManager.markMessageAsRead(messageId);
        }
    }

    static markAllAsRead() {
        if (window.messageManager) {
            window.messageManager.markAllMessagesAsRead();
        }
    }

    static clearAll() {
        if (window.messageManager) {
            window.messageManager.clearAllMessages();
        }
    }

    static deleteMessage(messageId) {
        if (window.messageManager) {
            window.messageManager.deleteMessage(messageId);
        }
    }
}

// Initialize the message manager
window.messageManager = new MessageManager();

// Add CSS for animations and enhanced styling
const style = document.createElement('style');
style.textContent = `
    .new-message-highlight {
        background-color: rgba(0, 123, 255, 0.1) !important;
        border-left: 4px solid #007bff !important;
        transition: all 0.3s ease-in-out;
    }
    
    .nature-card {
        transition: all 0.3s ease-in-out;
        position: relative;
    }
    
    .uk-card {
        transition: all 0.2s ease-in-out;
    }
    
    .uk-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .uk-icon-link.uk-text-danger:hover {
        color: #dc3545 !important;
        transform: scale(1.1);
    }
    
    .uk-icon-link.uk-text-danger {
        transition: all 0.2s ease-in-out;
    }
    
    .message-delete-animation {
        animation: slideOutLeft 0.3s ease-in-out forwards;
    }
    
    @keyframes slideOutLeft {
        0% {
            opacity: 1;
            transform: translateX(0);
        }
        100% {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
    
    .message-fade-in {
        animation: fadeInUp 0.3s ease-in-out;
    }
    
    @keyframes fadeInUp {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .uk-card-header .uk-grid {
        align-items: center;
    }
    
    .uk-card-header .uk-width-auto:last-child {
        margin-left: auto;
    }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.MessageManager = MessageManager;
