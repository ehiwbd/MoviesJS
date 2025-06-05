/**
 * User service for managing user-related operations
 * Handles user authentication, profiles, and user data management
 */
class UserService {
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * Get all users
     */
    getAllUsers() {
        const users = this.storageService.getUsers();
        return users.map(u => User.fromJSON(u));
    }

    /**
     * Get user by ID
     */
    getUserById(userId) {
        const data = this.storageService.getUser(userId);
        if (!data) return null;
        return User.fromJSON(data);
    }

    /**
     * Get current logged-in user
     */
    getCurrentUser() {
        // Получаем текущего пользователя из localStorage и восстанавливаем как экземпляр User
        const data = this.storageService.getCurrentUser();
        if (!data) return null;
        return User.fromJSON(data);
    }

    /**
     * Create new user
     */
    createUser(userData) {
        try {
            const validation = User.validate(userData);
            if (!validation.isValid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }

            // Check if email already exists
            const existingUsers = this.getAllUsers();
            const emailExists = existingUsers.some(user => user.email === userData.email);
            if (emailExists) {
                throw new Error('User with this email already exists');
            }

            const user = new User(userData.username, userData.email);
            if (userData.bio) user.bio = userData.bio;
            if (userData.favoriteGenres) user.favoriteGenres = userData.favoriteGenres;
            if (userData.password) user.password = userData.password;

            const success = this.storageService.saveUser(user);
            if (success) {
                return user;
            }
            throw new Error('Failed to create user');
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    updateUserProfile(userId, profileData) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.updateProfile(profileData);
            
            const success = this.storageService.saveUser(user);
            if (success) {
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.storageService.setCurrentUser(user);
                }
                return user;
            }
            throw new Error('Failed to update user profile');
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Update user preferences
     */
    updateUserPreferences(userId, preferences) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.updatePreferences(preferences);
            
            const success = this.storageService.saveUser(user);
            if (success) {
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.storageService.setCurrentUser(user);
                }
                return user;
            }
            throw new Error('Failed to update user preferences');
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Login user (set as current user)
     */
    loginUser(email, password = null) {
        try {
            const users = this.getAllUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('User not found');
            }

            // For this demo, we'll skip password validation
            // In a real app, you'd verify the password here
            
            this.storageService.setCurrentUser(user);
            return user;
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        }
    }

    /**
     * Logout current user
     */
    logoutUser() {
        try {
            this.storageService.setCurrentUser(null);
            return true;
        } catch (error) {
            console.error('Error logging out user:', error);
            return false;
        }
    }

    /**
     * Add movie to user collection
     */
    addToCollection(userId, movieId, collectionType) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.addToCollection(movieId, collectionType);
            
            const success = this.storageService.saveUser(user);
            if (success) {
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.storageService.setCurrentUser(user);
                }
                return true;
            }
            throw new Error('Failed to add movie to collection');
        } catch (error) {
            console.error('Error adding to collection:', error);
            throw error;
        }
    }

    /**
     * Remove movie from user collection
     */
    removeFromCollection(userId, movieId, collectionType) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.removeFromCollection(movieId, collectionType);
            
            const success = this.storageService.saveUser(user);
            if (success) {
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.storageService.setCurrentUser(user);
                }
                return true;
            }
            throw new Error('Failed to remove movie from collection');
        } catch (error) {
            console.error('Error removing from collection:', error);
            throw error;
        }
    }

    /**
     * Get user's movie collection
     */
    getUserCollection(userId, collectionType) {
        const user = this.getUserById(userId);
        if (!user || !user.collections[collectionType]) {
            return [];
        }

        const movieService = new MovieService();
        return user.collections[collectionType]
            .map(movieId => movieService.getMovieById(movieId))
            .filter(movie => movie !== null);
    }

    /**
     * Check if movie is in user collection
     */
    isInCollection(userId, movieId, collectionType) {
        const user = this.getUserById(userId);
        if (!user) return false;
        
        return user.isInCollection(movieId, collectionType);
    }

    /**
     * Update user statistics based on reviews and collections
     */
    updateUserStats(userId) {
        try {
            const user = this.getUserById(userId);
            if (!user) return;

            const reviewService = new ReviewService();
            const userReviews = reviewService.getUserReviews(userId);
            
            // Update review statistics
            if (userReviews.length > 0) {
                const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
                const averageRating = totalRating / userReviews.length;
                user.updateReviewStats(userReviews.length, averageRating);
            } else {
                user.updateReviewStats(0, 0);
            }

            // Update collection statistics
            user.updateStats();
            
            this.storageService.saveUser(user);
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.storageService.setCurrentUser(user);
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    /**
     * Get user's viewing statistics
     */
    getUserViewingStats(userId) {
        const user = this.getUserById(userId);
        if (!user) return null;

        const reviewService = new ReviewService();
        const userReviews = reviewService.getUserReviews(userId);
        
        // Calculate genre preferences from reviews
        const genreStats = {};
        const movieService = new MovieService();
        
        userReviews.forEach(review => {
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
                percentage: (stats.count / userReviews.length) * 100
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalMoviesWatched: user.stats.moviesWatched,
            totalMoviesPlanned: user.stats.moviesPlanned,
            totalMoviesFavorited: user.stats.moviesFavorited,
            totalReviews: user.stats.totalReviews,
            averageRating: user.stats.averageRating,
            genrePreferences: genrePreferences,
            joinDate: user.getFormattedJoinDate(),
            activitySummary: user.getActivitySummary()
        };
    }

    /**
     * Get user's recent activity
     */
    getUserRecentActivity(userId, limit = 10) {
        const reviewService = new ReviewService();
        const userReviews = reviewService.getUserReviews(userId);
        
        // Sort by creation date and limit
        const recentReviews = userReviews
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        const movieService = new MovieService();
        
        return recentReviews.map(review => {
            const movie = movieService.getMovieById(review.movieId);
            return {
                type: 'review',
                date: review.createdAt,
                movie: movie,
                review: review,
                formattedDate: review.getFormattedDateTime()
            };
        });
    }

    /**
     * Get user recommendations based on their preferences
     */
    getUserRecommendations(userId, limit = 8) {
        const movieService = new MovieService();
        return movieService.getRecommendations(userId, limit);
    }

    /**
     * Search users by username or email
     */
    searchUsers(query) {
        if (!query || query.trim().length < 2) return [];
        
        const users = this.getAllUsers();
        const searchTerm = query.toLowerCase().trim();
        
        return users.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get user profile summary for display
     */
    getUserProfileSummary(userId) {
        const user = this.getUserById(userId);
        if (!user) return null;

        const stats = this.getUserViewingStats(userId);
        const recentActivity = this.getUserRecentActivity(userId, 5);

        return {
            user: user,
            stats: stats,
            recentActivity: recentActivity,
            collections: {
                watched: this.getUserCollection(userId, 'watched'),
                planned: this.getUserCollection(userId, 'planned'),
                favorites: this.getUserCollection(userId, 'favorites')
            }
        };
    }

    /**
     * Delete user and all associated data
     */
    deleteUser(userId) {
        try {
            // Remove user reviews
            const reviewService = new ReviewService();
            const userReviews = reviewService.getUserReviews(userId);
            userReviews.forEach(review => {
                reviewService.deleteReview(review.id);
            });

            // Remove user from storage
            const users = this.getAllUsers();
            const filteredUsers = users.filter(user => user.id !== userId);
            const success = this.storageService.saveUsers(filteredUsers);

            // If current user is being deleted, logout
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.logoutUser();
            }

            return success;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Get platform statistics
     */
    getPlatformStats() {
        const users = this.getAllUsers();
        const reviews = this.storageService.getReviews();
        
        return {
            totalUsers: users.length,
            totalReviews: reviews.length,
            averageReviewsPerUser: users.length > 0 ? reviews.length / users.length : 0,
            mostActiveUsers: this.getMostActiveUsers(5),
            userGrowth: this.getUserGrowthStats()
        };
    }

    /**
     * Get most active users
     */
    getMostActiveUsers(limit = 5) {
        const users = this.getAllUsers();
        return users
            .sort((a, b) => b.stats.totalReviews - a.stats.totalReviews)
            .slice(0, limit)
            .map(user => ({
                id: user.id,
                username: user.username,
                reviewCount: user.stats.totalReviews,
                averageRating: user.stats.averageRating
            }));
    }

    /**
     * Get user growth statistics
     */
    getUserGrowthStats() {
        const users = this.getAllUsers();
        const monthlyGrowth = {};
        
        users.forEach(user => {
            const date = new Date(user.createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyGrowth[monthYear] = (monthlyGrowth[monthYear] || 0) + 1;
        });

        return Object.entries(monthlyGrowth)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}
