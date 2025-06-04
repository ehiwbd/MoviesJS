/**
 * Movie service for managing movie-related operations
 * Handles CRUD operations and business logic for movies
 */
class MovieService {
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Get all movies
     */
    getAllMovies() {
        return this.storageService.getMovies();
    }

    /**
     * Get movie by ID
     */
    getMovieById(movieId) {
        return this.storageService.getMovie(movieId);
    }

    /**
     * Add new movie
     */
    addMovie(movie) {
        try {
            const validation = Movie.validate(movie);
            if (!validation.isValid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }

            const success = this.storageService.saveMovie(movie);
            if (success) {
                this.updateMovieStats(movie.id);
                return movie;
            }
            throw new Error('Failed to save movie');
        } catch (error) {
            console.error('Error adding movie:', error);
            throw error;
        }
    }

    /**
     * Update existing movie
     */
    updateMovie(movieId, updateData) {
        try {
            const movie = this.getMovieById(movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            movie.update(updateData);
            
            const validation = Movie.validate(movie);
            if (!validation.isValid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }

            const success = this.storageService.saveMovie(movie);
            if (success) {
                return movie;
            }
            throw new Error('Failed to update movie');
        } catch (error) {
            console.error('Error updating movie:', error);
            throw error;
        }
    }

    /**
     * Delete movie
     */
    deleteMovie(movieId) {
        try {
            const success = this.storageService.deleteMovie(movieId);
            if (!success) {
                throw new Error('Failed to delete movie');
            }
            return true;
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }

    /**
     * Search movies by query
     */
    searchMovies(query, filters = {}) {
        const movies = this.getAllMovies();
        let filteredMovies = movies;

        // Apply search query
        if (query && query.trim().length > 0) {
            const searchTerm = query.toLowerCase().trim();
            filteredMovies = filteredMovies.filter(movie =>
                movie.matchesSearch(searchTerm)
            );
        }

        // Apply genre filter
        if (filters.genre && filters.genre !== 'all') {
            filteredMovies = filteredMovies.filter(movie =>
                movie.hasGenre(filters.genre)
            );
        }

        // Apply year filter
        if (filters.year) {
            filteredMovies = filteredMovies.filter(movie =>
                movie.year === parseInt(filters.year)
            );
        }

        // Apply rating filter
        if (filters.minRating) {
            filteredMovies = filteredMovies.filter(movie =>
                movie.averageRating >= parseFloat(filters.minRating)
            );
        }

        return this.sortMovies(filteredMovies, filters.sortBy || 'rating');
    }

    /**
     * Sort movies by specified criteria
     */
    sortMovies(movies, sortBy = 'rating') {
        const sortedMovies = [...movies];

        switch (sortBy) {
            case 'title':
                sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'year':
                sortedMovies.sort((a, b) => b.year - a.year);
                break;
            case 'rating':
                sortedMovies.sort((a, b) => b.averageRating - a.averageRating);
                break;
            case 'reviews':
                sortedMovies.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
            case 'views':
                sortedMovies.sort((a, b) => b.viewCount - a.viewCount);
                break;
            case 'newest':
                sortedMovies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                sortedMovies.sort((a, b) => b.averageRating - a.averageRating);
        }

        return sortedMovies;
    }

    /**
     * Get movies by genre
     */
    getMoviesByGenre(genre) {
        const movies = this.getAllMovies();
        return movies.filter(movie => movie.hasGenre(genre));
    }

    /**
     * Get top rated movies
     */
    getTopRatedMovies(limit = 10) {
        const movies = this.getAllMovies();
        return movies
            .filter(movie => movie.averageRating > 0)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, limit);
    }

    /**
     * Get most reviewed movies
     */
    getMostReviewedMovies(limit = 10) {
        const movies = this.getAllMovies();
        return movies
            .filter(movie => movie.reviewCount > 0)
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, limit);
    }

