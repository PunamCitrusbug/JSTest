/**
 * Signup Page JS
 */

onDOMContentLoaded(() => {
    // Check if user is already logged in
    requireNoAuth();
    
    // Form elements
    const signupForm = document.getElementById('signupForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupError = document.getElementById('signupError');
    
    // Password requirement elements
    const lengthReq = document.getElementById('length');
    const uppercaseReq = document.getElementById('uppercase');
    const lowercaseReq = document.getElementById('lowercase');
    const numberReq = document.getElementById('number');
    const specialReq = document.getElementById('special');
    
    // Setup password toggle
    setupPasswordToggles();
    
    // Name validation
    const validateName = (input) => {
        if (input.value.trim() === '') {
            input.classList.remove('is-valid', 'is-invalid');
        } else if (input.value.trim().length > 0 && input.value.trim().length <= 15) {
            input.classList.add('is-valid');
            input.classList.remove('is-invalid');
            return true;
        } else {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            return false;
        }
        return false;
    };
    
    // First and last name validation
    firstNameInput.addEventListener('input', function() {
        validateName(this);
    });
    
    lastNameInput.addEventListener('input', function() {
        validateName(this);
    });
    
    // Email validation
    emailInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            this.classList.remove('is-valid', 'is-invalid');
        } else if (validateEmail(this.value)) {
            this.classList.add('is-valid');
            this.classList.remove('is-invalid');
        } else {
            this.classList.add('is-invalid');
            this.classList.remove('is-valid');
        }
    });
    
    // Real-time password validation
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const validation = validatePassword(password);
        
        // Update requirement items
        lengthReq.classList.toggle('valid', validation.rules.length);
        uppercaseReq.classList.toggle('valid', validation.rules.uppercase);
        lowercaseReq.classList.toggle('valid', validation.rules.lowercase);
        numberReq.classList.toggle('valid', validation.rules.number);
        specialReq.classList.toggle('valid', validation.rules.special);
        
        // Validate confirm password match
        if (confirmPasswordInput.value) {
            validatePasswordMatch();
        }
    });
    
    // Confirm password validation
    const validatePasswordMatch = () => {
        if (confirmPasswordInput.value === '') {
            confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
            return false;
        } else if (confirmPasswordInput.value === passwordInput.value) {
            confirmPasswordInput.classList.add('is-valid');
            confirmPasswordInput.classList.remove('is-invalid');
            return true;
        } else {
            confirmPasswordInput.classList.add('is-invalid');
            confirmPasswordInput.classList.remove('is-valid');
            return false;
        }
    };
    
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    
    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset error message
        signupError.classList.add('d-none');
        
        // Get form data
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate form
        let isValid = true;
        
        if (!firstName || firstName.length > 15) {
            firstNameInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!lastName || lastName.length > 15) {
            lastNameInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!email || !validateEmail(email)) {
            emailInput.classList.add('is-invalid');
            isValid = false;
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            isValid = false;
        }
        
        if (!confirmPassword || confirmPassword !== password) {
            confirmPasswordInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Check if user exists
            if (findUserByEmail(email)) {
                throw new Error('Email already registered. Please use a different email.');
            }
            
            // Simulate API call
            const registerPayload = {
                email: email,
                password: password,
                role: "USER"
            };
            
            // Add user to local storage
            const newUser = {
                firstName,
                lastName,
                email,
                password,
                role: "USER"
            };
            
            const success = addUser(newUser);
            
            if (!success) {
                throw new Error('Failed to register user.');
            }
            
            // Create a fake token
            const token = `fake-token-${Date.now()}`;
            
            // Store token and user data
            saveToken(token);
            
            // Don't store password in session storage
            const { password: _, ...userWithoutPassword } = newUser;
            saveUserToSession(userWithoutPassword);
            
            // Redirect to home page
            window.location.href = 'home.html';
            
        } catch (error) {
            signupError.textContent = error.message;
            signupError.classList.remove('d-none');
        }
    });
}); 