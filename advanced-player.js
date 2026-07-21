/**
 * مشغل فيديو متقدم مع معالجة أخطاء شاملة
 * يدعم HLS والروابط المباشرة مع تحكم كامل
 */

class AdvancedVideoPlayer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      autoplay: false,
      controls: true,
      quality: 'auto',
      ...options
    };
    
    this.state = {
      isPlaying: false,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isFullscreen: false,
      quality: this.options.quality,
      error: null
    };
    
    this.init();
  }

  init() {
    this.createPlayerHTML();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  createPlayerHTML() {
    this.container.innerHTML = `
      <div class="advanced-player">
        <div class="player-video-container">
          <video class="player-video" ${this.options.autoplay ? 'autoplay' : ''} muted></video>
          <div class="player-loading">
            <div class="spinner"></div>
            <p>جاري تحميل الفيديو...</p>
          </div>
          <div class="player-error" style="display: none;">
            <div class="error-icon">⚠️</div>
            <p class="error-message"></p>
            <button class="retry-btn">إعادة محاولة</button>
          </div>
        </div>

        <div class="player-controls">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
              <div class="progress-handle"></div>
            </div>
            <div class="time-display">
              <span class="current-time">00:00</span>
              <span class="separator">/</span>
              <span class="duration">00:00</span>
            </div>
          </div>

          <div class="controls-row">
            <div class="left-controls">
              <button class="control-btn play-btn" title="تشغيل/إيقاف">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              
              <div class="volume-control">
                <button class="control-btn volume-btn" title="كتم الصوت">
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
                <input type="range" class="volume-slider" min="0" max="100" value="100">
              </div>

              <span class="movie-title"></span>
            </div>

            <div class="right-controls">
              <select class="quality-selector" style="display: none;">
                <option value="auto">جودة تلقائية</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
              </select>

              <button class="control-btn fullscreen-btn" title="ملء الشاشة">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.video = this.container.querySelector('.player-video');
    this.playBtn = this.container.querySelector('.play-btn');
    this.volumeBtn = this.container.querySelector('.volume-btn');
    this.volumeSlider = this.container.querySelector('.volume-slider');
    this.fullscreenBtn = this.container.querySelector('.fullscreen-btn');
    this.progressBar = this.container.querySelector('.progress-bar');
    this.progressFill = this.container.querySelector('.progress-fill');
    this.progressHandle = this.container.querySelector('.progress-handle');
    this.currentTimeDisplay = this.container.querySelector('.current-time');
    this.durationDisplay = this.container.querySelector('.duration');
    this.movieTitle = this.container.querySelector('.movie-title');
    this.loadingIndicator = this.container.querySelector('.player-loading');
    this.errorContainer = this.container.querySelector('.player-error');
    this.errorMessage = this.container.querySelector('.error-message');
    this.retryBtn = this.container.querySelector('.retry-btn');
    this.qualitySelector = this.container.querySelector('.quality-selector');
    this.controlsRow = this.container.querySelector('.controls-row');
  }

  setupEventListeners() {
    // تشغيل/إيقاف
    this.playBtn.addEventListener('click', () => this.togglePlay());
    
    // الصوت
    this.volumeBtn.addEventListener('click', () => this.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    
    // ملء الشاشة
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // التقدم
    this.progressBar.addEventListener('click', (e) => this.seek(e));
    this.progressHandle.addEventListener('mousedown', () => this.startDragging());
    
    // فيديو
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.video.addEventListener('error', () => this.onVideoError());
    this.video.addEventListener('ended', () => this.onVideoEnded());
    
    // إعادة محاولة
    this.retryBtn.addEventListener('click', () => this.retry());
    
    // إخفاء التحكم عند الخمول
    this.container.addEventListener('mousemove', () => this.showControls());
    this.container.addEventListener('mouseleave', () => this.hideControls());
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target === this.video || this.container.contains(e.target)) {
        switch(e.code) {
          case 'Space':
            e.preventDefault();
            this.togglePlay();
            break;
          case 'KeyF':
            this.toggleFullscreen();
            break;
          case 'KeyM':
            this.toggleMute();
            break;
          case 'ArrowRight':
            this.video.currentTime += 5;
            break;
          case 'ArrowLeft':
            this.video.currentTime -= 5;
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.setVolume(Math.min(this.state.volume + 0.1, 1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.setVolume(Math.max(this.state.volume - 0.1, 0));
            break;
        }
      }
    });
  }

  loadVideo(url, title = '') {
    this.showLoading();
    this.hideError();
    this.movieTitle.textContent = title;
    
    this.video.src = url;
    this.video.load();
  }

  togglePlay() {
    if (this.state.error) return;
    
    if (this.state.isPlaying) {
      this.video.pause();
    } else {
      this.video.play().catch(err => {
        this.showError('فشل تشغيل الفيديو: ' + err.message);
      });
    }
  }

  toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    this.video.muted = this.state.isMuted;
    this.updateVolumeUI();
  }

  setVolume(volume) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.video.volume = this.state.volume;
    if (this.state.volume > 0) {
      this.state.isMuted = false;
      this.video.muted = false;
    }
    this.volumeSlider.value = this.state.volume * 100;
    this.updateVolumeUI();
  }

  updateVolumeUI() {
    if (this.state.isMuted || this.state.volume === 0) {
      this.volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16.6915026,16.4744748 L21.3818531,21.1272231 C21.6575501,21.4170592 21.6575501,21.8695467 21.3818531,22.1593821 C21.0972752,22.4492181 20.6563168,22.4492181 20.3717389,22.1593821 L15.6814043,17.5065921 L10.9910697,22.1593821 C10.7063918,22.4492181 10.2654334,22.4492181 9.98085547,22.1593821 C9.70515847,21.8695467 9.70515847,21.4170592 9.98085547,21.1272231 L14.6711899,16.4744748 L9.98085547,11.8216865 C9.70515847,11.5318504 9.70515847,11.0793629 9.98085547,10.7895275 C10.2654334,10.4996914 10.7063918,10.4996914 10.9910697,10.7895275 L15.6814043,15.4423158 L20.3717389,10.7895275 C20.6563168,10.4996914 21.0972752,10.4996914 21.3818531,10.7895275 C21.6575501,11.0793629 21.6575501,11.5318504 21.3818531,11.8216865 L16.6915026,16.4744748 Z"/></svg>';
    } else if (this.state.volume < 0.5) {
      this.volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>';
    } else {
      this.volumeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(err => {
        this.showError('لا يمكن تفعيل ملء الشاشة');
      });
    } else {
      document.exitFullscreen();
    }
  }

  seek(e) {
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.video.currentTime = percent * this.video.duration;
  }

  startDragging() {
    const onMouseMove = (e) => {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.video.currentTime = percent * this.video.duration;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  updateProgress() {
    const percent = (this.video.currentTime / this.video.duration) * 100;
    this.progressFill.style.width = percent + '%';
    this.progressHandle.style.left = percent + '%';
    this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  onPlay() {
    this.state.isPlaying = true;
    this.playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
    this.hideLoading();
  }

  onPause() {
    this.state.isPlaying = false;
    this.playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  }

  onLoadedMetadata() {
    this.state.duration = this.video.duration;
    this.durationDisplay.textContent = this.formatTime(this.video.duration);
    this.hideLoading();
  }

  onVideoError() {
    const errorCode = this.video.error?.code;
    let message = 'حدث خطأ في تشغيل الفيديو';
    
    switch(errorCode) {
      case 1:
        message = 'تم إيقاف تحميل الفيديو';
        break;
      case 2:
        message = 'خطأ في الشبكة';
        break;
      case 3:
        message = 'تم إيقاف فك تشفير الفيديو';
        break;
      case 4:
        message = 'صيغة الفيديو غير مدعومة';
        break;
    }
    
    this.showError(message);
  }

  onVideoEnded() {
    this.state.isPlaying = false;
    this.playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  }

  showLoading() {
    this.loadingIndicator.style.display = 'flex';
  }

  hideLoading() {
    this.loadingIndicator.style.display = 'none';
  }

  showError(message) {
    this.state.error = message;
    this.errorMessage.textContent = message;
    this.errorContainer.style.display = 'flex';
    this.hideLoading();
  }

  hideError() {
    this.state.error = null;
    this.errorContainer.style.display = 'none';
  }

  retry() {
    this.hideError();
    this.video.load();
  }

  showControls() {
    this.controlsRow.style.opacity = '1';
  }

  hideControls() {
    if (this.state.isPlaying) {
      this.controlsRow.style.opacity = '0.3';
    }
  }

  destroy() {
    this.video.pause();
    this.video.src = '';
    this.container.innerHTML = '';
  }
}
