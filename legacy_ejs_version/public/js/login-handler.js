// Function to change the username input label
function changeLabel(userType) {
    const usernameInput = document.getElementById('usernameInput');
    switch(userType) {
        case 'Student':
            usernameInput.placeholder = 'Student Roll Number';
            break;
        case 'Lecturer':
            usernameInput.placeholder = 'Teacher ID';
            break;
        case 'Admin':
            usernameInput.placeholder = 'Admin ID';
            break;
    }
}

// Function to show notification
function showNotification(message, status) {
    UIkit.notification({
        message: message,
        status: status,
        pos: 'top-center',
        timeout: status === 'success' ? 2000 : 5000
    });
}

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    try {
        const formData = new FormData(this);
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userType: formData.get('userType'),
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                showNotification(data.error || 'Login failed', 'danger');
            } else {
                showNotification('Login successful', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            }
        } else {
            // Handle HTML response
            const text = await response.text();
            if (text.includes('dashboard')) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/login';
            }
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login', 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'LOG IN';
    }
});

// Handle server-side messages on page load
document.addEventListener('DOMContentLoaded', function() {
    const messages = {
        error: document.querySelector('input[name="error-message"]')?.value,
        success: document.querySelector('input[name="success-message"]')?.value,
        info: document.querySelector('input[name="info-message"]')?.value
    };

    if (messages.error) showNotification(messages.error, 'danger');
    if (messages.success) {
        showNotification(messages.success, 'success');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
    }
    if (messages.info) showNotification(messages.info, 'primary');
});