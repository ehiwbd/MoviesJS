/**
 * Main application entry point
 * Initializes the app and handles routing
 */
class App {
    constructor() {
        this.router = null;
        this.storageService = new StorageService();
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            // Initialize storage and default data
            this.initializeStorage();
            
            // Initialize default movies
            this.initializeDefaultMovies();
            
            // Initialize router
            this.router = new Router();
            this.router.init();
            
            // Setup global event listeners
            this.setupEventListeners();
            
            // Initialize header
            window.headerInstance = new Header();
            window.headerInstance.render();
            
            console.log('FlickFolio приложение успешно инициализировано');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
        }
    }

    /**
     * Initialize localStorage with default data
     */
    initializeStorage() {
        const storageService = new StorageService();
        const userService = new UserService();
        
        // Create demo user if no users exist
        const users = userService.getAllUsers();
        if (users.length === 0) {
            const demoUser = userService.createUser({
                username: 'Демо Пользователь',
                email: 'demo@example.com',
                password: this.hashPassword('123456')
            });
            console.log('Создан демо пользователь: demo@example.com / 123456');
        }
    }

    /**
     * Simple password hashing (for demo purposes)
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    /**
     * Initialize default movies for the application
     */
    initializeDefaultMovies() {
        // Теперь не добавляем дефолтные фильмы
        const movieService = new MovieService();
        // Check if movies already exist
        if (movieService.getAllMovies().length > 0) {
            return;
        }
        // 12 фильмов, которые раньше были в openMovieModal
        const movies = [
            new Movie('Побег из Шоушенка', 1994, ['Драма'], 'История надежды и дружбы в стенах тюрьмы строгого режима.', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', '1'),
            new Movie('Крестный отец', 1972, ['Драма', 'Криминал'], 'Эпическая сага о семье, власти и предательстве в мире мафии.', 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '2'),
            new Movie('Темный рыцарь', 2008, ['Боевик', 'Криминал', 'Драма'], 'Бэтмен сталкивается с хаосом, который несет Джокер в Готэм-сити.', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '3'),
            new Movie('Начало', 2010, ['Боевик', 'Фантастика', 'Триллер'], 'Вор проникает в сны людей, чтобы украсть их секреты.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', '4'),
            new Movie('Матрица', 1999, ['Боевик', 'Фантастика'], 'Программист обнаруживает, что реальность - это симуляция.', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', '5'),
            new Movie('Властелин колец: Возвращение короля', 2003, ['Приключения', 'Драма', 'Фэнтези'], 'Финальная битва за Средиземье и судьба Кольца Всевластия.', 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', '6'),
            new Movie('Форрест Гамп', 1994, ['Драма', 'Мелодрама'], 'История простого человека, ставшего свидетелем важных событий американской истории.', 'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', '7'),
            new Movie('Криминальное чтиво', 1994, ['Криминал', 'Драма'], 'Переплетающиеся истории преступного мира Лос-Анджелеса.', 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', '8'),
            new Movie('Интерстеллар', 2014, ['Драма', 'Фантастика', 'Приключения'], 'Команда исследователей путешествует через червоточину в поисках нового дома для человечества.', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '9'),
            new Movie('Бойцовский клуб', 1999, ['Драма'], 'Офисный работник создает подпольный бойцовский клуб.', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '10'),
            new Movie('Список Шиндлера', 1993, ['Драма', 'История'], 'Реальная история Оскара Шиндлера, спасшего более тысячи евреев.', 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', '11'),
            new Movie('Мстители: Финал', 2019, ['Боевик', 'Фантастика', 'Приключения'], 'Финальная битва супергероев против Таноса.', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', '12')
        ];
        movies.forEach(movie => movieService.addMovie(movie));
        
        // Add some default reviews
        this.initializeDefaultReviews();
    }

    /**
     * Initialize default reviews
     */
    initializeDefaultReviews() {
        const reviewService = new ReviewService();
        const userService = new UserService();
        const movieService = new MovieService();
        
        // Check if reviews already exist
        if (reviewService.getAllReviews().length > 0) {
            return;
        }
        
        const currentUser = userService.getCurrentUser();
        if (!currentUser) return;
        
        const movies = movieService.getAllMovies();
        if (movies.length === 0) return;
        
        // Add some sample reviews
        const sampleReviews = [
            {
                movieTitle: 'Побег из Шоушенка',
                rating: 10,
                comment: 'Невероятная история о надежде и дружбе. Один из лучших фильмов всех времен!'
            },
            {
                movieTitle: 'Крестный отец',
                rating: 9,
                comment: 'Эпический шедевр о семье и власти. Марлон Брандо великолепен!'
            },
            {
                movieTitle: 'Темный рыцарь',
                rating: 9,
                comment: 'Хит Леджер создал незабываемого Джокера. Лучший супергеройский фильм!'
            }
        ];
        
        sampleReviews.forEach(reviewData => {
            const movie = movies.find(m => m.title === reviewData.movieTitle);
            if (movie) {
                const review = new Review(
                    currentUser.id,
                    movie.id,
                    reviewData.rating,
                    reviewData.comment
                );
                reviewService.addReview(review);
            }
        });
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle hash changes for routing
        window.addEventListener('hashchange', () => {
            if (this.router) {
                this.router.handleRoute();
            }
        });
        
        // Handle click events for navigation links
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                if (this.router) {
                    this.router.navigate(route);
                }
            }
        });
    }

    /**
     * Handle search functionality
     */
    handleSearch(query) {
        if (window.homePage && typeof window.homePage.handleSearch === 'function') {
            window.homePage.handleSearch(query);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // Make app globally available for debugging
    window.app = app;
});

// Глобальная функция для открытия модального окна фильма
window.openMovieModal = function(movieId) {
    const movieService = new MovieService();
    const movie = movieService.getMovieById(movieId);
    if (!movie) return;

    // Получаем текущий рейтинг пользователя
    const storageService = new StorageService();
    const currentUser = storageService.getCurrentUser();
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    const currentRating = userRatings[movieId] || 0;

    const modal = new Modal();
    modal.show({
        title: movie.title,
        content: `
            <div class="movie-modal">
                <div class="movie-modal-poster">
                    <img src="${movie.posterUrl}" alt="${movie.title}">
                </div>
                <div class="movie-modal-info">
                    <h3>${movie.title}</h3>
                    <p class="movie-year">${movie.year}</p>
                    <p class="movie-description">${movie.description}</p>
                    
                    ${currentUser ? `
                        <div class="rating-section">
                            <h4>Ваша оценка:</h4>
                            <div class="rating-container">
                                <div class="star-rating" id="star-rating">
                                    ${[1,2,3,4,5,6,7,8,9,10].map(star => `
                                        <span class="star ${star <= currentRating ? 'active' : ''}" data-rating="${star}">${star}</span>
                                    `).join('')}
                                </div>
                                <div class="rating-info">
                                    <div class="rating-text">
                                        Оценка: <span id="rating-value">${currentRating > 0 ? currentRating : 'не выбрана'}</span>/10
                                    </div>
                                    <div class="rating-description" id="rating-description">
                                        ${getRatingDescription(currentRating)}
                                    </div>
                                </div>
                            </div>
                            <div class="rating-controls">
                                <button class="btn btn-primary" id="save-rating">Сохранить оценку</button>
                                ${currentRating > 0 ? `<button class="btn btn-secondary" id="clear-rating">Удалить оценку</button>` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="login-prompt">
                            <p>Войдите в систему, чтобы оценить фильм</p>
                            <button class="btn btn-primary" onclick="window.headerInstance.handleLogin()">Войти</button>
                        </div>
                    `}
                </div>
            </div>
        `,
        size: 'large'
    });

    // Настройка рейтинга звездами
    if (currentUser) {
        setTimeout(() => {
            const stars = document.querySelectorAll('.star');
            const ratingValue = document.getElementById('rating-value');
            const saveButton = document.getElementById('save-rating');
            const clearButton = document.getElementById('clear-rating');
            let selectedRating = currentRating;

            stars.forEach(star => {
                star.addEventListener('mouseenter', () => {
                    const rating = parseInt(star.dataset.rating);
                    highlightStars(rating);
                    updateRatingDisplay(rating);
                });

                star.addEventListener('mouseleave', () => {
                    highlightStars(selectedRating);
                    updateRatingDisplay(selectedRating);
                });

                star.addEventListener('click', () => {
                    selectedRating = parseInt(star.dataset.rating);
                    highlightStars(selectedRating);
                    updateRatingDisplay(selectedRating);
                });
            });

            function highlightStars(rating) {
                stars.forEach(star => {
                    const starRating = parseInt(star.dataset.rating);
                    if (starRating <= rating) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                });
            }

            function updateRatingDisplay(rating) {
                ratingValue.textContent = rating > 0 ? rating : 'не выбрана';
                const description = document.getElementById('rating-description');
                if (description) {
                    description.textContent = getRatingDescription(rating);
                }
            }

            saveButton.addEventListener('click', () => {
                if (selectedRating > 0) {
                    // Создаем объект отзыва
                    const reviewData = {
                        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        userId: currentUser.id,
                        movieId: movie.id, // <-- use the correct movieId from the movie object
                        rating: selectedRating,
                        comment: prompt('Добавьте комментарий к оценке (необязательно):') || '',
                        isPublic: true,
                        likes: 0,
                        dislikes: 0,
                        tags: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    // Получаем существующие отзывы
                    const existingReviews = JSON.parse(localStorage.getItem('cinema_tracker_reviews') || '[]');
                    
                    // Проверяем, есть ли уже отзыв от этого пользователя на этот фильм
                    const existingReviewIndex = existingReviews.findIndex(
                        review => review.userId === currentUser.id && review.movieId === movie.id
                    );

                    if (existingReviewIndex !== -1) {
                        // Обновляем существующий отзыв
                        existingReviews[existingReviewIndex] = {
                            ...existingReviews[existingReviewIndex],
                            rating: selectedRating,
                            comment: reviewData.comment,
                            updatedAt: new Date().toISOString()
                        };
                    } else {
                        // Добавляем новый отзыв
                        existingReviews.push(reviewData);
                    }

                    // Сохраняем отзывы
                    localStorage.setItem('cinema_tracker_reviews', JSON.stringify(existingReviews));
                    
                    // Сохраняем рейтинг для быстрого доступа
                    userRatings[movie.id] = selectedRating;
                    localStorage.setItem('userRatings', JSON.stringify(userRatings));
                    
                    // Показываем уведомление
                    showNotification(`Отзыв с оценкой ${selectedRating}/10 сохранен для фильма "${movie.title}"`, 'success');
                    modal.hide();
                } else {
                    showNotification('Пожалуйста, выберите оценку', 'error');
                }
            });

            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    // Удаляем отзыв пользователя для этого фильма
                    const existingReviews = JSON.parse(localStorage.getItem('cinema_tracker_reviews') || '[]');
                    const reviewIndex = existingReviews.findIndex(
                        review => review.userId === currentUser.id && review.movieId === movie.id
                    );
                    if (reviewIndex !== -1) {
                        existingReviews.splice(reviewIndex, 1);
                        localStorage.setItem('cinema_tracker_reviews', JSON.stringify(existingReviews));
                    }
                    // Удаляем рейтинг из userRatings
                    delete userRatings[movie.id];
                    localStorage.setItem('userRatings', JSON.stringify(userRatings));
                    showNotification('Ваша оценка и отзыв удалены для этого фильма.', 'success');
                    modal.hide();
                    // Можно добавить обновление UI, если нужно
                });
            }
        }, 100);
    }
};

// Функция для получения описания рейтинга
function getRatingDescription(rating) {
    const descriptions = {
        0: '',
        1: 'Ужасно',
        2: 'Очень плохо',
        3: 'Плохо',
        4: 'Неудовлетворительно',
        5: 'Посредственно',
        6: 'Удовлетворительно',
        7: 'Хорошо',
        8: 'Очень хорошо',
        9: 'Отлично',
        10: 'Шедевр'
    };
    return descriptions[rating] || '';
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}