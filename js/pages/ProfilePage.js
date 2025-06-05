/**
 * Profile page component
 * Displays user profile information and statistics
 */
class ProfilePage {
	constructor() {
		this.userService = new UserService()
		this.movieService = new MovieService()
		this.reviewService = new ReviewService()
		this.currentUser = null
		this.charts = []
	}

	/**
	 * Render the profile page
	 */
	render() {
		const mainContent = document.getElementById('main-content')
		if (!mainContent) return

		this.currentUser = this.userService.getCurrentUser()

		if (!this.currentUser) {
			this.renderLoginRequired()
			return
		}

		mainContent.innerHTML = `
        <div class="profile-page">
            <div class="container">
                <div class="profile-actions">
                    
                    <!-- Затем кнопка добавления фильма -->
                    <button class="btn btn-primary" id="add-movie-btn">
                        <i class="fas fa-plus"></i> Добавить свой фильм
                    </button>
                </div>
                ${this.renderAddMovieModal()}
                ${this.renderProfileHeader()}
                ${this.renderProfileStats()}
                ${this.renderGenreChart()}
                ${this.renderRecentActivity()}
            </div>
        </div>
    `

		this.setupAddMovieModal()
		this.setupEventListeners()
		this.loadCharts()
	}

	// Удалите метод renderEditProfileForm и showEditProfileModal, а также все вызовы edit-profile-btn и обработчики, связанные с редактированием профиля.

	// Добавь этот метод в класс ProfilePage:
	setupAddMovieModal() {
		const addBtn = document.getElementById('add-movie-btn')
		const modal = document.getElementById('add-movie-modal')
		const closeBtn = document.getElementById('close-add-movie')
		const saveBtn = document.getElementById('save-movie-btn')

		if (addBtn && modal && closeBtn && saveBtn) {
			addBtn.onclick = () => {
				modal.style.display = 'block'
			}
			closeBtn.onclick = () => {
				modal.style.display = 'none'
			}
			window.onclick = e => {
				if (e.target === modal) modal.style.display = 'none'
			}

			saveBtn.onclick = () => {
				const title = document.getElementById('movie-title').value.trim()
				const year = parseInt(
					document.getElementById('movie-year').value.trim()
				)
				const genres = document
					.getElementById('movie-genres')
					.value.split(',')
					.map(g => g.trim())
					.filter(Boolean)
				const description = document
					.getElementById('movie-description')
					.value.trim()
				const posterUrl = document.getElementById('movie-poster').value.trim()

				if (!title || !year) {
					alert('Название и год обязательны!')
					return
				}

				// Создаём фильм
				const movie = new Movie(title, year, genres, description, posterUrl)

				// Сохраняем в localStorage через MovieService
				const movieService = new MovieService()
				movieService.addMovie(movie)

				// Закрываем модалку и обновляем страницу
				modal.style.display = 'none'
				location.reload()
			}
		}
	}

	/**
	 * Render login required message
	 */
	renderLoginRequired() {
		const mainContent = document.getElementById('main-content')
		mainContent.innerHTML = `
            <div class="login-required">
                <div class="container">
                    <div class="login-required-content">
                        <i class="fas fa-user-circle"></i>
                        <h2>Необходима авторизация</h2>
                        <p>Для просмотра профиля необходимо войти в систему</p>
                        <button class="btn btn-primary" id="login-from-profile">
                            <i class="fas fa-sign-in-alt"></i>
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        `

		// Setup login button
		setTimeout(() => {
			const loginBtn = document.getElementById('login-from-profile')
			if (loginBtn && window.headerInstance) {
				loginBtn.addEventListener('click', () => {
					window.headerInstance.handleLogin()
				})
			}
		}, 100)
	}

