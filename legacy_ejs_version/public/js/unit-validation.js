// Unit form validation
document.addEventListener('DOMContentLoaded', function() {
    const unitForm = document.getElementById('unitForm');
    if (!unitForm) return;

    const unitName = document.getElementById('unitName');
    const unitCode = document.getElementById('unitCode');
    const enrollmentKey = document.getElementById('enrollmentKey');

    // Validation functions
    const validators = {
        unitName: (value) => {
            // Only alphabets and spaces allowed
            return /^[A-Za-z\s]+$/.test(value);
        },
        unitCode: (value) => {
            // Alphanumeric only
            return /^[A-Za-z0-9]+$/.test(value);
        }
    };

    // Error message display function
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup.querySelector('.error-message') || document.createElement('div');
        errorDiv.className = 'error-message text-danger small mt-1';
        errorDiv.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorDiv);
        }
        
        input.classList.add('is-invalid');
    }

    // Success state function
    function showSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    // Real-time validation for Unit Name
    unitName.addEventListener('input', function() {
        const value = this.value.trim();
        
        if (!value) {
            showError(this, 'Unit name is required');
        } else if (!validators.unitName(value)) {
            showError(this, 'Unit name can only contain letters and spaces');
        } else {
            showSuccess(this);
        }
    });

    // Real-time validation for Unit Code
    unitCode.addEventListener('input', function() {
        const value = this.value.trim();
        
        if (!value) {
            showError(this, 'Unit code is required');
        } else if (!validators.unitCode(value)) {
            showError(this, 'Unit code can only contain letters and numbers');
        } else {
            showSuccess(this);
        }
    });

    // Form submission handler
    unitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Validate Unit Name
        if (!unitName.value.trim()) {
            showError(unitName, 'Unit name is required');
            isValid = false;
        } else if (!validators.unitName(unitName.value.trim())) {
            showError(unitName, 'Unit name can only contain letters and spaces');
            isValid = false;
        }
        
        // Validate Unit Code
        if (!unitCode.value.trim()) {
            showError(unitCode, 'Unit code is required');
            isValid = false;
        } else if (!validators.unitCode(unitCode.value.trim())) {
            showError(unitCode, 'Unit code can only contain letters and numbers');
            isValid = false;
        }
        
        // If form is valid, submit it
        if (isValid) {
            // Remove any previous error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            
            // Get form data
            const formData = new FormData(this);
            
            // Submit using fetch
            fetch(this.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    UIkit.notification({
                        message: 'Unit created successfully!',
                        status: 'success',
                        pos: 'top-center',
                        timeout: 3000
                    });
                    
                    // Reset form
                    this.reset();
                    document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
                    
                    // Close modal if exists
                    const modal = UIkit.modal(this.closest('.uk-modal'));
                    if (modal) modal.hide();
                    
                    // Refresh unit list if needed
                    if (typeof loadUnits === 'function') loadUnits();
                } else {
                    throw new Error(data.message || 'Failed to create unit');
                }
            })
            .catch(error => {
                UIkit.notification({
                    message: error.message || 'An error occurred while creating the unit',
                    status: 'danger',
                    pos: 'top-center',
                    timeout: 3000
                });
            });
        }
    });
});