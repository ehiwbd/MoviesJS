/**
 * Storage service for handling localStorage operations
 * Provides centralized data management for the application
 */
class StorageService {
    constructor() {
        this.STORAGE_KEYS = {
            MOVIES: 'cinema_tracker_movies',
            USERS: 'cinema_tracker_users',
            REVIEWS: 'cinema_tracker_reviews',
            CURRENT_USER: 'cinema_tracker_current_user',
            SETTINGS: 'cinema_tracker_settings'
        };
    }

    /**
     * Get all movies from storage
     */
    getMovies() {
    try {
        const moviesData = localStorage.getItem(this.STORAGE_KEYS.MOVIES);
        if (!moviesData) return [];
        const parsed = JSON.parse(moviesData);
        const movies = Array.isArray(parsed) ? parsed : [parsed];
        return movies.map(movieData => Movie.fromJSON(movieData));
    } catch (error) {
        console.error('Error loading movies:', error);
        return [];
    }
    }

    /**
     * Save movies to storage
     */
    saveMovies(movies) {
        try {
            const moviesData = movies.map(movie => movie.toJSON());
            localStorage.setItem(this.STORAGE_KEYS.MOVIES, JSON.stringify(moviesData));
            return true;
        } catch (error) {
            console.error('Error saving movies:', error);
            return false;
        }
    }
    saveMovie(movie) {
    const movies = this.getMovies();
    const existingIndex = movies.findIndex(m => m.id === movie.id);
    if (existingIndex >= 0) {
        movies[existingIndex] = movie;
    } else {
        movies.push(movie);
    }
    return this.saveMovies(movies);
    }

    /**
     * Get movie by ID
     */
    getMovie(movieId) {
        const movies = this.getMovies();
        return movies.find(movie => movie.id === movieId) || null;
    }

    /**
     * Add or update movie
     */
    saveMovie(movie) {
        const movies = this.getMovies();
        const existingIndex = movies.findIndex(m => m.id === movie.id);
        
        if (existingIndex >= 0) {
            movies[existingIndex] = movie;
        } else {
            movies.push(movie);
        }
        
        return this.saveMovies(movies);
    }

    /**
     * Delete movie
     */
    deleteMovie(movieId) {
        const movies = this.getMovies();
        const filteredMovies = movies.filter(movie => movie.id !== movieId);
        
        // Also remove related reviews
        const reviews = this.getReviews();
        const filteredReviews = reviews.filter(review => review.movieId !== movieId);
        this.saveReviews(filteredReviews);
        
        return this.saveMovies(filteredMovies);
    }

    /**
     * Get all users from storage
     */
    getUsers() {
        try {
            const usersData = localStorage.getItem(this.STORAGE_KEYS.USERS);
            if (!usersData) return [];
            
            const users = JSON.parse(usersData);
            return users.map(userData => User.fromJSON(userData));
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    /**
     * Save users to storage
     */
    saveUsers(users) {
        try {
            const usersData = users.map(user => user.toJSON());
            localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(usersData));
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            return false;
        }
    }

    /**
     * Get user by ID
     */
    getUser(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId) || null;
    }

    /**
     * Add or update user
     */
    saveUser(user) {
        const users = this.getUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        return this.saveUsers(users);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        try {
            const currentUserData = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
            if (!currentUserData) return null;
            
            const userData = JSON.parse(currentUserData);
            return User.fromJSON(userData);
        } catch (error) {
            console.error('Error loading current user:', error);
            return null;
        }
    }

