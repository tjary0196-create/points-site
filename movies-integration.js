/**
 * تكامل نظام الأفلام الكامل
 * يربط مشغل الفيديو مع نظام الرصيد والاشتراكات
 */

class MoviesIntegration {
  constructor() {
    this.currentPlayer = null;
    this.currentMovie = null;
    this.init();
  }

  init() {
    this.setupMovieCards();
    this.setupMovieModal();
    this.loadMoviesFromStorage();
  }

  setupMovieCards() {
    // إضافة مستمع لكل بطاقة فيلم
    document.addEventListener('click', (e) => {
      if (e.target.closest('.movie-card')) {
        const movieCard = e.target.closest('.movie-card');
        const movieId = movieCard.dataset.movieId;
        this.openMoviePlayer(movieId);
      }
    });
  }

  setupMovieModal() {
    const modal = document.createElement('div');
    modal.id = 'movie-player-modal';
    modal.className = 'movie-player-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-container">
        <button class="close-modal-btn">×</button>
        <div class="player-wrapper">
          <div id="video-player-container"></div>
        </div>
        <div class="movie-info-panel">
          <div class="movie-details">
            <h2 id="movie-title"></h2>
            <p id="movie-description"></p>
            <div class="movie-meta">
              <span id="movie-year"></span>
              <span id="movie-genre"></span>
              <span id="movie-rating"></span>
              <span id="movie-duration"></span>
            </div>
            <div class="movie-actions">
              <button class="btn btn-primary" id="play-btn">▶ تشغيل</button>
              <button class="btn btn-secondary" id="add-to-favorites">♡ إضافة للمفضلة</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // مستمعي الأحداث
    modal.querySelector('.close-modal-btn').addEventListener('click', () => this.closeMoviePlayer());
    modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeMoviePlayer());
    modal.querySelector('#play-btn').addEventListener('click', () => this.playMovie());
    modal.querySelector('#add-to-favorites').addEventListener('click', () => this.addToFavorites());
  }

  openMoviePlayer(movieId) {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    this.currentMovie = movies.find(m => m.id === movieId);

    if (!this.currentMovie) {
      console.error('فيلم غير موجود');
      return;
    }

    // التحقق من الرصيد
    if (!creditSystem.hasEnoughCredits(this.currentMovie.movieType)) {
      creditSystem.showInsufficientCreditsNotification(
        creditSystem.getMovieCost(this.currentMovie.movieType) - creditSystem.userCredits
      );
      return;
    }

    // تحديث معلومات الفيلم
    this.modal.querySelector('#movie-title').textContent = this.currentMovie.title;
    this.modal.querySelector('#movie-description').textContent = this.currentMovie.description;
    this.modal.querySelector('#movie-year').textContent = this.currentMovie.year;
    this.modal.querySelector('#movie-genre').textContent = this.currentMovie.genre;
    this.modal.querySelector('#movie-rating').textContent = `⭐ ${this.currentMovie.rating}`;
    this.modal.querySelector('#movie-duration').textContent = `${this.currentMovie.duration} دقيقة`;

    // إنشاء مشغل الفيديو
    this.createVideoPlayer();

    // إظهار النافذة
    this.modal.style.display = 'flex';
  }

  createVideoPlayer() {
    const container = this.modal.querySelector('#video-player-container');
    container.innerHTML = '';

    this.currentPlayer = new AdvancedVideoPlayer('video-player-container', {
      autoplay: false,
      controls: true,
      quality: 'auto'
    });

    this.currentPlayer.loadVideo(this.currentMovie.videoUrl, this.currentMovie.title);
  }

  playMovie() {
    if (!this.currentPlayer) return;

    // خصم الرصيد
    const deducted = creditSystem.deductCreditsForMovie(
      this.currentMovie.id,
      this.currentMovie.movieType
    );

    if (deducted) {
      this.currentPlayer.togglePlay();
      
      // تسجيل المشاهدة
      this.recordMovieView(this.currentMovie.id);
    }
  }

  closeMoviePlayer() {
    if (this.currentPlayer) {
      this.currentPlayer.destroy();
      this.currentPlayer = null;
    }
    this.modal.style.display = 'none';
  }

  addToFavorites() {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (!favorites.includes(this.currentMovie.id)) {
      favorites.push(this.currentMovie.id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      creditSystem.showSmoothNotification('تمت إضافة الفيلم للمفضلة', 'success');
      this.modal.querySelector('#add-to-favorites').textContent = '❤ مضاف للمفضلة';
    } else {
      favorites = favorites.filter(id => id !== this.currentMovie.id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      creditSystem.showSmoothNotification('تم إزالة الفيلم من المفضلة', 'info');
      this.modal.querySelector('#add-to-favorites').textContent = '♡ إضافة للمفضلة';
    }
  }

  recordMovieView(movieId) {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    const movie = movies.find(m => m.id === movieId);
    
    if (movie) {
      movie.views = (movie.views || 0) + 1;
      localStorage.setItem('movies', JSON.stringify(movies));
    }

    // تسجيل في سجل المشاهدات
    let viewHistory = JSON.parse(localStorage.getItem('viewHistory') || '[]');
    viewHistory.unshift({
      movieId: movieId,
      movieTitle: this.currentMovie.title,
      watchedAt: new Date().toISOString(),
      duration: this.currentMovie.duration
    });
    viewHistory = viewHistory.slice(0, 100);
    localStorage.setItem('viewHistory', JSON.stringify(viewHistory));
  }

  loadMoviesFromStorage() {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    
    if (movies.length === 0) {
      // إضافة أفلام تجريبية
      this.addSampleMovies();
    }
  }

  addSampleMovies() {
    const sampleMovies = [
      {
        id: 'movie_1',
        title: 'الرحلة الأخيرة',
        description: 'فيلم درامي يحكي قصة رحلة استثنائية تغير حياة البطل للأبد.',
        year: 2023,
        genre: 'دراما',
        rating: 8.5,
        duration: 120,
        movieType: 'standard',
        videoUrl: 'https://example.com/movie1.mp4',
        posterUrl: 'https://via.placeholder.com/300x450?text=الرحلة+الأخيرة',
        views: 0
      },
      {
        id: 'movie_2',
        title: 'المغامرة الكبرى',
        description: 'فيلم أكشن مثير يأخذك في رحلة مليئة بالمفاجآت والإثارة.',
        year: 2023,
        genre: 'أكشن',
        rating: 7.8,
        duration: 135,
        movieType: 'premium',
        videoUrl: 'https://example.com/movie2.mp4',
        posterUrl: 'https://via.placeholder.com/300x450?text=المغامرة+الكبرى',
        views: 0
      },
      {
        id: 'movie_3',
        title: 'الحب والأمل',
        description: 'فيلم رومانسي يروي قصة حب جميلة بين شخصين من عالمين مختلفين.',
        year: 2023,
        genre: 'رومانسي',
        rating: 8.2,
        duration: 110,
        movieType: 'standard',
        videoUrl: 'https://example.com/movie3.mp4',
        posterUrl: 'https://via.placeholder.com/300x450?text=الحب+والأمل',
        views: 0
      }
    ];

    localStorage.setItem('movies', JSON.stringify(sampleMovies));
  }

  /**
   * البحث والتصفية المتقدمة
   */
  searchMovies(query) {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    return movies.filter(movie =>
      movie.title.includes(query) ||
      movie.description.includes(query) ||
      movie.genre.includes(query)
    );
  }

  filterMovies(filters) {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    
    return movies.filter(movie => {
      if (filters.genre && movie.genre !== filters.genre) return false;
      if (filters.year && movie.year !== filters.year) return false;
      if (filters.minRating && movie.rating < filters.minRating) return false;
      if (filters.maxRating && movie.rating > filters.maxRating) return false;
      if (filters.movieType && movie.movieType !== filters.movieType) return false;
      return true;
    });
  }

  /**
   * الحصول على الأفلام الموصى بها
   */
  getRecommendedMovies() {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    return movies
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }

  /**
   * الحصول على الأفلام الأكثر مشاهدة
   */
  getTrendingMovies() {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    return movies
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }

  /**
   * الحصول على سجل المشاهدات
   */
  getWatchHistory() {
    return JSON.parse(localStorage.getItem('viewHistory') || '[]');
  }

  /**
   * الحصول على المفضلة
   */
  getFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    return movies.filter(m => favorites.includes(m.id));
  }
}

// إنشاء نسخة عامة من التكامل
const moviesIntegration = new MoviesIntegration();
