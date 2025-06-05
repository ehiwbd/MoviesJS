/**
 * Review service for managing movie reviews
 * Handles CRUD operations and business logic for reviews
 */
class ReviewService {
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Get all reviews
     */
    getAllReviews() {
        return this.storageService.getReviews();
    }

    /**
     * Get review by ID
     */
    getReviewById(reviewId) {
        return this.storageService.getReview(reviewId);
    }

    /**
     * Get reviews for a specific movie
     */
    getMovieReviews(movieId) {
        return this.storageService.getMovieReviews(movieId);
    }

    /**
     * Get reviews by a specific user
     */
    getUserReviews(userId) {
        return this.storageService.getUserReviews(userId);
    }

    /**
     * Add new review
     */
    addReview(reviewData) {
        try {
            const validation = Review.validateData(reviewData);
            if (!validation.isValid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }

            // Check if user already reviewed this movie
            const existingReview = this.getUserMovieReview(reviewData.userId, reviewData.movieId);
            if (existingReview) {
                throw new Error('You have already reviewed this movie');
            }

            // Получаем все фильмы из localStorage для проверки существования фильма
            const movies = JSON.parse(localStorage.getItem('cinema_tracker_movies') || '[]');
            const movie = movies.find(m => m.id === reviewData.movieId);
            if (!movie) {
                throw new Error('Фильм не найден в базе');
            }

            const review = new Review(
                reviewData.userId,
                reviewData.movieId,
                reviewData.rating,
                reviewData.comment
            );

            if (reviewData.tags) review.tags = reviewData.tags;
            if (reviewData.isPublic !== undefined) review.isPublic = reviewData.isPublic;

            const success = this.storageService.saveReview(review);
            if (success) {
                // Update movie and user statistics
                this.updateRelatedStats(review.movieId, review.userId);
                return review;
            }
            throw new Error('Failed to save review');
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    }

    /**
     * Update existing review
     */
    updateReview(reviewId, updateData) {
        try {
            const review = this.getReviewById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            const validation = Review.validateData({
                userId: review.userId,
                movieId: review.movieId,
                rating: updateData.rating || review.rating,
                comment: updateData.comment || review.comment
            });

            if (!validation.isValid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }

            review.update(updateData);
            
            const success = this.storageService.saveReview(review);
            if (success) {
                // Update movie and user statistics
                this.updateRelatedStats(review.movieId, review.userId);
                return review;
            }
            throw new Error('Failed to update review');
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    /**
     * Delete review
     */
    deleteReview(reviewId) {
        try {
            const review = this.getReviewById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            const success = this.storageService.deleteReview(reviewId);
            if (success) {
                // Update movie and user statistics
                this.updateRelatedStats(review.movieId, review.userId);
                return true;
            }
            throw new Error('Failed to delete review');
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    /**
     * Get user's review for a specific movie
     */
    getUserMovieReview(userId, movieId) {
        const userReviews = this.getUserReviews(userId);
        return userReviews.find(review => review.movieId === movieId) || null;
    }

    /**
     * Check if user has reviewed a movie
     */
    hasUserReviewedMovie(userId, movieId) {
        return this.getUserMovieReview(userId, movieId) !== null;
    }

    /**
     * Get movie rating statistics
     */
    getMovieRatingStats(movieId) {
        const reviews = this.getMovieReviews(movieId);
        
        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: {},
                sentimentDistribution: { positive: 0, neutral: 0, negative: 0 }
            };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Rating distribution
        const ratingDistribution = {};
        for (let i = 1; i <= 10; i++) {
            ratingDistribution[i] = 0;
        }
        reviews.forEach(review => {
            ratingDistribution[Math.floor(review.rating)]++;
        });

        // Sentiment distribution
        const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
        reviews.forEach(review => {
            const sentiment = review.getSentiment();
            sentimentDistribution[sentiment]++;
        });

        return {
            averageRating: parseFloat(averageRating.toFixed(2)),
            totalReviews: reviews.length,
            ratingDistribution,
            sentimentDistribution
        };
    }

    /**
     * Get user rating statistics
     */
    getUserRatingStats(userId) {
        const reviews = this.getUserReviews(userId);
        
        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: {},
                genrePreferences: []
            };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Rating distribution
        const ratingDistribution = {};
        for (let i = 1; i <= 10; i++) {
            ratingDistribution[i] = 0;
        }
        reviews.forEach(review => {
            ratingDistribution[Math.floor(review.rating)]++;
        });

        // Genre preferences based on reviews
        const genreStats = {};
        const movieService = new MovieService();
        
        reviews.forEach(review => {
            const movie = movieService.getMovieById(review.movieId);
            if (movie) {
                movie.genres.forEach(genre => {
                    if (!genreStats[genre]) {
                        genreStats[genre] = { count: 0, totalRating: 0 };
                    }
                    genreStats[genre].count++;
                    genreStats[genre].totalRating += review.rating;
                });
            }
        });

        const genrePreferences = Object.entries(genreStats)
            .map(([genre, stats]) => ({
                genre,
                count: stats.count,
                averageRating: stats.totalRating / stats.count,
                percentage: (stats.count / reviews.length) * 100
            }))
            .sort((a, b) => b.averageRating - a.averageRating);

        return {
            averageRating: parseFloat(averageRating.toFixed(2)),
            totalReviews: reviews.length,
            ratingDistribution,
            genrePreferences
        };
    }

    /**
     * Get recent reviews
     */
    getRecentReviews(limit = 10) {
        const reviews = this.getAllReviews();
        return reviews
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    /**
     * Get top reviews (most liked)
     */
    getTopReviews(limit = 10) {
        const reviews = this.getAllReviews();
        return reviews
            .filter(review => review.isPublic)
            .sort((a, b) => b.likes - a.likes)
            .slice(0, limit);
    }

    /**
     * Get reviews by rating range
     */
    getReviewsByRating(minRating, maxRating) {
        const reviews = this.getAllReviews();
        return reviews.filter(review => 
            review.rating >= minRating && review.rating <= maxRating
        );
    }

    /**
     * Search reviews by comment content
     */
    searchReviews(query) {
        if (!query || query.trim().length < 2) return [];
        
        const reviews = this.getAllReviews();
        const searchTerm = query.toLowerCase().trim();
        
        return reviews.filter(review =>
            review.isPublic &&
            (review.comment.toLowerCase().includes(searchTerm) ||
             review.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    /**
     * Get reviews with movie details
     */
    getReviewsWithMovieDetails(reviews) {
        // Получаем все фильмы из localStorage один раз
        const movies = JSON.parse(localStorage.getItem('cinema_tracker_movies') || '[]');
        const movieMap = {};
        movies.forEach(m => { movieMap[m.id] = m; });
        const userService = new UserService();
        return reviews.map(review => {
            const movie = movieMap[review.movieId];
            const user = userService.getUserById(review.userId);
            return {
                review: review,
                movie: movie,
                user: user ? { id: user.id, username: user.username } : null
            };
        });
    }

    /**
     * Get reviews with movie details (title, year, etc) from localStorage only
     */
    getReviewsWithMovieDetails() {
        // Получаем все фильмы из localStorage
        const movies = JSON.parse(localStorage.getItem('cinema_tracker_movies') || '[]');
        const movieMap = {};
        movies.forEach(m => { movieMap[m.id] = m; });
        // Получаем все отзывы
        const reviews = this.getAllReviews();
        // Возвращаем только отзывы, у которых есть фильм в localStorage
        return reviews
            .filter(review => movieMap[review.movieId])
            .map(review => ({
                ...review,
                movie: movieMap[review.movieId]
            }));
    }

    /**
     * Like a review
     */
    likeReview(reviewId) {
        try {
            const review = this.getReviewById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            review.addLike();
            const success = this.storageService.saveReview(review);
            
            if (!success) {
                throw new Error('Failed to like review');
            }
            
            return review;
        } catch (error) {
            console.error('Error liking review:', error);
            throw error;
        }
    }

    /**
     * Dislike a review
     */
    dislikeReview(reviewId) {
        try {
            const review = this.getReviewById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            review.addDislike();
            const success = this.storageService.saveReview(review);
            
            if (!success) {
                throw new Error('Failed to dislike review');
            }
            
            return review;
        } catch (error) {
            console.error('Error disliking review:', error);
            throw error;
        }
    }

    /**
     * Add tag to review
     */
    addTagToReview(reviewId, tag) {
        try {
            const review = this.getReviewById(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            review.addTag(tag);
            const success = this.storageService.saveReview(review);
            
            if (!success) {
                throw new Error('Failed to add tag to review');
            }
            
            return review;
        } catch (error) {
            console.error('Error adding tag to review:', error);
            throw error;
        }
    }

    /**
     * Get review statistics
     */
    getReviewStats() {
        const reviews = this.getAllReviews();
        
        if (reviews.length === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                publicReviews: 0,
                sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
                qualityDistribution: { excellent: 0, good: 0, basic: 0 },
                monthlyGrowth: []
            };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        const publicReviews = reviews.filter(review => review.isPublic).length;

        // Sentiment distribution
        const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
        reviews.forEach(review => {
            const sentiment = review.getSentiment();
            sentimentDistribution[sentiment]++;
        });

        // Quality distribution
        const qualityDistribution = { excellent: 0, good: 0, basic: 0 };
        reviews.forEach(review => {
            const quality = review.getQuality();
            qualityDistribution[quality]++;
        });

        // Monthly growth
        const monthlyGrowth = {};
        reviews.forEach(review => {
            const date = new Date(review.createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyGrowth[monthYear] = (monthlyGrowth[monthYear] || 0) + 1;
        });

        const monthlyGrowthArray = Object.entries(monthlyGrowth)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating.toFixed(2)),
            publicReviews,
            sentimentDistribution,
            qualityDistribution,
            monthlyGrowth: monthlyGrowthArray
        };
    }

    /**
     * Update related movie and user statistics
     */
    updateRelatedStats(movieId, userId) {
        // Update movie statistics
        const movieService = new MovieService();
        movieService.updateMovieStats(movieId);

        // Update user statistics
        const userService = new UserService();
        userService.updateUserStats(userId);
    }

    /**
     * Get trending reviews (recent with high engagement)
     */
    getTrendingReviews(limit = 10) {
        const reviews = this.getAllReviews();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return reviews
            .filter(review => 
                review.isPublic && 
                new Date(review.createdAt) > weekAgo
            )
            .sort((a, b) => {
                // Sort by engagement score (likes + views, weighted by recency)
                const daysSinceA = (now - new Date(a.createdAt)) / (24 * 60 * 60 * 1000);
                const daysSinceB = (now - new Date(b.createdAt)) / (24 * 60 * 60 * 1000);
                
                const scoreA = (a.likes + 1) / Math.pow(daysSinceA + 1, 0.5);
                const scoreB = (b.likes + 1) / Math.pow(daysSinceB + 1, 0.5);
                
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    /**
     * Export user reviews
     */
    exportUserReviews(userId) {
        const reviews = this.getUserReviews(userId);
        const movieService = new MovieService();
        
        return reviews.map(review => {
            const movie = movieService.getMovieById(review.movieId);
            return {
                movieTitle: movie ? movie.title : 'Unknown Movie',
                movieYear: movie ? movie.year : null,
                rating: review.rating,
                comment: review.comment,
                tags: review.tags,
                createdAt: review.createdAt,
                formattedDate: review.getFormattedDate()
            };
        });
    }
}
