function handleRedirect(redirectUrl) {
  
    const existingOverlay = document.querySelector('.redirect-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'redirect-overlay';
    
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 1000);
}