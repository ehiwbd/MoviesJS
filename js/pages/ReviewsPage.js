/**
 * Reviews page component
 * Displays user's reviews with filtering and editing capabilities
 */
class ReviewsPage {
    constructor() {
        this.userService = new UserService();
        this.movieService = new MovieService();
        this.reviewService = new ReviewService();
        this.currentUser = null;
        this.userReviews = [];
        this.filters = {
            sortBy: 'newest',
            rating: 'all'
        };
    }

    /**
     * Render the reviews page
     */
    render() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        this.currentUser = this.userService.getCurrentUser();
        
        if (!this.currentUser) {
            this.renderLoginRequired();
            return;
        }

        mainContent.innerHTML = `
            <div class="reviews-page">
                <div class="container">
                    ${this.renderPageHeader()}
                    ${this.renderFilters()}
                    ${this.renderReviewsList()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadReviews();
    }

    /**
     * Render login required message
     */
    renderLoginRequired() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="login-required">
                <div class="container">
                    <div class="login-required-content">
                        <i class="fas fa-star-o"></i>
                        <h2>Необходима авторизация</h2>
                        <p>Для просмотра рецензий необходимо войти в систему</p>
                        <button class="btn btn-primary" id="login-from-reviews">
                            <i class="fas fa-sign-in-alt"></i>
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Setup login button
        setTimeout(() => {
            const loginBtn = document.getElementById('login-from-reviews');
            if (loginBtn && window.headerInstance) {
                loginBtn.addEventListener('click', () => {
                    window.headerInstance.handleLogin();
                });
            }
        }, 100);
    }

    /**
     * Render page header
     */
    renderPageHeader() {
        const reviewCount = this.reviewService.getUserReviews(this.currentUser.id).length;
        
        return `
            <section class="page-header">
                <h1>Мои рецензии</h1>
                <p>Всего рецензий: ${reviewCount}</p>
            </section>
        `;
    }

    /**
     * Render filter controls
     */
    renderFilters() {
        return `
            <section class="filters-section">
                <div class="filters-row">
                    <select id="sort-filter" class="filter-select">
                        <option value="newest" ${this.filters.sortBy === 'newest' ? 'selected' : ''}>Сначала новые</option>
                        <option value="oldest" ${this.filters.sortBy === 'oldest' ? 'selected' : ''}>Сначала старые</option>
                        <option value="rating-high" ${this.filters.sortBy === 'rating-high' ? 'selected' : ''}>Высокая оценка</option>
                        <option value="rating-low" ${this.filters.sortBy === 'rating-low' ? 'selected' : ''}>Низкая оценка</option>
                        <option value="movie-title" ${this.filters.sortBy === 'movie-title' ? 'selected' : ''}>По названию фильма</option>
                    </select>
                    
