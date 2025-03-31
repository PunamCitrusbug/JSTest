// DOM Elements
document.addEventListener('DOMContentLoaded', function () {
    // Form elements
    const multiStepForm = document.getElementById('multiStepForm');
    const steps = document.querySelectorAll('.step-form');
    const stepButtons = document.querySelectorAll('.step-btn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Navigation elements
    const viewListBtn = document.getElementById('viewListBtn');
    const backToFormBtn = document.getElementById('backToFormBtn');
    const formContainer = document.getElementById('formContainer');
    const listContainer = document.getElementById('listContainer');

    // List view elements
    const submissionsList = document.getElementById('submissionsList');
    const selectAll = document.getElementById('selectAll');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    // Modal elements
    const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const viewModalBody = document.getElementById('viewModalBody');
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');

    // Current state
    let currentStep = 1;
    let editingId = null;
    let entriesToDelete = [];

    // Initialize the function
    multiStepWebForm();

    function multiStepWebForm() {
        initMultiStepForm();
        initEditForm();
        loadSubmissions();
        addEventListeners();
    }

    // Event Listeners
    function addEventListeners() {
        // Navigation
        viewListBtn.addEventListener('click', () => toggleView('list'));
        backToFormBtn.addEventListener('click', () => {
            toggleView('form');
            resetForm();
            navigateTo(1);
        });

        // Delete functionality
        deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

        // Edit functionality
        saveEditBtn.addEventListener('click', handleEditSave);

        // Select all functionality
        selectAll.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.entry-checkbox');
            checkboxes.forEach(checkbox => checkbox.checked = selectAll.checked);
            updateDeleteButtonState();
        });
    }

    // Form Initialization
    function initMultiStepForm() {
        addValidationListeners(multiStepForm);

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) navigateTo(currentStep - 1);
        });

        nextBtn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                if (currentStep < steps.length) navigateTo(currentStep + 1);
            }
        });

        stepButtons.forEach(button => {
            button.addEventListener('click', () => {
                const step = parseInt(button.getAttribute('data-step'));
                if (step < currentStep || (step === currentStep + 1 && validateStep(currentStep))) {
                    saveStepData(currentStep);
                    navigateTo(step);
                }
            });
        });

        multiStepForm.addEventListener('submit', handleFormSubmit);
    }

    function initEditForm() {
        const editForm = document.getElementById('editForm');
        addValidationListeners(editForm);
    }

    // Form Validation
    function addValidationListeners(form) {
        const formInputs = form.querySelectorAll('input, select');
        formInputs.forEach(input => {
            ['input', 'change'].forEach(event => {
                input.addEventListener(event, () => validateField(input));
            });
        });
    }

    function validateStep(step) {
        const stepForm = document.querySelector(`.step-form[data-step="${step}"]`);
        if (!stepForm) return false;

        const fields = stepForm.querySelectorAll('input, select');
        let isValid = true;

        fields.forEach(field => {
            // Skip radio buttons as they're handled separately
            if (field.type === 'radio') return;

            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Special handling for radio buttons (gender)
        if (step === 3) {
            const genderInputs = stepForm.querySelectorAll('input[name="gender"]');
            if (genderInputs.length > 0) {
                const genderSelected = Array.from(genderInputs).some(input => input.checked);
                if (!genderSelected) {
                    isValid = false;
                    const feedback = genderInputs[0].closest('.mb-3').querySelector('.invalid-msg');
                    if (feedback) {
                        feedback.textContent = 'Please select your gender';
                        feedback.style.display = 'block';
                    }
                }
            }
        }

        return isValid;
    }

    function validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        let isValid = true;
        let errorMessage = '';

        const validations = {
            name: {
                check: () => value !== '',
                message: 'Please enter your name'
            },
            email: {
                check: () => value !== '' && isValidEmail(value),
                message: 'Please enter a valid email address'
            },
            phone: {
                check: () => value !== '' && isValidPhone(value),
                message: 'Please enter a valid phone number (10 digits)'
            },
            zipcode: {
                check: () => value !== '' && isValidZipcode(value),
                message: 'Please enter a valid zipcode (5 digits)'
            },
            dob: {
                check: () => value !== '' && isValidDate(value),
                message: 'Please enter a valid date'
            },
            gender: {
                check: () => document.querySelector(`input[name="gender"]:checked`),
                message: 'Please select your gender'
            },
            hobbies: {
                check: () => Array.from(field.selectedOptions).length > 0,
                message: 'Please select at least one hobby'
            },
            technologies: {
                check: () => Array.from(field.selectedOptions).length > 0,
                message: 'Please select at least one technology'
            }
        };

        if (validations[name]) {
            isValid = validations[name].check();
            errorMessage = validations[name].message;
        }

        const feedback = field.nextElementSibling;
        if (!isValid) {
            field.classList.add('is-invalid');
            if (feedback && feedback.classList.contains('invalid-msg')) {
                feedback.textContent = errorMessage;
                feedback.style.display = 'block';
            }
        } else {
            field.classList.remove('is-invalid');
            if (feedback && feedback.classList.contains('invalid-msg')) {
                feedback.style.display = 'none';
            }
        }

        return isValid;
    }

    // Form Submission Handlers
    function handleFormSubmit(e) {
        e.preventDefault();

        if (validateStep(currentStep)) {
            saveStepData(currentStep);
            const formData = getFormData();

            saveEntry(formData);
            showAlert('Form submitted successfully!', 'success');

            resetForm();
            navigateTo(1);
            loadSubmissions();
            toggleView('list');
        }
    }

    function handleEditSave() {
        const editForm = document.getElementById('editForm');
        let isValid = true;

        // Validate all fields
        const fields = editForm.querySelectorAll('input[type="text"], input[type="email"], input[type="date"], select');
        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Validate gender radio buttons
        const genderInputs = editForm.querySelectorAll('input[name="gender"]');
        const genderSelected = Array.from(genderInputs).some(input => input.checked);
        if (!genderSelected) {
            isValid = false;
            const feedback = genderInputs[0].closest('.mb-3').querySelector('.invalid-msg');
            if (feedback) {
                feedback.textContent = 'Please select your gender';
                feedback.style.display = 'block';
            }
        }

        if (isValid) {
            const formData = {
                name: editForm.querySelector('#edit_name').value,
                email: editForm.querySelector('#edit_email').value,
                phone: editForm.querySelector('#edit_phone').value,
                zipcode: editForm.querySelector('#edit_zipcode').value,
                dob: editForm.querySelector('#edit_dob').value,
                gender: editForm.querySelector('input[name="gender"]:checked')?.value || '',
                hobbies: Array.from(editForm.querySelector('#edit_hobbies').selectedOptions).map(opt => opt.value),
                technologies: Array.from(editForm.querySelector('#edit_technologies').selectedOptions).map(opt => opt.value)
            };

            updateEntry(editingId, formData);
            showAlert('Entry updated successfully!', 'success');
            editModal.hide();
            loadSubmissions();
            editingId = null;
        }
    }

    // CRUD Operations
    function saveEntry(formData) {
        const entries = getEntries();
        const newEntry = {
            id: Date.now().toString(),
            ...formData,
            createdAt: new Date().toISOString()
        };

        entries.push(newEntry);
        saveEntries(entries);
        localStorage.removeItem('formData');
    }

    function updateEntry(id, formData) {
        const entries = getEntries();
        const index = entries.findIndex(entry => entry.id === id);

        if (index !== -1) {
            entries[index] = {
                ...entries[index],
                ...formData,
                updatedAt: new Date().toISOString()
            };

            saveEntries(entries);
            return true;
        }
        return false;
    }

    function deleteEntries(ids) {
        const entries = getEntries();
        const updatedEntries = entries.filter(entry => !ids.includes(entry.id));
        saveEntries(updatedEntries);
        loadSubmissions();
    }

    // UI Updates
    function loadSubmissions() {
        const entries = getEntries();
        submissionsList.innerHTML = '';

        entries.forEach(entry => {
            const row = createSubmissionRow(entry);
            submissionsList.appendChild(row);
        });

        addListActionListeners();
        updateDeleteButtonState();
    }

    function createSubmissionRow(entry) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="entry-checkbox" data-id="${entry.id}"></td>
            <td>${entry.name || ''}</td>
            <td>${entry.email || ''}</td>
            <td>${entry.phone || ''}</td>
            <td>
                <button class="btn btn-sm btn-info action-btn view-btn" data-id="${entry.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning action-btn edit-btn" data-id="${entry.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${entry.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        return row;
    }

    function addListActionListeners() {
        // View buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                viewEntry(id);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                editEntry(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                entriesToDelete = [id];
                confirmModal.show();
            });
        });

        // Checkboxes
        document.querySelectorAll('.entry-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateDeleteButtonState);
        });
    }

    function viewEntry(id) {
        const entry = findEntry(id);
        if (!entry) return;

        viewModalBody.innerHTML = generateEntryHTML(entry);
        viewModal.show();
    }

    function editEntry(id) {
        const entry = findEntry(id);
        if (!entry) return;

        editingId = id;
        populateEditForm(entry);
        editModal.show();
    }

    function populateEditForm(data) {
        const editForm = document.getElementById('editForm');

        // Reset form and validation states
        editForm.reset();
        editForm.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-msg')) {
                feedback.style.display = 'none';
            }
        });

        // Text inputs
        ['name', 'email', 'phone', 'zipcode', 'dob'].forEach(field => {
            const input = editForm.querySelector(`#edit_${field}`);
            if (input && data[field]) {
                input.value = data[field];
                validateField(input); // Validate after setting value
            }
        });

        // Radio buttons
        if (data.gender) {
            const radio = editForm.querySelector(`#edit_${data.gender.toLowerCase()}`);
            if (radio) {
                radio.checked = true;
            }
        }

        // Multi-select fields
        ['hobbies', 'technologies'].forEach(field => {
            if (Array.isArray(data[field])) {
                const select = editForm.querySelector(`#edit_${field}`);
                if (select) {
                    Array.from(select.options).forEach(option => {
                        option.selected = data[field].includes(option.value);
                    });
                    validateField(select);
                }
            }
        });
    }

    // Helper Functions
    function getEntries() {
        return JSON.parse(localStorage.getItem('entries') || '[]');
    }

    function saveEntries(entries) {
        localStorage.setItem('entries', JSON.stringify(entries));
    }

    function findEntry(id) {
        return getEntries().find(entry => entry.id === id);
    }

    function getFormDataFromForm(form) {
        const formData = {};
        const formElements = form.elements;

        for (let element of formElements) {
            if (!element.name) continue;

            if (element.type === 'radio') {
                if (element.checked) formData[element.name] = element.value;
            } else if (element.type === 'select-multiple') {
                formData[element.name] = Array.from(element.selectedOptions).map(option => option.value);
            } else {
                formData[element.name] = element.value;
            }
        }

        return formData;
    }

    function validateFormData(formData) {
        return Object.entries(formData).every(([field, value]) => {
            const input = document.querySelector(`[name="${field}"]`);
            return validateField(input);
        });
    }

    function showAlert(message, type = 'info') {
        const alertElem = document.createElement('div');
        alertElem.className = `alert alert-${type} alert-dismissible fade show`;
        alertElem.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.querySelector('.container').prepend(alertElem);
        setTimeout(() => alertElem.remove(), 3000);
    }

    function toggleView(view) {
        formContainer.style.display = view === 'form' ? 'block' : 'none';
        listContainer.style.display = view === 'list' ? 'block' : 'none';
    }

    function handleDeleteSelected() {
        const checkedBoxes = document.querySelectorAll('.entry-checkbox:checked');
        if (checkedBoxes.length > 0) {
            entriesToDelete = Array.from(checkedBoxes).map(checkbox => checkbox.getAttribute('data-id'));
            confirmModal.show();
        }
    }

    function handleConfirmDelete() {
        if (entriesToDelete.length > 0) {
            deleteEntries(entriesToDelete);
            showAlert(`${entriesToDelete.length} ${entriesToDelete.length === 1 ? 'entry' : 'entries'} deleted successfully!`, 'success');
            entriesToDelete = [];
            confirmModal.hide();
        }
    }

    function generateEntryHTML(entry) {
        return `
            <dl class="row">
                <dt class="col-sm-12 text-primary">Personal Information</dt>
                <dt class="col-sm-4">Name</dt><dd class="col-sm-8">${entry.name || ''}</dd>
                <dt class="col-sm-4">Email</dt><dd class="col-sm-8">${entry.email || ''}</dd>
                
                <dt class="col-sm-12 text-primary">Contact Information</dt>
                <dt class="col-sm-4">Phone</dt><dd class="col-sm-8">${entry.phone || ''}</dd>
                <dt class="col-sm-4">Zipcode</dt><dd class="col-sm-8">${entry.zipcode || ''}</dd>
                
                <dt class="col-sm-12 text-primary">Additional Information</dt>
                <dt class="col-sm-4">Date of Birth</dt><dd class="col-sm-8">${entry.dob || ''}</dd>
                <dt class="col-sm-4">Gender</dt><dd class="col-sm-8">${entry.gender || ''}</dd>
                
                <dt class="col-sm-12 text-primary">Interests</dt>
                <dt class="col-sm-4">Hobbies</dt>
                <dd class="col-sm-8">${Array.isArray(entry.hobbies) ? entry.hobbies.join(', ') : ''}</dd>
                <dt class="col-sm-4">Technologies</dt>
                <dd class="col-sm-8">${Array.isArray(entry.technologies) ? entry.technologies.join(', ') : ''}</dd>
                
                <dt class="col-sm-12 text-primary">Metadata</dt>
                <dt class="col-sm-4">Created</dt>
                <dd class="col-sm-8">${new Date(entry.createdAt).toLocaleString()}</dd>
                ${entry.updatedAt ? `
                    <dt class="col-sm-4">Updated</dt>
                    <dd class="col-sm-8">${new Date(entry.updatedAt).toLocaleString()}</dd>
                ` : ''}
            </dl>
        `;
    }

    function updateDeleteButtonState() {
        const checkedBoxes = document.querySelectorAll('.entry-checkbox:checked');
        deleteSelectedBtn.disabled = checkedBoxes.length === 0;
    }

    //Helper Functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone.replace(/[^\d]/g, ''));
    }

    function isValidZipcode(zipcode) {
        const zipcodeRegex = /^\d{5}(-\d{4})?$/;
        return zipcodeRegex.test(zipcode);
    }

    function isValidDate(date) {
        const selectedDate = new Date(date);
        const today = new Date();
        return !isNaN(selectedDate.getTime()) && selectedDate <= today;
    }

    function navigateTo(step) {
        // Hide all steps
        steps.forEach(stepElem => stepElem.classList.remove('active'));

        // Show the current step
        steps[step - 1].classList.add('active');

        // Update step indicator
        stepButtons.forEach(button => {
            const buttonStep = parseInt(button.getAttribute('data-step'));
            button.classList.remove('active', 'completed');

            if (buttonStep === step) {
                button.classList.add('active');
            } else if (buttonStep < step) {
                button.classList.add('completed');
            }
        });

        // Update the current step
        currentStep = step;

        // Update navigation buttons
        updateNavButtons();

        // If on the summary step, generate the summary
        if (step === 5) {
            generateSummary();
        }
    }

    function updateNavButtons() {
        // Previous button
        prevBtn.disabled = currentStep === 1;

        // Next and Submit buttons
        if (currentStep === steps.length) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    function saveStepData(step) {
        const stepForm = document.querySelector(`.step-form[data-step="${step}"]`);
        const formData = JSON.parse(localStorage.getItem('formData') || '{}');

        // Get all form elements in the current step
        const fields = stepForm.querySelectorAll('input, select');
        fields.forEach(field => {
            if (field.type === 'radio') {
                if (field.checked) {
                    formData[field.name] = field.value;
                }
            } else if (field.type === 'select-multiple') {
                formData[field.name] = Array.from(field.selectedOptions).map(option => option.value);
            } else {
                formData[field.name] = field.value;
            }
        });

        localStorage.setItem('formData', JSON.stringify(formData));
    }

    function getFormData() {
        return JSON.parse(localStorage.getItem('formData') || '{}');
    }

    function generateSummary() {
        const summaryElem = document.getElementById('summary');
        const formData = getFormData();

        summaryElem.innerHTML = generateEntryHTML({
            ...formData,
            createdAt: new Date().toISOString()
        });
    }

    function resetForm() {
        // Reset form fields
        multiStepForm.reset();

        // Clear form data from localStorage
        localStorage.removeItem('formData');

        // Clear validation states
        const invalidFields = multiStepForm.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-msg')) {
                feedback.textContent = '';
            }
        });
    }
}); 