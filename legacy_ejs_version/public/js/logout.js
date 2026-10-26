function showFlash(type, message) {
  const cls = type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-primary';
  const alert = document.createElement('div');
  alert.className = `alert ${cls} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alert.setAttribute('role', 'alert');
  alert.style.zIndex = '1080';
  alert.innerHTML = `
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    ${message}
  `;
  document.body.appendChild(alert);
  setTimeout(() => {
    try {
      const bsAlert = window.bootstrap ? new window.bootstrap.Alert(alert) : null;
      bsAlert ? bsAlert.close() : alert.remove();
    } catch (e) {
      alert.remove();
    }
  }, 1200);
}

function handleLogout() {
  showFlash('success', 'Signing out…');
  setTimeout(() => {
    window.location.href = '/logout';
  }, 900);
}

(function attachLogoutHandlers() {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[data-logout]');
    if (!a) return;
    e.preventDefault();
    handleLogout();
  });
})();
