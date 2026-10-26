// Unit form validation
document.addEventListener('DOMContentLoaded', function() {
    const unitForm = document.querySelector('form[id="createUnitForm"]');
    if (!unitForm) return;

    const unitName = document.getElementById('unitName');
    const unitCode = document.getElementById('unitCode');

    // Validation functions
    function isValidUnitName(value) {
        return /^[A-Za-z\s]+$/.test(value.trim());
    }

    function isValidUnitCode(value) {
        return /^[A-Za-z0-9]+$/.test(value.trim());
    }

    // Real-time validation
    unitName.addEventListener('input', function() {
        if (!this.value.trim()) {
            this.setCustomValidity('Unit name is required');
            this.classList.add('is-invalid');
        } else if (!isValidUnitName(this.value)) {
            this.setCustomValidity('Unit name can only contain letters and spaces');
            this.classList.add('is-invalid');
        } else {
            this.setCustomValidity('');
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });

    unitCode.addEventListener('input', function() {
        if (!this.value.trim()) {
            this.setCustomValidity('Unit code is required');
            this.classList.add('is-invalid');
        } else if (!isValidUnitCode(this.value)) {
            this.setCustomValidity('Unit code can only contain letters and numbers');
            this.classList.add('is-invalid');
        } else {
            this.setCustomValidity('');
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });

    // Form submission
    unitForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate unit name
        if (!unitName.value.trim() || !isValidUnitName(unitName.value)) {
            unitName.classList.add('is-invalid');
            return;
        }

        // Validate unit code
        if (!unitCode.value.trim() || !isValidUnitCode(unitCode.value)) {
            unitCode.classList.add('is-invalid');
            return;
        }

        // If validation passes, submit the form
        const formData = new FormData(this);

        fetch(this.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                Swal.fire({
                    title: 'Success!',
                    text: 'Unit created successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Reset form
                this.reset();
                document.querySelectorAll('.is-valid').forEach(el => {
                    el.classList.remove('is-valid');
                });

                // Close modal if exists
                const modal = bootstrap.Modal.getInstance(document.getElementById('createUnitModal'));
                if (modal) modal.hide();

                // Refresh units list if needed
                if (typeof loadUnits === 'function') loadUnits();
            } else {
                throw new Error(data.message || 'Failed to create unit');
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Error!',
                text: error.message || 'An error occurred while creating the unit',
                icon: 'error'
            });
        });
    });
});