/**
 * Reset Password Page JS
 */

onDOMContentLoaded(() => {
    // Check if user is already logged in
    requireNoAuth();
    
    // Form elements
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetTokenInput = document.getElementById('resetToken');
    const resetTokenError = document.getElementById('resetTokenError');
    const resetError = document.getElementById('resetError');
    const resetSuccess = document.getElementById('resetSuccess');
    
    // Password requirement elements
    const lengthReq = document.getElementById('length');
    const uppercaseReq = document.getElementById('uppercase');
    const lowercaseReq = document.getElementById('lowercase');
    const numberReq = document.getElementById('number');
    const specialReq = document.getElementById('special');
    
    // Setup password toggle
    setupPasswordToggles();
    
    // Extract token from URL
    const extractTokenFromURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
    };
    
    // Validate token
    const validateToken = (token) => {
        if (!token) {
            return { isValid: false, email: null };
        }
        
        // Get stored reset tokens
        const resetTokensJson = localStorage.getItem('reset_tokens') || '{}';
        const resetTokens = JSON.parse(resetTokensJson);
        
        // Check if token exists and is valid
        for (const email in resetTokens) {
            const tokenData = resetTokens[email];
            
            if (tokenData.token === token) {
                // Check if token is expired
                if (Date.now() > tokenData.expires) {
                    return { isValid: false, email: null };
                }
                
                return { isValid: true, email };
            }
        }
        
        return { isValid: false, email: null };
    };
    
    // Extract and validate token
    const token = extractTokenFromURL();
    const tokenValidation = validateToken(token);
    
    if (!tokenValidation.isValid) {
        resetTokenError.classList.remove('d-none');
        resetPasswordForm.classList.add('d-none');
    } else {
        resetTokenInput.value = token;
    }
    
    // Real-time password validation
    newPasswordInput.addEventListener('input', function() {
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
        } else if (confirmPasswordInput.value === newPasswordInput.value) {
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
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset messages
        resetError.classList.add('d-none');
        resetSuccess.classList.add('d-none');
        
        // Get form data
        const token = resetTokenInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate token again
        const tokenValidation = validateToken(token);
        
        if (!tokenValidation.isValid) {
            resetTokenError.classList.remove('d-none');
            return;
        }
        
        // Validate form
        let isValid = true;
        
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            isValid = false;
        }
        
        if (!confirmPassword || confirmPassword !== newPassword) {
            confirmPasswordInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Get user by email
            const user = findUserByEmail(tokenValidation.email);
            
            if (!user) {
                throw new Error('User not found.');
            }
            
            // Simulate API call
            const resetPasswordPayload = {
                newPassword: newPassword
            };
            
            // Update user password
            user.password = newPassword;
            
            // Update user in local storage
            const users = getStoredUsers();
            const updatedUsers = users.map(u => {
                if (u.email === user.email) {
                    return user;
                }
                return u;
            });
            
            saveStoredUsers(updatedUsers);
            
            // Remove the used reset token
            const resetTokensJson = localStorage.getItem('reset_tokens') || '{}';
            const resetTokens = JSON.parse(resetTokensJson);
            delete resetTokens[tokenValidation.email];
            localStorage.setItem('reset_tokens', JSON.stringify(resetTokens));
            
            // Show success message
            resetSuccess.classList.remove('d-none');
            
            // Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            
        } catch (error) {
            resetError.textContent = error.message;
            resetError.classList.remove('d-none');
        }
    });
}); 