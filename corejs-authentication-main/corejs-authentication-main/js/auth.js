/**
 * Auth System - Shared Authentication Utilities
 */

// Constants
const LOCAL_STORAGE_TOKEN_KEY = 'auth_token';
const SESSION_STORAGE_USER_KEY = 'auth_user';
const LOCAL_STORAGE_USERS_KEY = 'auth_users';

// Validation Functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    return {
        isValid: Object.values(rules).every(Boolean),
        rules
    };
};

// Storage Functions
const saveToken = (token) => {
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
};

const getToken = () => {
    return localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
};

const saveUserToSession = (user) => {
    sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(user));
};

const getUserFromSession = () => {
    const userJson = sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};

const clearAuth = () => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
};

// Local Users Storage
const getStoredUsers = () => {
    const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

const saveStoredUsers = (users) => {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
};

const findUserByEmail = (email) => {
    const users = getStoredUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

const addUser = (user) => {
    const users = getStoredUsers();

    // Check if user already exists
    if (findUserByEmail(user.email)) {
        return false;
    }

    // Generate ID for new user
    user.id = Date.now().toString();
    user.createdAt = new Date().toISOString();

    users.push(user);
    saveStoredUsers(users);
    return true;
};

const updateUser = (userId, userData) => {
    const users = getStoredUsers();
    const index = users.findIndex(user => user.id === userId);

    if (index !== -1) {
        users[index] = { ...users[index], ...userData };
        saveStoredUsers(users);
        return true;
    }

    return false;
};

const deleteUser = (userId) => {
    const users = getStoredUsers();
    const filteredUsers = users.filter(user => user.id !== userId);

    if (filteredUsers.length < users.length) {
        saveStoredUsers(filteredUsers);
        return true;
    }

    return false;
};

// Auth Check Function
const isAuthenticated = () => {
    return getToken() !== null && getUserFromSession() !== null;
};

// Redirect if not authenticated
const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
};

// Redirect if already authenticated
const requireNoAuth = () => {
    if (isAuthenticated()) {
        window.location.href = 'home.html';
    }
};

const getRandomUsers = async () => {
    const url = 'https://api.freeapi.app/api/v1/public/randomusers?page=1&limit=10';
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('data', data);
        return data; 
    } catch (error) {
        console.error('Error fetching random users:', error);
        return [];
    }
};

// Password toggle function
const setupPasswordToggles = () => {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');

            // Toggle input type
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
};

// Document ready function
const onDOMContentLoaded = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
        console.log('usersFromApi', getRandomUsers());
    } else {
        callback();
    }
};