    /**
     * Get newest movies
     */
    getNewestMovies(limit = 10) {
        const movies = this.getAllMovies();
        return movies
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    /**
     * Get movies by year range
     */
    getMoviesByYearRange(startYear, endYear) {
        const movies = this.getAllMovies();
        return movies.filter(movie =>
            movie.year >= startYear && movie.year <= endYear
        );
    }

    /**
     * Get all unique genres
     */
    getAllGenres() {
        const movies = this.getAllMovies();
        const genresSet = new Set();
        movies.forEach(movie => {
            if (Array.isArray(movie.genres)) {
                movie.genres.forEach(genre => genresSet.add(genre));
            }
        });
        return Array.from(genresSet).sort();
    }

    /**
     * Get all unique years
     */
    getAllYears() {
        const movies = this.getAllMovies();
        const yearsSet = new Set();
        movies.forEach(movie => {
            if (movie.year) yearsSet.add(movie.year);
        });
        return Array.from(yearsSet).sort((a, b) => b - a);
    }

    /**
     * Get featured movie (highest rated with most reviews)
     */
    getFeaturedMovie() {
        const movies = this.getAllMovies();
        if (movies.length === 0) return null;

        return movies
            .filter(movie => movie.averageRating > 0 && movie.reviewCount > 0)
            .sort((a, b) => {
                // Combine rating and review count for featured selection
                const scoreA = a.averageRating * Math.log(a.reviewCount + 1);
                const scoreB = b.averageRating * Math.log(b.reviewCount + 1);
                return scoreB - scoreA;
            })[0] || movies[0];
    }

    /**
     * Get movie recommendations based on user preferences
     */
    getRecommendations(userId, limit = 8) {
        const userService = new UserService();
        const reviewService = new ReviewService();
        
        const user = userService.getUserById(userId);
        if (!user) return this.getTopRatedMovies(limit);

        const userReviews = reviewService.getUserReviews(userId);
        const watchedMovieIds = userReviews.map(review => review.movieId);
        
        const allMovies = this.getAllMovies();
        const unwatchedMovies = allMovies.filter(movie => 
            !watchedMovieIds.includes(movie.id)
        );

        // Simple recommendation based on favorite genres and ratings
        const favoriteGenres = user.favoriteGenres;
        let recommendations = unwatchedMovies;

        if (favoriteGenres.length > 0) {
            // Prioritize movies with favorite genres
            recommendations = recommendations.sort((a, b) => {
                const aGenreMatch = a.genres.filter(g => favoriteGenres.includes(g)).length;
                const bGenreMatch = b.genres.filter(g => favoriteGenres.includes(g)).length;
                
                if (aGenreMatch !== bGenreMatch) {
                    return bGenreMatch - aGenreMatch;
                }
                
                return b.averageRating - a.averageRating;
            });
        } else {
            // Sort by rating if no favorite genres
            recommendations = recommendations.sort((a, b) => b.averageRating - a.averageRating);
        }

        return recommendations.slice(0, limit);
    }

    /**
     * Update movie statistics (rating, review count)
     */
    updateMovieStats(movieId) {
        const reviewService = new ReviewService();
        const reviews = reviewService.getMovieReviews(movieId);
        
        const movie = this.getMovieById(movieId);
        if (!movie) return;

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            movie.updateRatingStats(averageRating, reviews.length);
        } else {
            movie.updateRatingStats(0, 0);
        }

        this.storageService.saveMovie(movie);
    }

    /**
     * Increment movie view count
     */
    incrementViewCount(movieId) {
        const movie = this.getMovieById(movieId);
        if (movie) {
            movie.incrementViewCount();
            this.storageService.saveMovie(movie);
        }
    }

    /**
     * Get movie statistics
     */
    getMovieStats() {
        const movies = this.getAllMovies();
        const reviews = this.storageService.getReviews();
        
        return {
            totalMovies: movies.length,
            totalReviews: reviews.length,
            averageRating: movies.length > 0 
                ? movies.reduce((sum, m) => sum + m.averageRating, 0) / movies.length 
                : 0,
            genreDistribution: this.getGenreDistribution(),
            yearDistribution: this.getYearDistribution(),
            topGenres: this.getTopGenres(),
            ratingDistribution: this.getRatingDistribution()
        };
    }

    /**
     * Get genre distribution
     */
    getGenreDistribution() {
        const movies = this.getAllMovies();
        const genreCount = {};

        movies.forEach(movie => {
            movie.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });

        return Object.entries(genreCount)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Get year distribution
     */
    getYearDistribution() {
        const movies = this.getAllMovies();
        const yearCount = {};

        movies.forEach(movie => {
            const decade = Math.floor(movie.year / 10) * 10;
            yearCount[decade] = (yearCount[decade] || 0) + 1;
        });

        return Object.entries(yearCount)
            .map(([decade, count]) => ({ decade: parseInt(decade), count }))
            .sort((a, b) => b.decade - a.decade);
    }

    /**
     * Get top genres by average rating
     */
    getTopGenres(limit = 5) {
        const genreRatings = {};
        const genreCounts = {};
        const movies = this.getAllMovies();

        movies.forEach(movie => {
            if (movie.averageRating > 0) {
                movie.genres.forEach(genre => {
                    if (!genreRatings[genre]) {
                        genreRatings[genre] = 0;
                        genreCounts[genre] = 0;
                    }
                    genreRatings[genre] += movie.averageRating;
                    genreCounts[genre]++;
                });
            }
        });

        return Object.keys(genreRatings)
            .map(genre => ({
                genre,
                averageRating: genreRatings[genre] / genreCounts[genre],
                count: genreCounts[genre]
            }))
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, limit);
    }

    /**
     * Get rating distribution
     */
    getRatingDistribution() {
        const movies = this.getAllMovies().filter(m => m.averageRating > 0);
        const distribution = {
            '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0, '5-6': 0,
            '6-7': 0, '7-8': 0, '8-9': 0, '9-10': 0
        };

        movies.forEach(movie => {
            const rating = movie.averageRating;
            if (rating < 2) distribution['1-2']++;
            else if (rating < 3) distribution['2-3']++;
            else if (rating < 4) distribution['3-4']++;
            else if (rating < 5) distribution['4-5']++;
            else if (rating < 6) distribution['5-6']++;
            else if (rating < 7) distribution['6-7']++;
            else if (rating < 8) distribution['7-8']++;
            else if (rating < 9) distribution['8-9']++;
            else distribution['9-10']++;
        });

        return distribution;
    }
}