	/**
	 * Render profile header section
	 */
	renderProfileHeader() {
		const userStats = this.userService.getUserViewingStats(this.currentUser.id)

		return `
        <section class="profile-header">
            <div class="profile-info">
                <div class="profile-avatar-section">
                    <div class="profile-avatar">
                        ${this.currentUser.getInitials()}
                    </div>
                </div>
                <div class="profile-details">
                    <h1>${this.currentUser.getDisplayName()}</h1>
                    <p class="profile-email">${this.currentUser.email}</p>
                    <p class="profile-join-date">На сайте с ${this.currentUser.getFormattedJoinDate()}</p>
                    ${
											this.currentUser.bio
												? `
                        <div class="profile-bio">
                            <p>${this.currentUser.bio}</p>
                        </div>
                    `
												: ''
										}
                    ${
											this.currentUser.favoriteGenres.length > 0
												? `
                        <div class="profile-genres">
                            <h4>Любимые жанры:</h4>
                            <div class="genre-tags">
                                ${this.currentUser.favoriteGenres
																	.map(
																		genre =>
																			`<span class="genre-tag">${genre}</span>`
																	)
																	.join('')}
                            </div>
                        </div>
                    `
												: ''
										}
                </div>
            </div>
        </section>
    `
	}

	/**
	 * Render profile statistics
	 */
	renderProfileStats() {
		// Получаем отзывы пользователя из localStorage через Review.fromJSON
		const reviews = JSON.parse(
			localStorage.getItem('cinema_tracker_reviews') || '[]'
		)
			.map(r => Review.fromJSON(r))
			.filter(Boolean)
		// Получаем только существующие фильмы
		const movies = JSON.parse(
			localStorage.getItem('cinema_tracker_movies') || '[]'
		)
		const movieMap = {}
		movies.forEach(m => {
			movieMap[m.id] = m
		})
		// Фильтруем только отзывы на реально существующие фильмы
		const userReviews = reviews.filter(
			review =>
				review.userId === this.currentUser.id && movieMap[review.movieId]
		)
		// Вычисляем статистику
		const totalReviews = userReviews.length
		const averageRating =
			totalReviews > 0
				? (
						userReviews.reduce((sum, review) => sum + review.rating, 0) /
						totalReviews
				  ).toFixed(1)
				: '0.0'
		return `
            <section class="profile-stats">
                <h2>Статистика просмотров</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${totalReviews}</div>
                        <div class="stat-label">Оценено фильмов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${averageRating}</div>
                        <div class="stat-label">Средняя оценка</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${
													userReviews.filter(r => r.rating >= 8).length
												}</div>
                        <div class="stat-label">Высокие оценки (8+)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${
													userReviews.filter(
														r => r.comment && r.comment.length > 0
													).length
												}</div>
                        <div class="stat-label">С комментариями</div>
                    </div>
                </div>
            </section>
        `
	}

	/**
	 * Render genre statistics chart
	 */
	renderGenreChart() {
		// Получаем отзывы пользователя через Review.fromJSON
		const reviews = JSON.parse(
			localStorage.getItem('cinema_tracker_reviews') || '[]'
		)
			.map(r => Review.fromJSON(r))
			.filter(Boolean)
		const userReviews = reviews.filter(
			review => review.userId === this.currentUser.id
		)
		if (userReviews.length === 0) {
			return `
                <section class="chart-container">
                    <h3 class="chart-title">Статистика по жанрам</h3>
                    <div class="empty-chart">
                        <i class="fas fa-chart-pie"></i>
                        <p>Нет данных для отображения</p>
                        <p>Оставьте несколько рецензий, чтобы увидеть статистику по жанрам</p>
                    </div>
                </section>
            `
		}
		// Получаем актуальные фильмы из localStorage
		const movies = JSON.parse(
			localStorage.getItem('cinema_tracker_movies') || '[]'
		)
		const movieMap = {}
		movies.forEach(m => {
			movieMap[m.id] = m
		})
		// Подсчитываем статистику по жанрам только для существующих фильмов
		const genreStats = {}
		userReviews.forEach(review => {
			const movie = movieMap[review.movieId]
			if (movie && Array.isArray(movie.genres)) {
				movie.genres.forEach(genre => {
					genreStats[genre] = (genreStats[genre] || 0) + 1
				})
			}
		})
		// Сортируем жанры по количеству
		const sortedGenres = Object.entries(genreStats)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 6) // Берем топ-6 жанров

