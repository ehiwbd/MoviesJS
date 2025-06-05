/**
 * Review model class
 * Represents a user review for a movie
 */
class Review {
    constructor(userId, movieId, rating, comment, id = null) {
        this.id = id || this.generateId();
        this.userId = userId;
        this.movieId = movieId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        
        // Additional properties
        this.isPublic = true;
        this.likes = 0;
        this.dislikes = 0;
        this.tags = [];
        
        // Validation
        this.validate();
    }

    /**
     * Generate unique ID for the review
     */
    generateId() {
        return 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate review data
     */
    validate() {
        if (!this.userId || !this.movieId) {
            throw new Error('User ID and Movie ID are required');
        }
        
        if (!this.isValidRating(this.rating)) {
            throw new Error('Rating must be between 1 and 10');
        }
        
        if (!this.comment || this.comment.trim().length === 0) {
            throw new Error('Review comment is required');
        }
    }

    /**
     * Check if rating is valid
     */
    isValidRating(rating) {
        return !isNaN(rating) && rating >= 1 && rating <= 10;
    }

    /**
     * Update review
     */
    update(data) {
        const allowedFields = ['rating', 'comment', 'isPublic', 'tags'];
        
        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                this[field] = data[field];
            }
        });
        
        this.updatedAt = new Date().toISOString();
        this.validate();
    }

    /**
     * Get formatted rating
     */
    getFormattedRating() {
        return this.rating.toFixed(1);
    }

    /**
     * Get rating stars
     */
    getRatingStars() {
        const fullStars = Math.floor(this.rating / 2);
        const hasHalfStar = (this.rating % 2) >= 1;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return {
            full: fullStars,
            half: hasHalfStar ? 1 : 0,
            empty: emptyStars
        };
    }

    /**
     * Get formatted creation date
     */
    getFormattedDate() {
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get formatted creation time
     */
    getFormattedTime() {
        const date = new Date(this.createdAt);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get formatted date and time
     */
    getFormattedDateTime() {
        const date = new Date(this.createdAt);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get short comment
     */
    getShortComment(maxLength = 200) {
        if (this.comment.length <= maxLength) {
            return this.comment;
        }
        return this.comment.substring(0, maxLength).trim() + '...';
    }

    /**
     * Add like
     */
    addLike() {
        this.likes++;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Add dislike
     */
    addDislike() {
        this.dislikes++;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get like ratio
     */
    getLikeRatio() {
        const total = this.likes + this.dislikes;
        if (total === 0) return 0;
        return (this.likes / total) * 100;
    }

    /**
     * Add tag
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove tag
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Check if review has tag
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    /**
     * Get review sentiment based on rating
     */
    getSentiment() {
        if (this.rating >= 8) return 'positive';
        if (this.rating >= 6) return 'neutral';
        return 'negative';
    }

    /**
     * Get review quality indicator
     */
    getQuality() {
        let score = 0;
        
        // Length factor
        if (this.comment.length > 100) score += 1;
        if (this.comment.length > 300) score += 1;
        
        // Engagement factor
        if (this.likes > 0) score += 1;
        if (this.likes > 5) score += 1;
        
        // Tag factor
        if (this.tags.length > 0) score += 1;
        
        if (score >= 4) return 'excellent';
        if (score >= 2) return 'good';
        return 'basic';
    }

    /**
     * Convert to JSON for storage
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            movieId: this.movieId,
            rating: this.rating,
            comment: this.comment,
            isPublic: this.isPublic,
            likes: this.likes,
            dislikes: this.dislikes,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create Review instance from JSON data
     */
    static fromJSON(data) {
        // Проверяем, существует ли фильм с таким movieId в localStorage
        const movies = JSON.parse(localStorage.getItem('cinema_tracker_movies') || '[]');
        const movieExists = movies.some(m => m.id === data.movieId);
        if (!movieExists) return null;
        
        const review = new Review(
            data.userId,
            data.movieId,
            data.rating,
            data.comment,
            data.id
        );
        review.isPublic = data.isPublic !== undefined ? data.isPublic : true;
        review.likes = data.likes || 0;
        review.dislikes = data.dislikes || 0;
        review.tags = data.tags || [];
        review.createdAt = data.createdAt;
        review.updatedAt = data.updatedAt;
        return review;
    }

    /**
     * Validate review data for creation
     */
    static validateData(data) {
        const errors = [];
        
        if (!data.userId) {
            errors.push('User ID is required');
        }
        
        if (!data.movieId) {
            errors.push('Movie ID is required');
        }
        
        if (!data.rating || isNaN(data.rating) || data.rating < 1 || data.rating > 10) {
            errors.push('Rating must be between 1 and 10');
        }
        
        // Only require non-empty comment, not minimum length
        if (!data.comment || data.comment.trim().length === 0) {
            errors.push('Review comment is required');
        }
        
        if (data.comment && data.comment.length > 2000) {
            errors.push('Review comment must be less than 2000 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
