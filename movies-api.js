const TMDB_API_KEY = '809228965824f1146747970a24f92328';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

let currentMovieId = null;
let heroMovie = null;

const SERVERS = [
    (id) => `https://vidsrc.to/embed/movie/${id}`,
    (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    (id) => `https://www.2embed.cc/embed/${id}`,
    (id) => `https://embed.su/embed/movie/${id}`,
    (id) => `https://autoembed.to/movie/tmdb/${id}`,
    (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    (id) => `https://player.vdocipher.com/v2/?otp=test&playbackInfo=test&tmdb=${id}`
];

async function fetchMovies(endpoint, containerId) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=ar&region=SA`);
        const data = await response.json();
        const movies = data.results;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        movies.forEach(movie => {
            if (!movie.poster_path) return;
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" loading="lazy">
                <div class="movie-card-info">
                    <h4 style="font-size: 14px; margin-bottom: 5px;">${movie.title}</h4>
                    <p style="font-size: 12px; color: #FFD700;">⭐ ${movie.vote_average.toFixed(1)}</p>
                </div>
            `;
            card.onclick = () => openPlayer(movie);
            container.appendChild(card);
        });

        if (containerId === 'trending-movies' && movies.length > 0) {
            setHeroMovie(movies[0]);
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

function setHeroMovie(movie) {
    heroMovie = movie;
    const hero = document.getElementById('hero');
    if (hero) {
        hero.style.backgroundImage = `url(${IMAGE_BASE_URL}${movie.backdrop_path})`;
        document.getElementById('hero-title').textContent = movie.title;
        document.getElementById('hero-overview').textContent = movie.overview || 'استمتع بمشاهدة هذا الفيلم الحصري والمترجم بجودة عالية على منصتنا.';
    }
}

function playHeroMovie() {
    if (heroMovie) openPlayer(heroMovie);
}

function openPlayer(movie) {
    currentMovieId = movie.id;
    const modal = document.getElementById('player-modal');
    modal.style.display = 'block';
    document.getElementById('player-title').textContent = movie.title;
    document.getElementById('player-overview').textContent = movie.overview || 'لا يوجد وصف متاح حالياً لهذا الفيلم.';
    switchServer(0);
    document.body.style.overflow = 'hidden';
}

function closePlayer() {
    document.getElementById('player-modal').style.display = 'none';
    document.getElementById('video-iframe').src = '';
    document.body.style.overflow = 'auto';
}

function switchServer(index) {
    const tabs = document.querySelectorAll('.server-tab');
    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    const iframe = document.getElementById('video-iframe');
    iframe.src = SERVERS[index](currentMovieId);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies('/trending/movie/week', 'trending-movies');
    fetchMovies('/movie/popular', 'action-movies');
    fetchMovies('/movie/top_rated', 'horror-movies');
});
