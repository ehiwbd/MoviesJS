/**
 * Home page component
 * Displays featured movie, movie grid, search results, and filtering options
 */
class HomePage {
	constructor() {
		this.movieService = new MovieService()
		this.storageService = new StorageService()
		this.currentFilters = {
			search: '',
			genre: 'all',
			sortBy: 'rating',
			year: 'all',
		}
		this.displayedMovies = []
	}

	/**
	 * Render the home page
	 */
	render() {
		const mainContent = document.getElementById('main-content')
		if (!mainContent) return

		// Get URL parameters for initial state
		this.parseUrlParams()

		mainContent.innerHTML = `
            <div class="home-page">
                ${this.renderHeroSection()}
                ${this.renderMoviesSection()}
            </div>
        `

		this.setupEventListeners()
		this.loadMovies()
	}

	/**
	 * Parse URL parameters for search and filters
	 */
	parseUrlParams() {
		const urlParams = new URLSearchParams(window.location.search)

		if (urlParams.has('search')) {
			this.currentFilters.search = urlParams.get('search')
		}
		if (urlParams.has('genre')) {
			this.currentFilters.genre = urlParams.get('genre')
		}
		if (urlParams.has('sort')) {
			this.currentFilters.sortBy = urlParams.get('sort')
		}
		if (urlParams.has('year')) {
			this.currentFilters.year = urlParams.get('year')
		}
	}

	/**
	 * Render hero section with featured movie
	 */
	renderHeroSection() {
		if (this.currentFilters.search) {
			return `
                <section class="search-results-hero">
                    <div class="container">
                        <h1>Результаты поиска: "${this.currentFilters.search}"</h1>
                        <p>Найдено фильмов по вашему запросу</p>
                    </div>
                </section>
            `
		}

		return `
            <section class="hero" id="hero-section">
                <div class="hero-background" id="hero-background"></div>
                <div class="container">
                    <div class="hero-content" id="hero-content">
                        <!-- Featured movie content will be inserted here -->
                    </div>
                </div>
            </section>
        `
	}

	/**
	 * Render movies section with filters and grid
	 */
	renderMoviesSection() {
		return `
            <section class="section">
                <div class="container">
                    <div class="section-header">
                        <h2 class="section-title">
                            ${
															this.currentFilters.search
																? 'Результаты поиска'
																: 'Все фильмы'
														}
                        </h2>
                        
                        <div class="filter-controls">
                            ${this.renderFilterControls()}
                        </div>
                    </div>
                    
                    <div class="movies-container">
                        <div class="movie-grid" id="movie-grid">
                            <!-- Movies will be loaded here -->
                        </div>
                        
                        <div class="load-more-container" id="load-more-container">
                            <!-- Load more button will appear here if needed -->
                        </div>
                    </div>
                </div>
            </section>
        `
	}

	/**
	 * Render filter controls
	 */
	renderFilterControls() {
		const genres = this.movieService.getAllGenres()
		const years = this.movieService.getAllYears()

		return `
            <div class="filters-row">
                <select id="genre-filter" class="filter-select">
                    <option value="all" ${
											this.currentFilters.genre === 'all' ? 'selected' : ''
										}>Все жанры</option>
                    ${genres
											.map(
												genre =>
													`<option value="${genre}" ${
														this.currentFilters.genre === genre
															? 'selected'
															: ''
													}>${genre}</option>`
											)
											.join('')}
                </select>
                
                <select id="year-filter" class="filter-select">
                    <option value="all" ${
											this.currentFilters.year === 'all' ? 'selected' : ''
										}>Все года</option>
                    ${years
											.map(
												year =>
													`<option value="${year}" ${
														this.currentFilters.year === year ? 'selected' : ''
													}>${year}</option>`
											)
											.join('')}
                </select>
                
                <select id="sort-filter" class="filter-select">
                    <option value="rating" ${
											this.currentFilters.sortBy === 'rating' ? 'selected' : ''
										}>По рейтингу</option>
                    <option value="year" ${
											this.currentFilters.sortBy === 'year' ? 'selected' : ''
										}>По году</option>
                    <option value="title" ${
											this.currentFilters.sortBy === 'title' ? 'selected' : ''
										}>По названию</option>
                    <option value="reviews" ${
											this.currentFilters.sortBy === 'reviews' ? 'selected' : ''
										}>По количеству отзывов</option>
                    <option value="newest" ${
											this.currentFilters.sortBy === 'newest' ? 'selected' : ''
										}>Недавно добавленные</option>
                </select>
                
                ${
									this.currentFilters.search ||
									this.currentFilters.genre !== 'all' ||
									this.currentFilters.year !== 'all'
										? `
                    <button class="btn btn-secondary" id="clear-filters">
                        <i class="fas fa-times"></i>
                        Очистить фильтры
                    </button>
                `
										: ''
								}
            </div>
        `
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		// Filter controls
		const genreFilter = document.getElementById('genre-filter')
		const yearFilter = document.getElementById('year-filter')
		const sortFilter = document.getElementById('sort-filter')
		const clearFilters = document.getElementById('clear-filters')

		if (genreFilter) {
			genreFilter.addEventListener('change', e => {
				this.currentFilters.genre = e.target.value
				this.updateFilters()
			})
		}

		if (yearFilter) {
			yearFilter.addEventListener('change', e => {
				this.currentFilters.year =
					e.target.value === 'all' ? 'all' : parseInt(e.target.value)
				this.updateFilters()
			})
		}

		if (sortFilter) {
			sortFilter.addEventListener('change', e => {
				this.currentFilters.sortBy = e.target.value
				this.updateFilters()
			})
		}

		if (clearFilters) {
			clearFilters.addEventListener('click', () => {
				this.clearAllFilters()
			})
		}

		// Search input from header
		const searchInput = document.getElementById('search-input')
		if (searchInput && this.currentFilters.search) {
			searchInput.value = this.currentFilters.search
		}
	}

