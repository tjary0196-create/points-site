/**
 * لوحة تحكم المدير الشاملة
 * إدارة الأفلام والمستخدمين والاشتراكات والإعلانات
 */

class AdminDashboard {
  constructor() {
    this.isAdmin = this.checkAdminAccess();
    if (this.isAdmin) {
      this.init();
    }
  }

  init() {
    this.createDashboard();
    this.setupEventListeners();
    this.loadDashboardData();
  }

  checkAdminAccess() {
    const adminToken = localStorage.getItem('adminToken');
    return adminToken === 'admin_access_granted';
  }

  createDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'admin-dashboard';
    dashboard.className = 'admin-dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h1>🎬 لوحة تحكم المدير</h1>
        <div class="header-actions">
          <button class="logout-btn">تسجيل الخروج</button>
        </div>
      </div>

      <div class="dashboard-container">
        <nav class="dashboard-nav">
          <button class="nav-item active" data-tab="overview">📊 نظرة عامة</button>
          <button class="nav-item" data-tab="movies">🎥 إدارة الأفلام</button>
          <button class="nav-item" data-tab="users">👥 إدارة المستخدمين</button>
          <button class="nav-item" data-tab="subscriptions">📅 الاشتراكات</button>
          <button class="nav-item" data-tab="ads">📢 الإعلانات</button>
          <button class="nav-item" data-tab="analytics">📈 الإحصائيات</button>
        </nav>

        <div class="dashboard-content">
          <!-- نظرة عامة -->
          <div class="tab-content active" id="overview-tab">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🎬</div>
                <div class="stat-info">
                  <p class="stat-label">إجمالي الأفلام</p>
                  <p class="stat-value" id="total-movies">0</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                  <p class="stat-label">المستخدمون النشطون</p>
                  <p class="stat-value" id="active-users">0</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                  <p class="stat-label">الإيرادات الشهرية</p>
                  <p class="stat-value" id="monthly-revenue">$0</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <p class="stat-label">متوسط التقييم</p>
                  <p class="stat-value" id="avg-rating">0</p>
                </div>
              </div>
            </div>
          </div>

          <!-- إدارة الأفلام -->
          <div class="tab-content" id="movies-tab">
            <div class="section-header">
              <h2>إدارة الأفلام</h2>
              <button class="btn btn-primary" id="add-movie-btn">+ إضافة فيلم جديد</button>
            </div>
            <div class="movies-list" id="movies-list"></div>
          </div>

          <!-- إدارة المستخدمين -->
          <div class="tab-content" id="users-tab">
            <div class="section-header">
              <h2>إدارة المستخدمين</h2>
              <input type="text" class="search-input" placeholder="البحث عن مستخدم...">
            </div>
            <div class="users-list" id="users-list"></div>
          </div>

          <!-- الاشتراكات -->
          <div class="tab-content" id="subscriptions-tab">
            <div class="section-header">
              <h2>إدارة الاشتراكات</h2>
            </div>
            <div class="subscriptions-stats">
              <div class="subscription-stat">
                <h3>المجاني</h3>
                <p class="count" id="free-subs">0</p>
              </div>
              <div class="subscription-stat">
                <h3>الأساسي</h3>
                <p class="count" id="basic-subs">0</p>
              </div>
              <div class="subscription-stat">
                <h3>المميز</h3>
                <p class="count" id="premium-subs">0</p>
              </div>
            </div>
            <div class="subscriptions-list" id="subscriptions-list"></div>
          </div>

          <!-- الإعلانات -->
          <div class="tab-content" id="ads-tab">
            <div class="section-header">
              <h2>إدارة الإعلانات</h2>
              <button class="btn btn-primary" id="add-ad-btn">+ إضافة إعلان جديد</button>
            </div>
            <div class="ads-list" id="ads-list"></div>
          </div>

