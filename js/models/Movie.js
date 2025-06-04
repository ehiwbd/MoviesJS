/**
 * Movie model class
 * Represents a movie with all its properties
 */
class Movie {
    constructor(title, year, genres = [], description = '', posterUrl = '', id = null) {
        this.id = id || this.generateId();
        this.title = title;
        this.year = year;
        this.genres = genres;
        this.description = description;
        this.posterUrl = posterUrl;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        
        // Additional properties for tracking
        this.viewCount = 0;
        this.averageRating = 0;
        this.reviewCount = 0;
    }

    /**
     * Generate unique ID for the movie
     */
    generateId() {
        return 'movie_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Update movie properties
     */
    update(properties) {
        Object.keys(properties).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                this[key] = properties[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get movie display data
     */
    getDisplayData() {
        return {
            id: this.id,
            title: this.title,
            year: this.year,
            genres: this.genres,
            description: this.description,
            posterUrl: this.posterUrl,
            averageRating: this.averageRating,
            reviewCount: this.reviewCount,
            viewCount: this.viewCount
        };
    }

    /**
     * Update rating statistics
     */
    updateRatingStats(averageRating, reviewCount) {
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Increment view count
     */
    incrementViewCount() {
        this.viewCount++;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Check if movie matches search query
     */
    matchesSearch(query) {
        const searchText = query.toLowerCase();
        return (
            this.title.toLowerCase().includes(searchText) ||
            this.description.toLowerCase().includes(searchText) ||
            this.genres.some(genre => genre.toLowerCase().includes(searchText))
        );
    }

    /**
     * Check if movie has specific genre
     */
    hasGenre(genre) {
        return this.genres.includes(genre);
    }

    /**
     * Get formatted year
     */
    getFormattedYear() {
        return this.year.toString();
    }

    /**
     * Get formatted rating
     */
    getFormattedRating() {
        return this.averageRating > 0 ? this.averageRating.toFixed(1) : 'Нет оценок';
    }

    /**
     * Get short description
     */
    getShortDescription(maxLength = 150) {
        if (this.description.length <= maxLength) {
            return this.description;
        }
        return this.description.substring(0, maxLength).trim() + '...';
    }

    /**
     * Convert to JSON for storage
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            year: this.year,
            genres: this.genres,
            description: this.description,
            posterUrl: this.posterUrl,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            viewCount: this.viewCount,
            averageRating: this.averageRating,
            reviewCount: this.reviewCount
        };
    }

    /**
     * Create Movie instance from JSON data
     */
    static fromJSON(data) {
        const movie = new Movie(
            data.title,
            data.year,
            data.genres,
            data.description,
            data.posterUrl,
            data.id
        );
        
        movie.createdAt = data.createdAt;
        movie.updatedAt = data.updatedAt;
        movie.viewCount = data.viewCount || 0;
        movie.averageRating = data.averageRating || 0;
        movie.reviewCount = data.reviewCount || 0;
        
        return movie;
    }

    /**
     * Validate movie data
     */
    static validate(data) {
        const errors = [];
        
        if (!data.title || data.title.trim().length === 0) {
            errors.push('Название фильма обязательно');
        }
        
        if (!data.year || isNaN(data.year) || data.year < 1800 || data.year > new Date().getFullYear() + 5) {
            errors.push('Указан некорректный год');
        }
        
        if (!Array.isArray(data.genres) || data.genres.length === 0) {
            errors.push('Необходимо указать хотя бы один жанр');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