	/**
	 * Load and display movies
	 */
	loadMovies() {
		try {
			// Получаем все фильмы
			let movies = this.movieService.getAllMovies()

			// Фильтрация по жанру
			if (this.currentFilters.genre && this.currentFilters.genre !== 'all') {
				movies = movies.filter(
					movie =>
						Array.isArray(movie.genres) &&
						movie.genres.includes(this.currentFilters.genre)
				)
			}

			// Фильтрация по году
			if (this.currentFilters.year && this.currentFilters.year !== 'all') {
				movies = movies.filter(
					movie => movie.year === parseInt(this.currentFilters.year)
				)
			}

			// Фильтрация по поиску
			if (this.currentFilters.search) {
				const searchTerm = this.currentFilters.search.toLowerCase()
				movies = movies.filter(
					movie =>
						movie.title.toLowerCase().includes(searchTerm) ||
						(movie.description &&
							movie.description.toLowerCase().includes(searchTerm))
				)
			}

			// Сортировка
			movies = this.movieService.sortMovies(movies, this.currentFilters.sortBy)

			this.displayedMovies = movies
			this.displayMovies()
			if (!this.currentFilters.search) {
				this.loadFeaturedMovie()
			}
		} catch (error) {
			this.showErrorState('Ошибка загрузки фильмов')
		}
	}

	/**
	 * Load and display featured movie
	 */
	loadFeaturedMovie() {
		const featuredMovie = this.movieService.getFeaturedMovie()
		if (!featuredMovie) return

		const heroContent = document.getElementById('hero-content')
		const heroBackground = document.getElementById('hero-background')

		if (heroContent) {
			MovieCard.createFeaturedCard(featuredMovie, heroContent)
		}

		if (heroBackground && featuredMovie.posterUrl) {
			heroBackground.style.backgroundImage = `url(${featuredMovie.posterUrl})`
		}
	}

	/**
	 * Display movies in grid
	 */
	displayMovies() {
		const movieGrid = document.getElementById('movie-grid')
		if (!movieGrid) return

		if (!this.displayedMovies || this.displayedMovies.length === 0) {
			movieGrid.innerHTML = this.renderEmptyState()
			this.updateResultsCount()
			return
		}

		movieGrid.innerHTML = this.displayedMovies
			.map(
				(movie, idx) => `
        <div class="movie-card" data-movie-id="${
					movie.id || idx
				}" onclick="window.openMovieModal('${movie.id || idx}')">
            <div class="movie-poster">
                <img src="${movie.posterUrl}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-year">${movie.year}</div>
                <div class="movie-rating">${
									movie.rating ? `★ ${movie.rating}` : ''
								}</div>
                <div class="movie-genres">${
									Array.isArray(movie.genres)
										? movie.genres.join(', ')
										: movie.genres
								}</div>
            </div>
        </div>
    `
			)
			.join('')

		this.updateResultsCount()
	}

