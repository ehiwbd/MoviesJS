/**
 * TMDB API Service for fetching movie data and images
 * Handles integration with The Movie Database API
 */
class TMDBService {
    constructor() {
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    }

    /**
     * Get API key from environment
     */
    getApiKey() {
        // Use the provided API key
        return 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyYWZiYjAzMWE4MjU5YzEwZTI2OTc3MTY1NDViZTNkYyIsIm5iZiI6MTc0OTA2NDc4OC43ODQ5OTk4LCJzdWIiOiI2ODQwOWM1NDcwYmZkMmNiMzM1MzkyM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.apgxLl5GM08CgiJSDIVOKJWsMhOlviXXByQ9vfbNry0';
    }

    /**
     * Fetch popular movies from TMDB
     */
    async fetchPopularMovies(page = 1) {
        if (!this.apiKey) {
            console.warn('TMDB API key not found');
            return this.getFallbackMovies();
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/movie/popular?language=ru&page=${page}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                console.error('TMDB API error:', response.status, response.statusText);
                return this.getFallbackMovies();
            }
            
            const data = await response.json();
            console.log('TMDB API response:', data);
            return this.transformTMDBMovies(data.results);
        } catch (error) {
            console.error('Error fetching from TMDB:', error);
            return this.getFallbackMovies();
        }
    }

    /**
     * Transform TMDB movie data to our Movie format
     */
    transformTMDBMovies(tmdbMovies) {
        return tmdbMovies.map(movie => {
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 2024;
            const posterUrl = movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : this.getPlaceholderImage();
            
            return new Movie(
                movie.title || movie.original_title,
                releaseYear,
                this.getGenresFromIds(movie.genre_ids || []),
                movie.overview || 'Описание будет добавлено позже.',
                posterUrl,
                `tmdb_${movie.id}`
            );
        });
    }

    /**
     * Get genre names from TMDB genre IDs
     */
    getGenresFromIds(genreIds) {
        const genreMap = {
            28: 'Боевик',
            12: 'Приключения',
            16: 'Анимация',
            35: 'Комедия',
            80: 'Криминал',
            99: 'Документальный',
            18: 'Драма',
            10751: 'Семейный',
            14: 'Фэнтези',
            36: 'История',
            27: 'Ужасы',
            10402: 'Музыка',
            9648: 'Детектив',
            10749: 'Романтика',
            878: 'Фантастика',
            10770: 'Телефильм',
            53: 'Триллер',
            10752: 'Военный',
            37: 'Вестерн'
        };

        return genreIds.map(id => genreMap[id] || 'Драма').slice(0, 3);
    }

    /**
     * Get placeholder image for movies without posters
     */
    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMTUgMTgwSDE4NVYyNDBIMTE1VjE4MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+CjxwYXRoIGQ9Ik0xMzUgMjEwSDE2NVYyMjBIMTM1VjIxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+Cjx0ZXh0IHg9IjE1MCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3Mjg4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPtCk0LjQu9GM0LwgPC90ZXh0Pgo8L3N2Zz4K';
    }

    /**
     * Get fallback movies when TMDB is not available
     */
    getFallbackMovies() {
        return [
            new Movie(
                'Побег из Шоушенка',
                1994,
                ['Драма'],
                'История о дружбе, надежде и стойкости человеческого духа в стенах тюрьмы.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Крестный отец',
                1972,
                ['Драма', 'Криминал'],
                'Эпическая сага о семье, власти и предательстве в мире мафии.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Темный рыцарь',
                2008,
                ['Боевик', 'Криминал', 'Драма'],
                'Бэтмен сталкивается с хаосом, который несет Джокер в Готэм-сити.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Криминальное чтиво',
                1994,
                ['Криминал', 'Драма'],
                'Переплетающиеся истории преступного мира Лос-Анджелеса.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Форрест Гамп',
                1994,
                ['Драма', 'Романтика'],
                'История простого человека, ставшего свидетелем важных событий американской истории.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Начало',
                2010,
                ['Фантастика', 'Боевик', 'Триллер'],
                'Вор, проникающий в сны людей, получает задание обратного характера.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Матрица',
                1999,
                ['Фантастика', 'Боевик'],
                'Программист обнаруживает, что реальность - это симуляция.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Властелин колец: Возвращение короля',
                2003,
                ['Фэнтези', 'Приключения'],
                'Финальная битва за Средиземье и судьба Кольца Всевластия.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Бойцовский клуб',
                1999,
                ['Драма'],
                'Офисный работник создает подпольный бойцовский клуб.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Интерстеллар',
                2014,
                ['Фантастика', 'Драма'],
                'Команда исследователей путешествует через червоточину в поисках нового дома для человечества.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Гладиатор',
                2000,
                ['Боевик', 'Драма'],
                'Римский полководец становится гладиатором, чтобы отомстить за смерть семьи.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Титаник',
                1997,
                ['Романтика', 'Драма'],
                'История любви на борту обреченного корабля.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Зеленая миля',
                1999,
                ['Драма', 'Фэнтези'],
                'Охранник тюрьмы встречает заключенного с необычными способностями.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Список Шиндлера',
                1993,
                ['Драма', 'История'],
                'Немецкий бизнесмен спасает жизни евреев во время Холокоста.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Авиатор',
                2004,
                ['Драма', 'Биография'],
                'Биография легендарного авиатора и режиссера Говарда Хьюза.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Касабланка',
                1942,
                ['Драма', 'Романтика'],
                'Классическая история любви во время Второй мировой войны.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Психо',
                1960,
                ['Ужасы', 'Триллер'],
                'Молодая женщина останавливается в зловещем мотеле.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Звездные войны: Новая надежда',
                1977,
                ['Фантастика', 'Приключения'],
                'Молодой фермер присоединяется к восстанию против Галактической империи.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Назад в будущее',
                1985,
                ['Фантастика', 'Комедия'],
                'Подросток случайно отправляется в прошлое и должен исправить ход истории.',
                this.getPlaceholderImage()
            ),
            new Movie(
                'Челюсти',
                1975,
                ['Триллер', 'Ужасы'],
                'Гигантская акула терроризирует курортный городок.',
                this.getPlaceholderImage()
            )
        ];
    }
}