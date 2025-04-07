/**
 * Home Page JS
 */

onDOMContentLoaded(() => {
    // Check if user is authenticated
    requireAuth();
    
    // DOM elements
    const userFullName = document.getElementById('userFullName');
    const logoutBtn = document.getElementById('logoutBtn');
    const usersTableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const pagination = document.getElementById('pagination');
    const currentResults = document.getElementById('currentResults');
    const totalResults = document.getElementById('totalResults');
    const userDetailsBody = document.getElementById('userDetailsBody');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // User data and pagination state
    let users = [];
    let filteredUsers = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentUserId = null;
    
    // Display user's full name
    const displayUserInfo = () => {
        const user = getUserFromSession();
        if (user && user.firstName && user.lastName) {
            userFullName.textContent = `${user.firstName} ${user.lastName}`;
        } else if (user && user.email) {
            userFullName.textContent = user.email;
        } else {
            userFullName.textContent = 'User';
        }
    };
    
    // Fetch users
    const fetchUsers = () => {
        // In a real application, we would fetch from API
        // For this demo, we'll use the users stored in localStorage
        users = getStoredUsers();
        
        // Apply initial filter (show all)
        filterUsers();
    };
    
    // Filter users based on search
    const filterUsers = (searchTerm = '') => {
        if (!searchTerm) {
            filteredUsers = [...users];
        } else {
            const term = searchTerm.toLowerCase();
            filteredUsers = users.filter(user => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                
                return fullName.includes(term) || email.includes(term);
            });
        }
        
        totalResults.textContent = filteredUsers.length;
        
        // Reset to first page when filtering
        currentPage = 1;
        
        // Render the current page
        renderTable();
        renderPagination();
    };
    
    // Render the users table
    const renderTable = () => {
        // Calculate start and end indices for current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
        
        // Get current page data
        const currentPageData = filteredUsers.slice(startIndex, endIndex);
        
        // Update current results count
        currentResults.textContent = currentPageData.length;
        
        // Clear table
        usersTableBody.innerHTML = '';
        
        // If no users found
        if (currentPageData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center py-4">No users found</td>`;
            usersTableBody.appendChild(row);
            return;
        }
        
        // Render user rows
        currentPageData.forEach((user, index) => {
            const row = document.createElement('tr');
            
            // Format date
            const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            
            // Create action buttons
            const viewBtn = `<button class="btn btn-sm btn-outline-primary view-user me-1" data-id="${user.id}"><i class="bi bi-eye"></i></button>`;
            const deleteBtn = `<button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}"><i class="bi bi-trash"></i></button>`;
            
            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${user.firstName || ''} ${user.lastName || ''}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        ${viewBtn}
                        ${deleteBtn}
                    </div>
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                showUserDetails(userId);
            });
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                showDeleteConfirmation(userId);
            });
        });
    };
    
    // Render pagination controls
    const renderPagination = () => {
        pagination.innerHTML = '';
        
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        
        // If only one page, don't show pagination
        if (totalPages <= 1) {
            return;
        }
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        pagination.appendChild(prevLi);
        
        // Only show a subset of pages if there are many
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        pagination.appendChild(nextLi);
        
        // Add event listeners to pagination controls
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (this.getAttribute('aria-label') === 'Previous' && currentPage > 1) {
                    currentPage--;
                    renderTable();
                    renderPagination();
                } else if (this.getAttribute('aria-label') === 'Next' && currentPage < totalPages) {
                    currentPage++;
                    renderTable();
                    renderPagination();
                } else if (this.dataset.page) {
                    currentPage = parseInt(this.dataset.page);
                    renderTable();
                    renderPagination();
                }
                
                // Scroll to top of table
                document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
            });
        });
    };
    
    // Show user details modal
    const showUserDetails = (userId) => {
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return;
        }
        
        // Format date
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A';
        
        // Create user details HTML
        userDetailsBody.innerHTML = `
            <div class="user-details">
                <h5 class="mb-3">${user.firstName || ''} ${user.lastName || ''}</h5>
                <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                <p><strong>Role:</strong> ${user.role || 'User'}</p>
                <p><strong>Created At:</strong> ${createdDate}</p>
            </div>
        `;
        
        // Show modal
        const userDetailsModal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
        userDetailsModal.show();
    };
    
    // Show delete confirmation modal
    const showDeleteConfirmation = (userId) => {
        currentUserId = userId;
        
        // Show confirmation modal
        const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteConfirmModal.show();
    };
    
    // Delete user
    const deleteUserById = () => {
        if (!currentUserId) {
            return;
        }
        
        // Delete user from localStorage
        const result = deleteUser(currentUserId);
        
        if (result) {
            // Refresh the user list
            fetchUsers();
            
            // Hide modal
            const deleteConfirmModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            deleteConfirmModal.hide();
            
            // Clear current user ID
            currentUserId = null;
        }
    };
    
    // Logout function
    const logout = () => {
        // Clear auth data
        clearAuth();
        
        // Redirect to login page
        window.location.href = 'index.html';
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
        // Logout button
        logoutBtn.addEventListener('click', logout);
        
        // Search input (search on input)
        searchInput.addEventListener('input', () => {
            filterUsers(searchInput.value.trim());
        });
        
        // Delete confirmation button
        confirmDeleteBtn.addEventListener('click', deleteUserById);
    };
    
    // Initialize page
    const initPage = () => {
        displayUserInfo();
        fetchUsers();
        setupEventListeners();
    };
    
    // Run initialization
    initPage();
}); 