		if (sortedGenres.length === 0) {
			return `
                <section class="chart-container">
                    <h3 class="chart-title">Статистика по жанрам</h3>
                    <div class="empty-chart">
                        <i class="fas fa-chart-pie"></i>
                        <p>Нет данных для отображения</p>
                    </div>
                </section>
            `
		}

		return `
            <section class="chart-container">
                <h3 class="chart-title">Любимые жанры</h3>
                <div class="genre-stats">
                    ${sortedGenres
											.map(
												([genre, count]) => `
                        <div class="genre-stat-item">
                            <div class="genre-stat-info">
                                <span class="genre-name">${genre}</span>
                                <span class="genre-count">${count} фильм${
													count === 1 ? '' : count < 5 ? 'а' : 'ов'
												}</span>
                            </div>
                            <div class="genre-stat-bar">
                                <div class="genre-stat-fill" style="width: ${
																	(count /
																		Math.max(
																			...sortedGenres.map(([, c]) => c)
																		)) *
																	100
																}%"></div>
                            </div>
                        </div>
                    `
											)
											.join('')}
                </div>
            </section>
        `
	}

	/**
	 * Render recent activity section
	 */
	renderRecentActivity() {
		// Получаем отзывы пользователя из localStorage и фильтруем через Review.fromJSON
		let reviews = JSON.parse(
			localStorage.getItem('cinema_tracker_reviews') || '[]'
		)
			.map(r => Review.fromJSON(r))
			.filter(Boolean)
		// Фильтруем только те отзывы, у которых есть фильм в localStorage
		const movies = JSON.parse(
			localStorage.getItem('cinema_tracker_movies') || '[]'
		)
		const movieMap = {}
		movies.forEach(m => {
			movieMap[m.id] = m
		})
		reviews = reviews.filter(review => movieMap[review.movieId])
		const userReviews = reviews.filter(
			review => review.userId === this.currentUser.id
		)
		// Сортируем по дате создания (новые сначала) и берем последние 5
		const recentReviews = userReviews
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			.slice(0, 5)
		if (recentReviews.length === 0) {
			return `
                <section class="recent-activity">
                    <h3>Последняя активность</h3>
                    <div class="empty-activity">
                        <i class="fas fa-clock"></i>
                        <p>Пока нет оценок фильмов</p>
                        <p>Оцените несколько фильмов, чтобы увидеть активность здесь</p>
                    </div>
                </section>
            `
		}
		return `
            <section class="recent-activity">
                <h3>Последняя активность</h3>
                <div class="activity-list">
                    ${recentReviews
											.map(review => {
												const movie = movieMap[review.movieId]
												return `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-text">
                                    Оценил фильм 
                                    <strong>${
																			movie ? movie.title : 'Неизвестный фильм'
																		}</strong>
                                </div>
                                <div class="activity-meta">
                                    <span class="activity-rating">
                                        <i class="fas fa-star"></i>
                                        ${review.rating}/10
                                    </span>
                                    <span class="activity-date">${new Date(
																			review.createdAt
																		).toLocaleDateString('ru-RU')}</span>
                                </div>
                                ${
																	review.comment
																		? `
                                    <div class="activity-comment">
                                        "${review.comment}"
                                    </div>
                                `
																		: ''
																}
                            </div>
                        </div>
                        `
											})
											.join('')}
                </div>
            </section>
        `
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		const editProfileBtn = document.getElementById('edit-profile')
		if (editProfileBtn) {
			editProfileBtn.addEventListener('click', () =>
				this.showEditProfileModal()
			)
		}
	}

	/**
	 * Load charts
	 */
	loadCharts() {
		const canvas = document.getElementById('stats-chart')
		if (!canvas) return

		const userStats = this.userService.getUserViewingStats(this.currentUser.id)
		if (!userStats?.genrePreferences || userStats.genrePreferences.length === 0)
			return

		// Prepare chart data
		const chartData = userStats.genrePreferences.slice(0, 6).map(genre => ({
			label: genre.genre,
			value: genre.count,
		}))

		// Create chart
		const chart = ChartRenderer.createResponsiveChart(
			'stats-chart',
			'donut',
			chartData,
			{
				centerText: userStats.totalReviews.toString(),
				centerSubtext: 'Всего рецензий',
			}
		)

		if (chart) {
			this.charts.push(chart)
		}
	}

	/**
	 * Show edit profile modal
	 */

	/**
	 * Handle profile update
	 */
	handleProfileUpdate(event, modal) {
		event.preventDefault()

		const username = document.getElementById('edit-username').value.trim()
		const email = document.getElementById('edit-email').value.trim()
		const bio = document.getElementById('edit-bio').value.trim()

		// Get selected genres
		const genreCheckboxes = document.querySelectorAll(
			'.genre-checkboxes input[type="checkbox"]:checked'
		)
		const favoriteGenres = Array.from(genreCheckboxes).map(cb => cb.value)

		try {
			// Update user profile
			this.userService.updateUserProfile(this.currentUser.id, {
				username,
				email,
				bio,
				favoriteGenres,
			})

			// Update current user reference
			this.currentUser = this.userService.getCurrentUser()

			// Close modal and re-render page
			modal.hide()
			this.render()

			// Show success notification
			if (window.headerInstance) {
				window.headerInstance.showNotification(
					'Профиль успешно обновлен',
					'success'
				)
				window.headerInstance.render() // Update header with new username
			}
		} catch (error) {
			console.error('Error updating profile:', error)
			if (window.headerInstance) {
				window.headerInstance.showNotification(
					'Ошибка обновления профиля: ' + error.message,
					'error'
				)
			}
		}
	}

	/**
	 * Destroy page and cleanup
	 */
	destroy() {
		// Destroy charts
		this.charts.forEach(chart => {
			if (chart.destroy) {
				chart.destroy()
			}
		})
		this.charts = []
	}
	renderAddMovieModal() {
		return `
            <div id="add-movie-modal" class="modal" style="display:none;">
                <div class="modal-content" style="max-width:400px">
                    <span class="close" id="close-add-movie" style="cursor:pointer;float:right;font-size:24px;">&times;</span>
                    <h3 style="margin-top:0;">Добавить фильм</h3>
                    <input type="text" id="movie-title" class="form-input" placeholder="Название" required style="margin-bottom:8px;">
                    <input type="number" id="movie-year" class="form-input" placeholder="Год" required style="margin-bottom:8px;">
                    <input type="text" id="movie-genres" class="form-input" placeholder="Жанры (через запятую)" style="margin-bottom:8px;">
                    <textarea id="movie-description" class="form-textarea" placeholder="Описание" style="margin-bottom:8px;"></textarea>
                    <input type="text" id="movie-poster" class="form-input" placeholder="Ссылка на постер" style="margin-bottom:8px;">
                    <button class="btn btn-success" id="save-movie-btn">Сохранить</button>
                </div>
            </div>
        `
	}
}
document.addEventListener('DOMContentLoaded', () => {
	const addBtn = document.getElementById('add-movie-btn')
	const modal = document.getElementById('add-movie-modal')
	const closeBtn = document.getElementById('close-add-movie')
	const saveBtn = document.getElementById('save-movie-btn')

	if (addBtn && modal && closeBtn && saveBtn) {
		addBtn.onclick = () => {
			modal.style.display = 'block'
		}
		closeBtn.onclick = () => {
			modal.style.display = 'none'
		}
		window.onclick = e => {
			if (e.target === modal) modal.style.display = 'none'
		}

		saveBtn.onclick = () => {
			const title = document.getElementById('movie-title').value.trim()
			const year = parseInt(document.getElementById('movie-year').value.trim())
			const genres = document
				.getElementById('movie-genres')
				.value.split(',')
				.map(g => g.trim())
				.filter(Boolean)
			const description = document
				.getElementById('movie-description')
				.value.trim()
			const posterUrl = document.getElementById('movie-poster').value.trim()

			if (!title || !year) {
				alert('Название и год обязательны!')
				return
			}

			// Создаём фильм
			const movie = new Movie(title, year, genres, description, posterUrl)

			// Сохраняем в localStorage через MovieService
			const movieService = new MovieService()
			movieService.addMovie(movie)

			// Закрываем модалку и обновляем страницу
			modal.style.display = 'none'
			location.reload()
		}
	}
})