          <!-- الإحصائيات -->
          <div class="tab-content" id="analytics-tab">
            <div class="section-header">
              <h2>الإحصائيات والتحليلات</h2>
            </div>
            <div class="analytics-container">
              <div class="chart-container">
                <h3>المشاهدات اليومية</h3>
                <canvas id="views-chart"></canvas>
              </div>
              <div class="chart-container">
                <h3>الأفلام الأكثر مشاهدة</h3>
                <div id="top-movies"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- نافذة إضافة فيلم -->
      <div class="modal" id="movie-modal" style="display: none;">
        <div class="modal-content">
          <button class="close-btn">×</button>
          <h2>إضافة فيلم جديد</h2>
          <form id="movie-form">
            <div class="form-group">
              <label>عنوان الفيلم</label>
              <input type="text" name="title" required>
            </div>
            <div class="form-group">
              <label>الوصف</label>
              <textarea name="description" rows="4"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>السنة</label>
                <input type="number" name="year" min="1900" max="2099">
              </div>
              <div class="form-group">
                <label>التقييم</label>
                <input type="number" name="rating" min="0" max="10" step="0.1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>النوع</label>
                <input type="text" name="genre">
              </div>
              <div class="form-group">
                <label>المدة (دقيقة)</label>
                <input type="number" name="duration" min="1">
              </div>
            </div>
            <div class="form-group">
              <label>رابط الفيديو</label>
              <input type="url" name="videoUrl" required>
            </div>
            <div class="form-group">
              <label>رابط الصورة</label>
              <input type="url" name="posterUrl">
            </div>
            <div class="form-group">
              <label>نوع الفيلم</label>
              <select name="movieType">
                <option value="free">مجاني</option>
                <option value="standard">عادي</option>
                <option value="premium">مميز</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">حفظ الفيلم</button>
              <button type="button" class="btn btn-secondary" id="cancel-movie">إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(dashboard);
    this.dashboard = dashboard;
  }

  setupEventListeners() {
    // التنقل بين الأقسام
    this.dashboard.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // إضافة فيلم
    this.dashboard.querySelector('#add-movie-btn').addEventListener('click', () => {
      this.dashboard.querySelector('#movie-modal').style.display = 'flex';
    });

    // إغلاق النافذة
    this.dashboard.querySelector('.close-btn').addEventListener('click', () => {
      this.dashboard.querySelector('#movie-modal').style.display = 'none';
    });

    // حفظ الفيلم
    this.dashboard.querySelector('#movie-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveMovie(new FormData(e.target));
    });

    // تسجيل الخروج
    this.dashboard.querySelector('.logout-btn').addEventListener('click', () => {
      this.logout();
    });
  }

  switchTab(tabName) {
    // إخفاء جميع الأقسام
    this.dashboard.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });

    // إزالة الفئة النشطة من الأزرار
    this.dashboard.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
    });

    // إظهار القسم المختار
    this.dashboard.querySelector(`#${tabName}-tab`).classList.add('active');
    this.dashboard.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // تحميل البيانات
    this.loadTabData(tabName);
  }

  loadTabData(tabName) {
    switch(tabName) {
      case 'movies':
        this.loadMovies();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'subscriptions':
        this.loadSubscriptions();
        break;
      case 'ads':
        this.loadAds();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
    }
  }

  loadDashboardData() {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');

    this.dashboard.querySelector('#total-movies').textContent = movies.length;
    this.dashboard.querySelector('#active-users').textContent = users.filter(u => u.active).length;
    this.dashboard.querySelector('#monthly-revenue').textContent = '$' + (subscriptions.length * 15).toFixed(2);
    
    const avgRating = movies.length > 0 
      ? (movies.reduce((sum, m) => sum + (m.rating || 0), 0) / movies.length).toFixed(1)
      : 0;
    this.dashboard.querySelector('#avg-rating').textContent = avgRating;
  }

  loadMovies() {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    const container = this.dashboard.querySelector('#movies-list');
    
    container.innerHTML = movies.map((movie, idx) => `
      <div class="list-item">
        <div class="item-info">
          <h3>${movie.title}</h3>
          <p>${movie.genre} • ${movie.year}</p>
          <p>⭐ ${movie.rating}/10</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small" onclick="adminDashboard.editMovie(${idx})">تعديل</button>
          <button class="btn btn-danger btn-small" onclick="adminDashboard.deleteMovie(${idx})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const container = this.dashboard.querySelector('#users-list');
    
    container.innerHTML = users.map((user, idx) => `
      <div class="list-item">
        <div class="item-info">
          <h3>${user.name}</h3>
          <p>${user.email}</p>
          <p>الاشتراك: ${user.subscription || 'مجاني'}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small" onclick="adminDashboard.viewUser(${idx})">عرض</button>
          <button class="btn btn-danger btn-small" onclick="adminDashboard.removeUser(${idx})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  loadSubscriptions() {
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    
    const freeSubs = subscriptions.filter(s => s.plan === 'free').length;
    const basicSubs = subscriptions.filter(s => s.plan === 'basic').length;
    const premiumSubs = subscriptions.filter(s => s.plan === 'premium').length;

    this.dashboard.querySelector('#free-subs').textContent = freeSubs;
    this.dashboard.querySelector('#basic-subs').textContent = basicSubs;
    this.dashboard.querySelector('#premium-subs').textContent = premiumSubs;

    const container = this.dashboard.querySelector('#subscriptions-list');
    container.innerHTML = subscriptions.map((sub, idx) => `
      <div class="list-item">
        <div class="item-info">
          <h3>${sub.userName}</h3>
          <p>الخطة: ${sub.plan}</p>
          <p>الانتهاء: ${new Date(sub.expiryDate).toLocaleDateString('ar-SA')}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small" onclick="adminDashboard.renewSubscription(${idx})">تجديد</button>
        </div>
      </div>
    `).join('');
  }

  loadAds() {
    const ads = JSON.parse(localStorage.getItem('ads') || '[]');
    const container = this.dashboard.querySelector('#ads-list');
    
    container.innerHTML = ads.map((ad, idx) => `
      <div class="list-item">
        <div class="item-info">
          <h3>${ad.title}</h3>
          <p>النوع: ${ad.type}</p>
          <p>المشاهدات: ${ad.views || 0}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-small" onclick="adminDashboard.editAd(${idx})">تعديل</button>
          <button class="btn btn-danger btn-small" onclick="adminDashboard.deleteAd(${idx})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  loadAnalytics() {
    // يمكن إضافة رسوم بيانية باستخدام Chart.js
    const topMovies = JSON.parse(localStorage.getItem('movies') || '[]')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const container = this.dashboard.querySelector('#top-movies');
    container.innerHTML = topMovies.map(movie => `
      <div class="top-movie">
        <span>${movie.title}</span>
        <span class="views">${movie.views || 0} مشاهدة</span>
      </div>
    `).join('');
  }

  saveMovie(formData) {
    const movies = JSON.parse(localStorage.getItem('movies') || '[]');
    const movie = Object.fromEntries(formData);
    movies.push(movie);
    localStorage.setItem('movies', JSON.stringify(movies));
    
    this.dashboard.querySelector('#movie-modal').style.display = 'none';
    this.dashboard.querySelector('#movie-form').reset();
    this.loadMovies();
    this.loadDashboardData();
  }

  editMovie(idx) {
    alert('ميزة التعديل قادمة قريباً');
  }

  deleteMovie(idx) {
    if (confirm('هل تريد حذف هذا الفيلم؟')) {
      const movies = JSON.parse(localStorage.getItem('movies') || '[]');
      movies.splice(idx, 1);
      localStorage.setItem('movies', JSON.stringify(movies));
      this.loadMovies();
      this.loadDashboardData();
    }
  }

  viewUser(idx) {
    alert('ميزة عرض المستخدم قادمة قريباً');
  }

  removeUser(idx) {
    if (confirm('هل تريد حذف هذا المستخدم؟')) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.splice(idx, 1);
      localStorage.setItem('users', JSON.stringify(users));
      this.loadUsers();
      this.loadDashboardData();
    }
  }

  renewSubscription(idx) {
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    const sub = subscriptions[idx];
    sub.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    this.loadSubscriptions();
  }

  editAd(idx) {
    alert('ميزة تعديل الإعلان قادمة قريباً');
  }

  deleteAd(idx) {
    if (confirm('هل تريد حذف هذا الإعلان؟')) {
      const ads = JSON.parse(localStorage.getItem('ads') || '[]');
      ads.splice(idx, 1);
      localStorage.setItem('ads', JSON.stringify(ads));
      this.loadAds();
    }
  }

  logout() {
    localStorage.removeItem('adminToken');
    window.location.reload();
  }
}

// إنشاء نسخة عامة من لوحة التحكم
const adminDashboard = new AdminDashboard();
