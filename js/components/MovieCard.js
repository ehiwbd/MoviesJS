/**
 * Movie card component for displaying movies in grid layout
 * Handles movie display, interactions, and user collections
 */
class MovieCard {
    constructor(movie, options = {}) {
        this.movie = movie;
        this.options = {
            showActions: true,
            showRating: true,
            showGenres: true,
            clickable: true,
            ...options
        };
        this.userService = new UserService();
        this.currentUser = this.userService.getCurrentUser();
    }

    /**
     * Render the movie card HTML
     */
    render() {
        return `
            <div class="movie-card" data-movie-id="${this.movie.id}" ${this.options.clickable ? 'style="cursor: pointer;"' : ''}>
                <div class="movie-poster">
                    ${this.movie.posterUrl ? 
                        `<img src="${this.movie.posterUrl}" alt="${this.movie.title}" loading="lazy">` :
                        `<div class="movie-poster-placeholder">
                            <i class="fas fa-film"></i>
                            <span>Нет постера</span>
                        </div>`
                    }
                    ${this.renderRating()}
                    ${this.renderCollectionBadges()}
                </div>
                
                <div class="movie-info">
                    <h3 class="movie-title">${this.movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${this.movie.year}</span>
                        ${this.movie.reviewCount > 0 ? `
                            <span>•</span>
                            <span class="movie-reviews">${this.movie.reviewCount} отзывов</span>
                        ` : ''}
                    </div>
                    
                    <p class="movie-description">${this.movie.getShortDescription()}</p>
                    
                    ${this.options.showGenres ? this.renderGenres() : ''}
                    ${this.options.showActions ? this.renderActions() : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render movie rating
     */
    renderRating() {
        if (!this.options.showRating || this.movie.averageRating === 0) {
            return '';
        }

        return `
            <div class="movie-rating">
                <i class="fas fa-star"></i>
                ${this.movie.getFormattedRating()}
            </div>
        `;
    }

    /**
     * Render collection badges
     */
    renderCollectionBadges() {
        if (!this.currentUser) return '';

        const badges = [];
        
        if (this.userService.isInCollection(this.currentUser.id, this.movie.id, 'watched')) {
            badges.push('<div class="collection-badge watched" title="Просмотрено"><i class="fas fa-eye"></i></div>');
        }
        
        if (this.userService.isInCollection(this.currentUser.id, this.movie.id, 'planned')) {
            badges.push('<div class="collection-badge planned" title="В планах"><i class="fas fa-bookmark"></i></div>');
        }
        
        if (this.userService.isInCollection(this.currentUser.id, this.movie.id, 'favorites')) {
            badges.push('<div class="collection-badge favorite" title="В избранном"><i class="fas fa-heart"></i></div>');
        }

        return badges.length > 0 ? `<div class="collection-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Render movie genres
     */
    renderGenres() {
        if (!this.movie.genres.length) return '';

        return `
            <div class="movie-genres">
                ${this.movie.genres.map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join('')}
            </div>
        `;
    }

    /**
     * Render action buttons
     */
    renderActions() {
        if (!this.currentUser) return '';

        const reviewService = new ReviewService();
        const userReview = reviewService.getUserMovieReview(this.currentUser.id, this.movie.id);

        return `
            <div class="movie-actions">
                <div class="quick-actions">
                    ${!userReview ? `
                        <button class="action-btn action-review" data-action="review" data-movie-id="${this.movie.id}" title="Написать рецензию">
                            <i class="fas fa-plus"></i>
                            <span>Рецензия</span>
                        </button>
                    ` : `
                        <button class="action-btn action-edit-review" data-action="edit-review" data-movie-id="${this.movie.id}" data-review-id="${userReview.id}" title="Редактировать рецензию">
                            <i class="fas fa-edit"></i>
                            <span>Изменить</span>
                        </button>
                    `}
                </div>
                
                <div class="collection-actions">
                    <button class="action-btn collection-toggle ${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'watched') ? 'active' : ''}" 
                            data-action="toggle-collection" 
                            data-collection="watched" 
                            data-movie-id="${this.movie.id}"
                            title="${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'watched') ? 'Убрать из просмотренных' : 'Отметить как просмотренный'}">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    <button class="action-btn collection-toggle ${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'planned') ? 'active' : ''}" 
                            data-action="toggle-collection" 
                            data-collection="planned" 
                            data-movie-id="${this.movie.id}"
                            title="${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'planned') ? 'Убрать из планов' : 'Добавить в планы'}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    
                    <button class="action-btn collection-toggle ${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'favorites') ? 'active' : ''}" 
                            data-action="toggle-collection" 
                            data-collection="favorites" 
                            data-movie-id="${this.movie.id}"
                            title="${this.userService.isInCollection(this.currentUser.id, this.movie.id, 'favorites') ? 'Убрать из избранного' : 'Добавить в избранное'}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for the movie card
     */
    setupEventListeners(element) {
        // Click to open movie details
        if (this.options.clickable) {
            element.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (!e.target.closest('.action-btn')) {
                    this.openMovieDetails();
                }
            });
        }

        // Action buttons
        const actionButtons = element.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(btn);
            });
        });
    }

    /**
     * Handle action button clicks
     */
    handleAction(button) {
        const action = button.getAttribute('data-action');
        const movieId = button.getAttribute('data-movie-id');

        switch (action) {
            case 'review':
                this.showReviewModal(movieId);
                break;
            case 'edit-review':
                const reviewId = button.getAttribute('data-review-id');
                this.showReviewModal(movieId, reviewId);
                break;
            case 'toggle-collection':
                const collection = button.getAttribute('data-collection');
                this.toggleCollection(movieId, collection, button);
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    /**
     * Open movie details modal
     */
    openMovieDetails() {
        const movieService = new MovieService();
        movieService.incrementViewCount(this.movie.id);
        
        if (window.headerInstance) {
            window.headerInstance.openMovieModal(this.movie.id);
        }
    }

    /**
     * Show review modal
     */
    showReviewModal(movieId, reviewId = null) {
        if (window.headerInstance) {
            window.headerInstance.showReviewForm(movieId, reviewId);
        }
    }

    /**
     * Toggle movie in user collection
     */
    toggleCollection(movieId, collectionType, button) {
        if (!this.currentUser) {
            this.showNotification('Необходимо войти в систему', 'error');
            return;
        }

        try {
            const isInCollection = this.userService.isInCollection(this.currentUser.id, movieId, collectionType);
            
            if (isInCollection) {
                this.userService.removeFromCollection(this.currentUser.id, movieId, collectionType);
                button.classList.remove('active');
                this.showNotification(`Фильм удален из коллекции "${this.getCollectionName(collectionType)}"`, 'success');
            } else {
                this.userService.addToCollection(this.currentUser.id, movieId, collectionType);
                button.classList.add('active');
                this.showNotification(`Фильм добавлен в коллекцию "${this.getCollectionName(collectionType)}"`, 'success');
            }

            // Update collection badges
            this.updateCollectionBadges(button.closest('.movie-card'));

        } catch (error) {
            console.error('Error toggling collection:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    /**
     * Get collection display name
     */
    getCollectionName(collectionType) {
        const names = {
            watched: 'Просмотренные',
            planned: 'Планы к просмотру',
            favorites: 'Избранное'
        };
        return names[collectionType] || collectionType;
    }

    /**
     * Update collection badges on the card
     */
    updateCollectionBadges(cardElement) {
        const posterElement = cardElement.querySelector('.movie-poster');
        const existingBadges = posterElement.querySelector('.collection-badges');
        
        if (existingBadges) {
            existingBadges.remove();
        }

        const newBadges = this.renderCollectionBadges();
        if (newBadges) {
            posterElement.insertAdjacentHTML('beforeend', newBadges);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.headerInstance) {
            window.headerInstance.showNotification(message, type);
        }
    }

    /**
     * Create and return a DOM element for the movie card
     */
    createElement() {
        const cardElement = document.createElement('div');
        cardElement.innerHTML = this.render();
        const movieCard = cardElement.firstElementChild;
        
        this.setupEventListeners(movieCard);
        
        return movieCard;
    }

    /**
     * Update the movie data and re-render
     */
    updateMovie(newMovieData) {
        this.movie = newMovieData;
    }

    /**
     * Static method to create movie grid
     */
    static createMovieGrid(movies, container, options = {}) {
        if (!container) return;

        const gridOptions = {
            showActions: true,
            showRating: true,
            showGenres: true,
            clickable: true,
            ...options
        };

        container.innerHTML = '';

        if (movies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>Фильмы не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или фильтрации</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        movies.forEach(movie => {
            const movieCard = new MovieCard(movie, gridOptions);
            const cardElement = movieCard.createElement();
            fragment.appendChild(cardElement);
        });

        container.appendChild(fragment);
    }

    /**
     * Static method to create featured movie card
     */
    static createFeaturedCard(movie, container) {
        if (!container || !movie) return;

        const movieCard = new MovieCard(movie, {
            showActions: true,
            showRating: true,
            showGenres: true,
            clickable: true
        });

        container.innerHTML = `
            <div class="featured-movie">
                <div class="featured-movie-background">
                    ${movie.posterUrl ? 
                        `<img src="${movie.posterUrl}" alt="${movie.title}">` : 
                        ''
                    }
                </div>
                <div class="featured-movie-content">
                    <div class="container">
                        <div class="hero-content">
                            <h1 class="hero-title">${movie.title}</h1>
                            <div class="hero-rating">
                                <div class="rating-badge">
                                    <i class="fas fa-star"></i>
                                    ${movie.getFormattedRating()}
                                </div>
                                <div class="rating-stars">
                                    ${Array.from({length: 5}, (_, i) => {
                                        const starValue = (i + 1) * 2;
                                        return `<i class="fas fa-star ${movie.averageRating >= starValue ? 'star' : ''}"></i>`;
                                    }).join('')}
                                </div>
                            </div>
                            <p class="hero-description">${movie.description}</p>
                            <div class="hero-actions">
                                <button class="btn btn-primary" onclick="window.headerInstance.openMovieModal('${movie.id}')">
                                    <i class="fas fa-play"></i>
                                    Подробнее
                                </button>
                                ${movieCard.currentUser ? `
                                    <button class="btn btn-secondary" onclick="window.headerInstance.showReviewForm('${movie.id}')">
                                        <i class="fas fa-star"></i>
                                        Оценить
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
