/**
 * Forgot Password Page JS
 */

onDOMContentLoaded(() => {
    // Check if user is already logged in
    requireNoAuth();
    
    // Form elements
    const emailForm = document.getElementById('emailForm');
    const emailInput = document.getElementById('email');
    const forgotError = document.getElementById('forgotError');
    const forgotSuccess = document.getElementById('forgotSuccess');
    
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
    
    // Form submission
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset messages
        forgotError.classList.add('d-none');
        forgotSuccess.classList.add('d-none');
        
        // Get email
        const email = emailInput.value.trim();
        
        // Validate email
        if (!email || !validateEmail(email)) {
            emailInput.classList.add('is-invalid');
            return;
        }
        
        try {
            // Check if user exists in local storage
            const user = findUserByEmail(email);
            
            if (!user) {
                // For security reasons, we'll still show success even if the email doesn't exist
                // This prevents email enumeration attacks
                forgotSuccess.classList.remove('d-none');
                return;
            }
            
            // Simulate API call
            const forgotPasswordPayload = {
                email: email
            };
            
            // Generate a reset token (in a real app, this would be done on the server)
            const resetToken = btoa(`${email}-${Date.now()}`).replace(/=/g, '');
            
            // In a real app, the server would send an email with a reset link
            // For our demo, we'll store the token in localStorage and use it in the reset page
            const resetTokensJson = localStorage.getItem('reset_tokens') || '{}';
            const resetTokens = JSON.parse(resetTokensJson);
            
            // Store the token with expiration (30 minutes from now)
            resetTokens[email] = {
                token: resetToken,
                expires: Date.now() + (30 * 60 * 1000) // 30 minutes
            };
            
            localStorage.setItem('reset_tokens', JSON.stringify(resetTokens));
            
            // Show success message
            forgotSuccess.classList.remove('d-none');
            
            // In a real app, we'd redirect the user to check their email
            // For our demo, we'll provide a direct link to the reset page
            setTimeout(() => {
                const resetUrl = `reset-password.html?token=${resetToken}`;
                forgotSuccess.innerHTML = `Password reset link sent! <a href="${resetUrl}" class="alert-link">Click here</a> to reset your password.`;
            }, 2000);
            
        } catch (error) {
            forgotError.textContent = error.message;
            forgotError.classList.remove('d-none');
        }
    });
}); 