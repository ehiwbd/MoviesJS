/**
 * User model class
 * Represents a user with profile information and preferences
 */
class User {
    constructor(username, email, id = null) {
        this.id = id || this.generateId();
        this.username = username;
        this.email = email;
        this.password = null; // For registration
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        
        // Profile information
        this.bio = '';
        this.favoriteGenres = [];
        this.avatar = null;
        
        // Statistics
        this.stats = {
            moviesWatched: 0,
            moviesPlanned: 0,
            moviesFavorited: 0,
            totalReviews: 0,
            averageRating: 0
        };
        
        // Collections
        this.collections = {
            watched: [],
            planned: [],
            favorites: []
        };
        
        // Preferences
        this.preferences = {
            notifications: true,
            publicProfile: true,
            theme: 'light'
        };
    }

    /**
     * Generate unique ID for the user
     */
    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Update user profile
     */
    updateProfile(profileData) {
        const allowedFields = ['username', 'email', 'bio', 'favoriteGenres', 'avatar'];
        
        allowedFields.forEach(field => {
            if (profileData.hasOwnProperty(field)) {
                this[field] = profileData[field];
            }
        });
        
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update user preferences
     */
    updatePreferences(preferences) {
        this.preferences = { ...this.preferences, ...preferences };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Add movie to collection
     */
    addToCollection(movieId, collectionType) {
        if (!this.collections[collectionType]) {
            throw new Error(`Invalid collection type: ${collectionType}`);
        }
        
        if (!this.collections[collectionType].includes(movieId)) {
            this.collections[collectionType].push(movieId);
            this.updateStats();
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove movie from collection
     */
    removeFromCollection(movieId, collectionType) {
        if (!this.collections[collectionType]) {
            throw new Error(`Invalid collection type: ${collectionType}`);
        }
        
        const index = this.collections[collectionType].indexOf(movieId);
        if (index > -1) {
            this.collections[collectionType].splice(index, 1);
            this.updateStats();
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Check if movie is in collection
     */
    isInCollection(movieId, collectionType) {
        if (!this.collections[collectionType]) {
            return false;
        }
        return this.collections[collectionType].includes(movieId);
    }

    /**
     * Update user statistics
     */
    updateStats() {
        this.stats.moviesWatched = this.collections.watched.length;
        this.stats.moviesPlanned = this.collections.planned.length;
        this.stats.moviesFavorited = this.collections.favorites.length;
    }

    /**
     * Update review statistics
     */
    updateReviewStats(totalReviews, averageRating) {
        this.stats.totalReviews = totalReviews;
        this.stats.averageRating = averageRating;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get user display name
     */
    getDisplayName() {
        return this.username;
    }

    /**
     * Get user initials for avatar
     */
    getInitials() {
        return this.username
            .split(' ')
            .map(name => name.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    }

    /**
     * Get formatted join date
     */
    getFormattedJoinDate() {
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get genre statistics
     */
    getGenreStats() {
        // This would typically be calculated based on watched movies and reviews
        // For now, return favorite genres with mock data
        return this.favoriteGenres.map(genre => ({
            name: genre,
            count: Math.floor(Math.random() * 20) + 1,
            percentage: Math.floor(Math.random() * 30) + 10
        }));
    }

    /**
     * Get activity summary
     */
    getActivitySummary() {
        return {
            totalMovies: this.stats.moviesWatched,
            totalReviews: this.stats.totalReviews,
            averageRating: this.stats.averageRating,
            favoriteGenres: this.favoriteGenres.slice(0, 3),
            joinDate: this.getFormattedJoinDate()
        };
    }

    /**
     * Convert to JSON for storage
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            bio: this.bio,
            favoriteGenres: this.favoriteGenres,
            avatar: this.avatar,
            stats: this.stats,
            collections: this.collections,
            preferences: this.preferences,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create User instance from JSON data
     */
    static fromJSON(data) {
        const user = new User(data.username, data.email, data.id);
        
        user.bio = data.bio || '';
        user.favoriteGenres = data.favoriteGenres || [];
        user.avatar = data.avatar || null;
        user.stats = data.stats || user.stats;
        user.collections = data.collections || user.collections;
        user.preferences = data.preferences || user.preferences;
        user.createdAt = data.createdAt;
        user.updatedAt = data.updatedAt;
        
        return user;
    }

    /**
     * Validate user data
     */
    static validate(data) {
        const errors = [];
        
        if (!data.username || data.username.trim().length < 2) {
            errors.push('Имя пользователя должно содержать минимум 2 символа');
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Указан некорректный email адрес');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