                    <select id="rating-filter" class="filter-select">
                        <option value="all" ${this.filters.rating === 'all' ? 'selected' : ''}>Все оценки</option>
                        <option value="9-10" ${this.filters.rating === '9-10' ? 'selected' : ''}>9-10 (Отлично)</option>
                        <option value="7-8" ${this.filters.rating === '7-8' ? 'selected' : ''}>7-8 (Хорошо)</option>
                        <option value="5-6" ${this.filters.rating === '5-6' ? 'selected' : ''}>5-6 (Средне)</option>
                        <option value="1-4" ${this.filters.rating === '1-4' ? 'selected' : ''}>1-4 (Плохо)</option>
                    </select>
                </div>
            </section>
        `;
    }

    /**
     * Render reviews list
     */
    renderReviewsList() {
        return `
            <section class="reviews-list-section">
                <div id="reviews-container">
                    <!-- Reviews will be loaded here -->
                </div>
            </section>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const sortFilter = document.getElementById('sort-filter');
        const ratingFilter = document.getElementById('rating-filter');

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.loadReviews();
            });
        }

        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.filters.rating = e.target.value;
                this.loadReviews();
            });
        }
    }

    /**
     * Load and display reviews
     */
    loadReviews() {
        try {
            this.userReviews = this.reviewService.getUserReviews(this.currentUser.id);
            
            // Apply filters
            const filteredReviews = this.applyFilters(this.userReviews);
            
            // Display reviews
            this.displayReviews(filteredReviews);
            
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showErrorState('Ошибка загрузки рецензий: ' + error.message);
        }
    }

    /**
     * Apply filters to reviews
     */
    applyFilters(reviews) {
        let filtered = [...reviews];

        // Apply rating filter
        if (this.filters.rating !== 'all') {
            const [min, max] = this.filters.rating.split('-').map(Number);
            filtered = filtered.filter(review => 
                review.rating >= min && review.rating <= max
            );
        }

        // Apply sorting
        switch (this.filters.sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'rating-high':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-low':
                filtered.sort((a, b) => a.rating - b.rating);
                break;
            case 'movie-title':
                filtered.sort((a, b) => {
                    const movieA = this.movieService.getMovieById(a.movieId);
                    const movieB = this.movieService.getMovieById(b.movieId);
                    const titleA = movieA ? movieA.title : '';
                    const titleB = movieB ? movieB.title : '';
                    return titleA.localeCompare(titleB);
                });
                break;
        }

        return filtered;
    }

    /**
     * Display reviews
     */
    displayReviews(reviews) {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = reviews.map(review => this.renderReviewItem(review)).join('');
        
        // Setup review item event listeners
        this.setupReviewItemListeners();
    }

    /**
     * Render individual review item
     */
    renderReviewItem(review) {
        const movie = this.movieService.getMovieById(review.movieId);
        
        return `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-poster">
                    ${movie && movie.posterUrl ? 
                        `<img src="${movie.posterUrl}" alt="${movie.title}">` :
                        `<div class="review-poster-placeholder">
                            <i class="fas fa-film"></i>
                        </div>`
                    }
                </div>
                
                <div class="review-content">
                    <div class="review-header">
                        <div class="review-movie-info">
                            <h3 class="review-title">${movie ? movie.title : 'Неизвестный фильм'}</h3>
                            <div class="review-meta">
                                ${movie ? `${movie.year} • ${movie.genres.join(', ')}` : ''}
                            </div>
                        </div>
                        
                        <div class="review-rating">
                            <i class="fas fa-star"></i>
                            ${review.getFormattedRating()}
                        </div>
                    </div>
                    
                    <div class="review-text">
                        ${review.comment}
                    </div>
                    
                    <div class="review-footer">
                        <div class="review-date">
                            ${review.getFormattedDateTime()}
                        </div>
                        
                        <div class="review-actions">
                            <button class="btn-link edit-review-btn" data-review-id="${review.id}" data-movie-id="${review.movieId}">
                                <i class="fas fa-edit"></i>
                                Редактировать
                            </button>
                            <button class="btn-link delete-review-btn" data-review-id="${review.id}">
                                <i class="fas fa-trash"></i>
                                Удалить
                            </button>
                            ${movie ? `
                                <button class="btn-link view-movie-btn" data-movie-id="${movie.id}">
                                    <i class="fas fa-eye"></i>
                                    Подробнее о фильме
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup review item event listeners
     */
    setupReviewItemListeners() {
        // Edit review buttons
        const editButtons = document.querySelectorAll('.edit-review-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.getAttribute('data-review-id');
                const movieId = btn.getAttribute('data-movie-id');
                this.editReview(movieId, reviewId);
            });
        });

        // Delete review buttons
        const deleteButtons = document.querySelectorAll('.delete-review-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.getAttribute('data-review-id');
                this.deleteReview(reviewId);
            });
        });

        // View movie buttons
        const viewButtons = document.querySelectorAll('.view-movie-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const movieId = btn.getAttribute('data-movie-id');
                if (window.headerInstance) {
                    window.headerInstance.openMovieModal(movieId);
                }
            });
        });
    }

    /**
     * Edit review
     */
    editReview(movieId, reviewId) {
        if (window.headerInstance) {
            window.headerInstance.showReviewForm(movieId, reviewId);
        }
    }

    /**
     * Delete review
     */
    async deleteReview(reviewId) {
        const confirmed = await Modal.confirm({
            title: 'Удаление рецензии',
            message: 'Вы уверены, что хотите удалить эту рецензию?',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            this.reviewService.deleteReview(reviewId);
            
            // Show success notification
            if (window.headerInstance) {
                window.headerInstance.showNotification('Рецензия успешно удалена', 'success');
            }
            
            // Reload reviews
            this.loadReviews();
            
        } catch (error) {
            console.error('Error deleting review:', error);
            if (window.headerInstance) {
                window.headerInstance.showNotification('Ошибка удаления рецензии: ' + error.message, 'error');
            }
        }
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        let message = 'У вас пока нет рецензий';
        let description = 'Перейдите на главную страницу и оставьте свою первую рецензию';

        if (this.filters.rating !== 'all') {
            message = 'Нет рецензий с выбранной оценкой';
            description = 'Попробуйте изменить фильтр или сбросить все фильтры';
        }

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-star-o"></i>
                </div>
                <h3 class="empty-state-title">${message}</h3>
                <p class="empty-state-description">${description}</p>
                <div class="empty-state-actions">
                    <a href="/" data-route="/" class="btn btn-primary">
                        <i class="fas fa-home"></i>
                        На главную
                    </a>
                    ${this.filters.rating !== 'all' ? `
                        <button class="btn btn-secondary" onclick="this.resetFilters()">
                            <i class="fas fa-refresh"></i>
                            Сбросить фильтры
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="error-state-title">Произошла ошибка</h3>
                <p class="error-state-description">${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    Обновить страницу
                </button>
            </div>
        `;
    }

    /**
     * Reset filters
     */
    resetFilters() {
        this.filters = {
            sortBy: 'newest',
            rating: 'all'
        };
        
        // Update filter controls
        document.getElementById('sort-filter').value = 'newest';
        document.getElementById('rating-filter').value = 'all';
        
        // Reload reviews
        this.loadReviews();
    }

    /**
     * Destroy page and cleanup
     */
    destroy() {
        // Cleanup any event listeners or resources if needed
    }
}