	/**
	 * Render empty state
	 */
	renderEmptyState() {
		let message = 'Фильмы не найдены'
		let description = 'Попробуйте изменить параметры поиска или фильтрации'

		if (this.currentFilters.search) {
			message = `Нет результатов по запросу "${this.currentFilters.search}"`
			description = 'Попробуйте использовать другие ключевые слова'
		} else if (
			this.currentFilters.genre !== 'all' ||
			this.currentFilters.year !== 'all'
		) {
			message = 'Нет фильмов с выбранными фильтрами'
			description = 'Попробуйте расширить критерии поиска'
		}

		return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-film"></i>
                </div>
                <h3 class="empty-state-title">${message}</h3>
                <p class="empty-state-description">${description}</p>
                ${
									this.currentFilters.search ||
									this.currentFilters.genre !== 'all' ||
									this.currentFilters.year !== 'all'
										? `
                    <button class="btn btn-primary" onclick="window.homePage.clearAllFilters()">
                        <i class="fas fa-refresh"></i>
                        Сбросить фильтры
                    </button>
                `
										: ''
								}
            </div>
        `
	}

	/**
	 * Show error state
	 */
	showErrorState(message) {
		const movieGrid = document.getElementById('movie-grid')
		if (!movieGrid) return

		movieGrid.innerHTML = `
            <div class="error-state">
                <div class="error-state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="error-state-title">Произошла ошибка</h3>
                <p class="error-state-description">${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                    Обновить страницу
                </button>
            </div>
        `
	}

	/**
	 * Update filters and reload movies
	 */
	updateFilters() {
		this.loadMovies()
		this.updateFilterControls()
	}

	/**
	 * Update filter controls to reflect current state
	 */
	updateFilterControls() {
		const sectionHeader = document.querySelector('.section-header')
		if (sectionHeader) {
			const filterControls = sectionHeader.querySelector('.filter-controls')
			if (filterControls) {
				filterControls.innerHTML = this.renderFilterControls()
				this.setupEventListeners()
			}
		}
	}

	/**
	 * Clear all filters
	 */
	clearAllFilters() {
		this.currentFilters = {
			search: '',
			genre: 'all',
			sortBy: 'rating',
			year: 'all',
		}

		// Clear search input
		const searchInput = document.getElementById('search-input')
		if (searchInput) {
			searchInput.value = ''
		}

		this.updateFilters()

		// Update URL
		window.history.pushState({}, '', window.location.pathname)
	}

	/**
	 * Update results count
	 */
	updateResultsCount() {
		const sectionTitle = document.querySelector('.section-title')
		if (sectionTitle) {
			const count = this.displayedMovies.length
			const baseTitle = this.currentFilters.search
				? 'Результаты поиска'
				: 'Все фильмы'
			sectionTitle.textContent = `${baseTitle} (${count})`
		}
	}

	/**
	 * Update URL with current filters
	 */
	updateUrl() {
		const params = new URLSearchParams()

		if (this.currentFilters.search) {
			params.set('search', this.currentFilters.search)
		}
		if (this.currentFilters.genre !== 'all') {
			params.set('genre', this.currentFilters.genre)
		}
		if (this.currentFilters.sortBy !== 'rating') {
			params.set('sort', this.currentFilters.sortBy)
		}
		if (this.currentFilters.year !== 'all') {
			params.set('year', this.currentFilters.year)
		}

		const url = params.toString()
			? `${window.location.pathname}?${params.toString()}`
			: window.location.pathname
		window.history.replaceState({}, '', url)
	}

	/**
	 * Handle search from header
	 */
	handleSearch(query) {
		this.currentFilters.search = query
		this.updateFilters()
	}

	/**
	 * Render search results (called from header)
	 */
	renderSearchResults(results, query) {
		this.currentFilters.search = query
		this.displayedMovies = results

		// Update the page content
		const heroSection = document.getElementById('hero-section')
		const sectionTitle = document.querySelector('.section-title')

		if (heroSection) {
			heroSection.innerHTML = `
                <div class="container">
                    <div class="search-results-hero">
                        <h1>Результаты поиска: "${query}"</h1>
                        <p>Найдено фильмов: ${results.length}</p>
                    </div>
                </div>
            `
		}

		if (sectionTitle) {
			sectionTitle.textContent = `Результаты поиска (${results.length})`
		}

		this.displayMovies()
		this.updateUrl()
	}

	/**
	 * Get recommendations for current user
	 */
	loadRecommendations() {
		const userService = new UserService()
		const currentUser = userService.getCurrentUser()

		if (!currentUser) return []

		return this.movieService.getRecommendations(currentUser.id, 8)
	}

	/**
	 * Show recommendations section
	 */
	showRecommendations() {
		const recommendations = this.loadRecommendations()
		if (recommendations.length === 0) return

		const container = document.querySelector('.movies-container')
		if (!container) return

		const recommendationsSection = document.createElement('div')
		recommendationsSection.className = 'recommendations-section'
		recommendationsSection.innerHTML = `
            <div class="section-header">
                <h3 class="section-title">Рекомендации для вас</h3>
            </div>
            <div class="movie-grid recommendations-grid" id="recommendations-grid"></div>
        `

		container.insertBefore(recommendationsSection, container.firstChild)

		// Create recommendations grid
		const recommendationsGrid = document.getElementById('recommendations-grid')
		MovieCard.createMovieGrid(recommendations, recommendationsGrid, {
			showActions: true,
			showRating: true,
			showGenres: false,
		})
	}

	/**
	 * Refresh page data
	 */
	refresh() {
		this.loadMovies()
	}

	/**
	 * Destroy page and cleanup
	 */
	destroy() {
		// Clean up any event listeners or timers if needed
	}
}

// Make home page instance globally available
window.homePage = new HomePage()
