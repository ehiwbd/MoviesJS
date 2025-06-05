/**
 * Header component for navigation and search
 * Handles user menu, search functionality, and navigation
 */
class Header {
    constructor() {
        this.storageService = new StorageService();
        this.userService = new UserService();
        this.currentUser = null;
        this.searchTimeout = null;
        this.activeModal = null; // Track the active modal instance
    }

    /**
     * Render the header component
     */
    render() {
        const headerElement = document.getElementById('header');
        if (!headerElement) return;

        this.currentUser = this.userService.getCurrentUser();
        
        headerElement.innerHTML = `
            <div class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="/" class="logo" data-route="/">
                            <i class="fas fa-film"></i>
                            КиноТрекер
                        </a>
                        
                        <nav class="nav">
                            <ul class="nav-links">
                                <li><a href="/" data-route="/" class="nav-link">Главная</a></li>
                                <li><a href="/reviews" data-route="/reviews" class="nav-link">Мои рецензии</a></li>
                                <li><a href="/profile" data-route="/profile" class="nav-link">Профиль</a></li>
                            </ul>
                            
                            <div class="search-container">
                                <i class="fas fa-search search-icon"></i>
                                <input 
                                    type="text" 
                                    id="search-input" 
                                    class="search-input" 
                                    placeholder="Поиск фильмов..."
                                    autocomplete="off"
                                >
                                <div id="search-results" class="search-results hidden"></div>
                            </div>
                            
                            <div class="user-menu">
                                ${this.renderUserMenu()}
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateActiveNavLink();
    }

    /**
     * Render user menu based on authentication status
     */
    renderUserMenu() {
        if (this.currentUser) {
            return `
                <div class="user-dropdown">
                    <button class="btn btn-secondary user-toggle" id="user-toggle">
                        <i class="fas fa-user"></i>
                        ${this.currentUser.getDisplayName()}
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown-menu hidden" id="user-dropdown-menu">
                        <a href="/profile" data-route="/profile" class="dropdown-item">
                            <i class="fas fa-user"></i>
                            Мой профиль
                        </a>
                        <a href="/reviews" data-route="/reviews" class="dropdown-item">
                            <i class="fas fa-star"></i>
                            Мои рецензии
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item logout-btn" id="logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <button class="btn btn-primary" id="login-btn">
                    <i class="fas fa-sign-in-alt"></i>
                    Войти
                </button>
            `;
        }
    }

    /**
     * Setup event listeners for header interactions
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('focus', () => this.showSearchResults());
            searchInput.addEventListener('blur', () => {
                // Delay hiding to allow clicking on results
                setTimeout(() => this.hideSearchResults(), 200);
            });
        }

        // User dropdown
        const userToggle = document.getElementById('user-toggle');
        if (userToggle) {
            userToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Login functionality
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => this.hideUserDropdown());

        // Update nav links on route change
        window.addEventListener('hashchange', () => this.updateActiveNavLink());
    }

    /**
     * Handle search input with debouncing
     */
    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    /**
     * Perform the actual search
     */
    performSearch(query) {
        const movieService = new MovieService();
        const results = movieService.searchMovies(query, { limit: 8 });
        this.displaySearchResults(results, query);
    }

    /**
     * Display search results dropdown
     */
    displaySearchResults(results, query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>Ничего не найдено по запросу "${query}"</p>
                </div>
            `;
        } else {
            searchResults.innerHTML = `
                <div class="search-results-header">
                    Найдено фильмов: ${results.length}
                </div>
                ${results.map(movie => `
                    <div class="search-result-item" data-movie-id="${movie.id}">
                        <div class="search-result-poster">
                            ${movie.posterUrl ? 
                                `<img src="${movie.posterUrl}" alt="${movie.title}">` :
                                `<i class="fas fa-film"></i>`
                            }
                        </div>
                        <div class="search-result-info">
                            <div class="search-result-title">${movie.title}</div>
                            <div class="search-result-meta">${movie.year} • ${movie.genres.join(', ')}</div>
                            <div class="search-result-rating">
                                ${movie.averageRating > 0 ? 
                                    `<i class="fas fa-star"></i> ${movie.getFormattedRating()}` : 
                                    'Нет оценок'
                                }
                            </div>
                        </div>
                    </div>
                `).join('')}
                <div class="search-results-footer">
                    <a href="/?search=${encodeURIComponent(query)}" data-route="/?search=${encodeURIComponent(query)}" class="btn btn-primary">
                        Посмотреть все результаты
                    </a>
                </div>
            `;

            // Add click handlers for search results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const movieId = item.getAttribute('data-movie-id');
                    this.openMovieModal(movieId);
                    this.hideSearchResults();
                });
            });
        }

        this.showSearchResults();
    }

    /**
     * Show search results dropdown
     */
    showSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.classList.remove('hidden');
        }
    }

    /**
     * Hide search results dropdown
     */
    hideSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.classList.add('hidden');
        }
    }

    /**
     * Toggle user dropdown menu
     */
    toggleUserDropdown() {
        const dropdownMenu = document.getElementById('user-dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.classList.toggle('hidden');
        }
    }

    /**
     * Hide user dropdown menu
     */
    hideUserDropdown() {
        const dropdownMenu = document.getElementById('user-dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.classList.add('hidden');
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        this.userService.logoutUser();
        this.hideUserDropdown();
        this.render(); // Re-render header
        
        // Redirect to home page
        window.location.hash = '/';
        
        // Show logout notification
        this.showNotification('Вы успешно вышли из системы', 'success');
    }

    /**
     * Handle user login (show login modal)
     */
    handleLogin() {
        const modal = new Modal();
        modal.show({
            title: 'Авторизация',
            content: this.renderAuthForm(),
            size: 'medium'
        });

        // Store modal instance for later use
        this.activeModal = modal;
        // Setup authentication forms
        setTimeout(() => {
            this.setupAuthForms(modal);
        }, 100);
    }

    /**
     * Render authentication form
     */
    renderAuthForm() {
        return `
            <div class="auth-container">
                <div class="auth-tabs">
                    <button type="button" class="auth-tab active" data-tab="login">Вход</button>
                    <button type="button" class="auth-tab" data-tab="register">Регистрация</button>
                </div>
                
                <!-- Login Form -->
                <form id="login-form" class="auth-form active">
                    <div class="form-group">
                        <label for="login-email" class="form-label">Email</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            class="form-input" 
                            placeholder="your.email@example.com"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password" class="form-label">Пароль</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            class="form-input" 
                            placeholder="Введите пароль"
                            required
                        >
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Войти
                        </button>
                    </div>
                </form>
                
                <!-- Registration Form -->
                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label for="register-username" class="form-label">Имя пользователя</label>
                        <input 
                            type="text" 
                            id="register-username" 
                            class="form-input" 
                            placeholder="Введите ваше имя"
                            required
                            minlength="2"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="register-email" class="form-label">Email</label>
                        <input 
                            type="email" 
                            id="register-email" 
                            class="form-input" 
                            placeholder="your.email@example.com"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="register-password" class="form-label">Пароль</label>
                        <input 
                            type="password" 
                            id="register-password" 
                            class="form-input" 
                            placeholder="Минимум 6 символов"
                            required
                            minlength="6"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="register-confirm-password" class="form-label">Подтвердите пароль</label>
                        <input 
                            type="password" 
                            id="register-confirm-password" 
                            class="form-input" 
                            placeholder="Повторите пароль"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <small class="text-muted">
                            Регистрируясь, вы соглашаетесь с условиями использования сервиса.
                        </small>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Зарегистрироваться
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Setup authentication forms
     */
    setupAuthForms(modal) {
        // Setup tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        const authForms = document.querySelectorAll('.auth-form');
        
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update tab active state
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update form active state
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${targetTab}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
        
        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e, modal));
        }
        
        // Setup registration form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e, modal));
        }
    }

    /**
     * Handle login form submission
     */
    handleLoginSubmit(event, modal) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        try {
            // Try to find existing user
            let user = this.userService.getAllUsers().find(u => u.email === email);
            
            if (!user) {
                this.showNotification('Пользователь не найден. Попробуйте зарегистрироваться.', 'error');
                return;
            }
            
            // Проверяем пароль (простая проверка хэша)
            const hashedPassword = this.hashPassword(password);
            if (user.password && user.password !== hashedPassword) {
                this.showNotification('Неверный пароль', 'error');
                return;
            }
            
            this.showNotification('Добро пожаловать!', 'success');
            
            // Set as current user
            this.storageService.setCurrentUser(user);
            this.currentUser = user;
            
            // Close modal and re-render header
            modal.hide();
            this.render();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Ошибка входа: ' + error.message, 'error');
        }
    }

    /**
     * Handle registration form submission
     */
    handleRegisterSubmit(event, modal) {
        event.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        try {
            // Check if user already exists
            const existingUser = this.userService.getAllUsers().find(u => u.email === email);
            if (existingUser) {
                this.showNotification('Пользователь с таким email уже существует', 'error');
                return;
            }
            
            // Create new user
            const user = this.userService.createUser({ 
                username, 
                email, 
                password: this.hashPassword(password)
            });
            
            this.showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            
            // Set as current user
            this.storageService.setCurrentUser(user);
            this.currentUser = user;
            
            // Close modal and re-render header
            modal.hide();
            this.render();
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Ошибка регистрации: ' + error.message, 'error');
        }
    }

    /**
     * Simple password hashing (for demo purposes)
     */
    hashPassword(password) {
        // Simple hash for demo - in real app use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Open movie modal
     */
    openMovieModal(movieId) {
        const movieService = new MovieService();
        const movie = movieService.getMovieById(movieId);
        
        if (!movie) {
            this.showNotification('Фильм не найден', 'error');
            return;
        }

        // Increment view count
        movieService.incrementViewCount(movieId);

        const modal = new Modal();
        modal.show({
            title: movie.title,
            content: this.renderMovieDetails(movie),
            size: 'large'
        });
    }

    /**
     * Render movie details for modal
     */
    renderMovieDetails(movie) {
        const reviewService = new ReviewService();
        const reviews = reviewService.getMovieReviews(movie.id);
        const userReview = this.currentUser ? 
            reviewService.getUserMovieReview(this.currentUser.id, movie.id) : null;

        return `
            <div class="movie-details">
                <div class="movie-details-header">
                    <div class="movie-details-poster">
                        ${movie.posterUrl ? 
                            `<img src="${movie.posterUrl}" alt="${movie.title}">` :
                            `<div class="movie-poster-placeholder"><i class="fas fa-film"></i></div>`
                        }
                    </div>
                    <div class="movie-details-info">
                        <h2>${movie.title}</h2>
                        <div class="movie-meta">
                            <span>${movie.year}</span>
                            <span>•</span>
                            <span>${movie.genres.join(', ')}</span>
                        </div>
                        <div class="movie-rating">
                            ${movie.averageRating > 0 ? 
                                `<i class="fas fa-star"></i> ${movie.getFormattedRating()} (${movie.reviewCount} отзывов)` : 
                                'Нет оценок'
                            }
                        </div>
                        <p class="movie-description">${movie.description}</p>
                        
                        ${this.currentUser ? `
                            <div class="movie-actions">
                                ${!userReview ? `
                                    <button class="btn btn-primary" onclick="window.headerInstance.showReviewForm('${movie.id}')">
                                        <i class="fas fa-plus"></i>
                                        Написать рецензию
                                    </button>
                                ` : `
                                    <button class="btn btn-secondary" onclick="window.headerInstance.showReviewForm('${movie.id}', '${userReview.id}')">
                                        <i class="fas fa-edit"></i>
                                        Редактировать рецензию
                                    </button>
                                `}
                                
                                <div class="collection-buttons">
                                    <button class="btn btn-secondary collection-btn" data-collection="watched" data-movie-id="${movie.id}">
                                        <i class="fas fa-eye"></i>
                                        ${this.userService.isInCollection(this.currentUser.id, movie.id, 'watched') ? 'Просмотрено' : 'Отметить просмотренным'}
                                    </button>
                                    <button class="btn btn-secondary collection-btn" data-collection="planned" data-movie-id="${movie.id}">
                                        <i class="fas fa-bookmark"></i>
                                        ${this.userService.isInCollection(this.currentUser.id, movie.id, 'planned') ? 'В планах' : 'Добавить в планы'}
                                    </button>
                                    <button class="btn btn-secondary collection-btn" data-collection="favorites" data-movie-id="${movie.id}">
                                        <i class="fas fa-heart"></i>
                                        ${this.userService.isInCollection(this.currentUser.id, movie.id, 'favorites') ? 'В избранном' : 'Добавить в избранное'}
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${reviews.length > 0 ? `
                    <div class="movie-reviews">
                        <h3>Рецензии (${reviews.length})</h3>
                        ${reviews.slice(0, 3).map(review => {
                            const user = this.userService.getUserById(review.userId);
                            return `
                                <div class="review-preview">
                                    <div class="review-header">
                                        <span class="review-author">${user ? user.username : 'Неизвестный пользователь'}</span>
                                        <span class="review-rating">
                                            <i class="fas fa-star"></i>
                                            ${review.getFormattedRating()}
                                        </span>
                                    </div>
                                    <p class="review-comment">${review.getShortComment(150)}</p>
                                    <div class="review-date">${review.getFormattedDate()}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Show review form modal
     */
    showReviewForm(movieId, reviewId = null) {
        const movieService = new MovieService();
        const movie = movieService.getMovieById(movieId);
        
        if (!movie || !this.currentUser) return;

        const reviewService = new ReviewService();
        const existingReview = reviewId ? reviewService.getReviewById(reviewId) : null;

        const modal = new Modal();
        modal.show({
            title: existingReview ? 'Редактировать рецензию' : 'Написать рецензию',
            content: `
                <form id="review-form" class="review-form">
                    <div class="form-group">
                        <label class="form-label">Фильм</label>
                        <div class="form-static">${movie.title} (${movie.year})</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="review-rating" class="form-label">Оценка</label>
                        <div class="rating-input">
                            <div class="rating-stars-input" id="rating-stars">
                                ${Array.from({length: 10}, (_, i) => `
                                    <span class="rating-star" data-rating="${i + 1}">
                                        <i class="fas fa-star"></i>
                                    </span>
                                `).join('')}
                            </div>
                            <span class="rating-value" id="rating-value">0</span>
                        </div>
                        <input type="hidden" id="review-rating" value="${existingReview ? existingReview.rating : 0}">
                    </div>
                    
                    <div class="form-group">
                        <label for="review-comment" class="form-label">Рецензия</label>
                        <textarea 
                            id="review-comment" 
                            class="form-textarea" 
                            placeholder="Поделитесь своими впечатлениями о фильме..."
                            rows="6"
                            required
                        >${existingReview ? existingReview.comment : ''}</textarea>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${existingReview ? 'Сохранить изменения' : 'Опубликовать рецензию'}
                        </button>
                    </div>
                </form>
            `,
            size: 'medium'
        });

        // Store modal instance for later use
        this.activeModal = modal;
        // Setup rating stars and form submission
        setTimeout(() => {
            this.setupReviewForm(movieId, reviewId, existingReview);
        }, 100);
    }

    /**
     * Setup review form interactions
     */
    setupReviewForm(movieId, reviewId, existingReview) {
        const ratingStars = document.querySelectorAll('.rating-star');
        const ratingValue = document.getElementById('rating-value');
        const ratingInput = document.getElementById('review-rating');
        const reviewForm = document.getElementById('review-form');

        // Set initial rating if editing
        if (existingReview) {
            this.setRatingStars(existingReview.rating);
            ratingValue.textContent = existingReview.rating;
            ratingInput.value = existingReview.rating;
        }

        // Rating stars interaction
        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.setRatingStars(rating);
                ratingValue.textContent = rating;
                ratingInput.value = rating;
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.highlightRatingStars(rating);
            });
        });

        document.getElementById('rating-stars').addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            this.setRatingStars(currentRating);
        });

        // Form submission
        reviewForm.addEventListener('submit', (e) => {
            this.handleReviewSubmit(e, movieId, reviewId);
        });
    }

    /**
     * Set rating stars display
     */
    setRatingStars(rating) {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Highlight rating stars on hover
     */
    highlightRatingStars(rating) {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#fbbf24';
            } else {
                star.style.color = '';
            }
        });
    }

    /**
     * Handle review form submission
     */
    handleReviewSubmit(event, movieId, reviewId) {
        event.preventDefault();
        const rating = parseFloat(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value.trim();
        if (!rating || rating < 1 || rating > 10) {
            this.showNotification('Пожалуйста, выберите оценку от 1 до 10', 'error');
            return;
        }
        if (!comment) {
            this.showNotification('Пожалуйста, напишите рецензию', 'error');
            return;
        }
        try {
            const reviewService = new ReviewService();
            if (reviewId) {
                reviewService.updateReview(reviewId, { rating, comment });
                this.showNotification('Рецензия успешно обновлена!', 'success');
            } else {
                reviewService.addReview({
                    userId: this.currentUser.id,
                    movieId: movieId,
                    rating: rating,
                    comment: comment
                });
                this.showNotification('Рецензия успешно опубликована!', 'success');
            }
            if (window.headerInstance && window.headerInstance.activeModal) {
                window.headerInstance.activeModal.hide();
                window.headerInstance.activeModal = null;
            } else {
                // Fallback: remove modal and restore scroll if needed
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) {
                    overlay.remove();
                    document.body.style.overflow = '';
                }
            }
            if (window.location.hash.includes('reviews')) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Review submission error:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    /**
     * Update active navigation link
     */
    updateActiveNavLink() {
        const currentRoute = window.location.hash.slice(1) || '/';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === currentRoute || (currentRoute === '' && route === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Remove on click
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Make header instance globally available for modal callbacks
window.headerInstance = new Header();