    /**
     * Set current user
     */
    setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user.toJSON()));
            } else {
                localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
            }
            return true;
        } catch (error) {
            console.error('Error setting current user:', error);
            return false;
        }
    }

    /**
     * Get all reviews from storage
     */
    getReviews() {
        try {
            const reviewsData = localStorage.getItem(this.STORAGE_KEYS.REVIEWS);
            if (!reviewsData) return [];
            
            const reviews = JSON.parse(reviewsData);
            // Фильтруем null-отзывы
            return reviews.map(reviewData => Review.fromJSON(reviewData)).filter(Boolean);
        } catch (error) {
            console.error('Error loading reviews:', error);
            return [];
        }
    }

    /**
     * Save reviews to storage
     */
    saveReviews(reviews) {
        try {
            const reviewsData = reviews.map(review => review.toJSON());
            localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviewsData));
            return true;
        } catch (error) {
            console.error('Error saving reviews:', error);
            return false;
        }
    }

    /**
     * Clear all data from storage
     */
    clear() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get item from storage by key
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error getting item:', error);
            return null;
        }
    }

    /**
     * Set item in storage by key
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('Error setting item:', error);
            return false;
        }
    }

    /**
     * Get review by ID
     */
    getReview(reviewId) {
        const reviews = this.getReviews();
        return reviews.find(review => review.id === reviewId) || null;
    }

    /**
     * Add or update review
     */
    saveReview(review) {
        const reviews = this.getReviews();
        const existingIndex = reviews.findIndex(r => r.id === review.id);
        
        if (existingIndex >= 0) {
            reviews[existingIndex] = review;
        } else {
            reviews.push(review);
        }
        
        return this.saveReviews(reviews);
    }

    /**
     * Delete review
     */
    deleteReview(reviewId) {
        try {
            // Работаем напрямую с JSON данными для корректного удаления
            const reviewsData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.REVIEWS) || '[]');
            const filteredReviews = reviewsData.filter(review => review.id !== reviewId);
            
            localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(filteredReviews));
            return true;
        } catch (error) {
            console.error('Error deleting review:', error);
            return false;
        }
    }

    /**
     * Get reviews for a specific movie
     */
    getMovieReviews(movieId) {
        // Фильтруем null-отзывы
        return this.getReviews().filter(review => review.movieId === movieId);
    }

    /**
     * Get reviews by a specific user
     */
    getUserReviews(userId) {
        // Фильтруем null-отзывы
        return this.getReviews().filter(review => review.userId === userId);
    }

    /**
     * Get application settings
     */
    getSettings() {
        try {
            const settingsData = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (!settingsData) {
                return this.getDefaultSettings();
            }
            
            const settings = JSON.parse(settingsData);
            return { ...this.getDefaultSettings(), ...settings };
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Save application settings
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Get default application settings
     */
    getDefaultSettings() {
        return {
            theme: 'light',
            language: 'ru',
            moviesPerPage: 12,
            defaultGenreFilter: 'all',
            defaultSortBy: 'rating',
            showRatings: true,
            showDescriptions: true,
            autoplay: false
        };
    }

    /**
     * Clear all data (for debugging or reset)
     */
    clearAllData() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        let totalSize = 0;
        const info = {};
        
        Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            const size = data ? data.length : 0;
            info[name] = {
                size: size,
                sizeKB: (size / 1024).toFixed(2)
            };
            totalSize += size;
        });
        
        info.TOTAL = {
            size: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2),
            sizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
        
        return info;
    }

    /**
     * Export all data as JSON
     */
    exportData() {
        return {
            movies: this.getMovies().map(m => m.toJSON()),
            users: this.getUsers().map(u => u.toJSON()),
            reviews: this.getReviews().map(r => r.toJSON()),
            currentUser: this.getCurrentUser()?.toJSON() || null,
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data from JSON
     */
    importData(data) {
        try {
            if (data.movies) {
                const movies = data.movies.map(m => Movie.fromJSON(m));
                this.saveMovies(movies);
            }
            
            if (data.users) {
                const users = data.users.map(u => User.fromJSON(u));
                this.saveUsers(users);
            }
            
            if (data.reviews) {
                const reviews = data.reviews.map(r => Review.fromJSON(r));
                this.saveReviews(reviews);
            }
            
            if (data.currentUser) {
                const currentUser = User.fromJSON(data.currentUser);
                this.setCurrentUser(currentUser);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}
