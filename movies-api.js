/**
 * Movies API Integration Module
 * يدير تحميل الأفلام من TMDB API و7 سيرفرات مختلفة
 */

// Configuration
const CONFIG = {
  TMDB_API_KEY: 'YOUR_TMDB_API_KEY', // يجب استبدالها بمفتاح حقيقي
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  
  // 7 سيرفرات مجانية للمشاهدة
  SERVERS: {
    server1: {
      name: 'VidSrc Pro',
      url: (imdbId) => `https://vidsrc.to/embed/movie/${imdbId}`,
      status: 'online'
    },
    server2: {
      name: 'VidSrc XYZ',
      url: (imdbId) => `https://vidsrc.xyz/embed/movie/${imdbId}`,
      status: 'online'
    },
    server3: {
      name: 'VidSrc Dev',
      url: (imdbId) => `https://vidsrc.pro/embed/movie/${imdbId}`,
      status: 'online'
    },
    server4: {
      name: '2Embed',
      url: (imdbId) => `https://2embed.org/embed/movie?imdb=${imdbId}`,
      status: 'online'
    },
    server5: {
      name: 'Embed.su',
      url: (imdbId) => `https://embed.su/embed/movie/${imdbId}`,
      status: 'online'
    },
    server6: {
      name: 'MultiEmbed',
      url: (imdbId) => `https://multiembed.mov/directstream.php?video_id=${imdbId}&nopop=1`,
      status: 'online'
    },
    server7: {
      name: 'AutoEmbed',
      url: (imdbId) => `https://autoembed.to/movie/${imdbId}`,
      status: 'online'
    },
    backup: {
      name: 'Backup Server',
      url: (imdbId) => `https://vidsrc.to/embed/movie/${imdbId}`,
      status: 'online'
    }
  }
};

/**
 * فئة لإدارة الأفلام والسيرفرات
 */
class MoviesManager {
  constructor() {
    this.movies = [];
    this.filteredMovies = [];
    this.currentCategory = 'all';
  }

  /**
   * تحميل الأفلام من TMDB API
   */
  async loadMoviesFromTMDB(page = 1) {
    try {
      // في الواقع، يجب استخدام TMDB API
      // لكن للتطوير السريع، سنستخدم بيانات محلية
      return this.getLocalMovies();
    } catch (error) {
      console.error('خطأ في تحميل الأفلام:', error);
      return this.getLocalMovies();
    }
  }

  /**
   * الحصول على الأفلام المحلية (للتطوير)
   */
  getLocalMovies() {
    return [
      {
        id: 1,
        title: "Inception",
        titleAr: "بداية",
        year: 2010,
        rating: 8.8,
        genre: "sci-fi",
        genreAr: "خيال علمي",
        description: "فيلم خيال علمي يتحدث عن سرقة الأفكار من عقل الإنسان أثناء النوم. بطولة ليوناردو دي كابريو.",
        imdbId: "tt1375666",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 2,
        title: "The Dark Knight",
        titleAr: "الفارس الأسود",
        year: 2008,
        rating: 9.0,
        genre: "action",
        genreAr: "أكشن",
        description: "فيلم أكشن يتحدث عن صراع باتمان مع الجوكر في مدينة جوثام. من إخراج كريستوفر نولان.",
        imdbId: "tt0468569",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 3,
        title: "Titanic",
        titleAr: "تايتانك",
        year: 1997,
        rating: 7.8,
        genre: "romance",
        genreAr: "رومانسي",
        description: "قصة حب درامية تدور أحداثها على سفينة تايتانك الشهيرة. بطولة ليوناردو دي كابريو وكيت وينسليت.",
        imdbId: "tt0120338",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 4,
        title: "The Shining",
        titleAr: "التوهج",
        year: 1980,
        rating: 8.4,
        genre: "horror",
        genreAr: "رعب",
        description: "فيلم رعب نفسي يتحدث عن عائلة تقيم في فندق معزول خلال فصل الشتاء. من إخراج ستانلي كوبريك.",
        imdbId: "tt0081505",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 5,
        title: "Forrest Gump",
        titleAr: "فوريست جامب",
        year: 1994,
        rating: 8.8,
        genre: "drama",
        genreAr: "درامي",
        description: "فيلم درامي يتحدث عن حياة رجل بسيط يحقق أحلاماً كبيرة. بطولة توم هانكس.",
        imdbId: "tt0109830",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 6,
        title: "Superbad",
        titleAr: "سوبرباد",
        year: 2007,
        rating: 7.6,
        genre: "comedy",
        genreAr: "كوميديا",
        description: "فيلم كوميديا يتحدث عن مغامرات طالبي ثانوية في حفلة. من بطولة جونا هيل وكريستوفر مينتز-بلاس.",
        imdbId: "tt0829482",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 7,
        title: "Pulp Fiction",
        titleAr: "خيال خاص",
        year: 1994,
        rating: 8.9,
        genre: "drama",
        genreAr: "درامي",
        description: "فيلم درامي معقد يجمع عدة قصص متشابكة. من إخراج كوينتين تارانتينو.",
        imdbId: "tt0110912",
        poster: "🎬",
        backdrop: "🎬"
      },
      {
        id: 8,
        title: "The Matrix",
        titleAr: "المصفوفة",
        year: 1999,
        rating: 8.7,
        genre: "sci-fi",
        genreAr: "خيال علمي",
        description: "فيلم خيال علمي ثوري يتحدث عن عالم افتراضي. بطولة كيانو ريفز.",
        imdbId: "tt0133093",
        poster: "🎬",
        backdrop: "🎬"
      }
    ];
  }

  /**
   * البحث عن أفلام
   */
  searchMovies(query) {
    return this.movies.filter(movie => 
      movie.titleAr.includes(query) || 
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * تصفية الأفلام حسب الفئة
   */
  filterByCategory(category) {
    this.currentCategory = category;
    if (category === 'all') {
      this.filteredMovies = this.movies;
    } else {
      this.filteredMovies = this.movies.filter(m => m.genre === category);
    }
    return this.filteredMovies;
  }

  /**
   * الحصول على رابط السيرفر
   */
  getServerUrl(imdbId, serverKey) {
    const server = CONFIG.SERVERS[serverKey];
    if (!server) return null;
    return server.url(imdbId);
  }

  /**
   * الحصول على قائمة السيرفرات المتاحة
   */
  getAvailableServers() {
    return Object.entries(CONFIG.SERVERS).map(([key, server]) => ({
      key,
      name: server.name,
      status: server.status
    }));
  }

  /**
   * تحديث حالة السيرفر
   */
  updateServerStatus(serverKey, status) {
    if (CONFIG.SERVERS[serverKey]) {
      CONFIG.SERVERS[serverKey].status = status;
    }
  }

  /**
   * إضافة فيلم جديد
   */
  addMovie(movie) {
    this.movies.push(movie);
    return movie;
  }

  /**
   * الحصول على جميع الأفلام
   */
  getAllMovies() {
    return this.movies;
  }

  /**
   * الحصول على الأفلام المصفاة
   */
  getFilteredMovies() {
    return this.filteredMovies.length > 0 ? this.filteredMovies : this.movies;
  }
}

/**
 * فئة لإدارة الإعلانات
 */
class AdManager {
  constructor() {
    this.adsenseClientId = 'ca-pub-xxxxxxxxxxxxxxxx'; // استبدل بـ ID حقيقي
    this.adSlots = {
      header: 'xxxxxxxx',
      sidebar: 'xxxxxxxx',
      footer: 'xxxxxxxx'
    };
  }

  /**
   * تحميل إعلانات Google AdSense
   */
  loadAdSense() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adsenseClientId}`;
    document.head.appendChild(script);
  }

  /**
   * إضافة إعلان في موقع محدد
   */
  insertAd(elementId, slotType = 'header') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const adSlot = this.adSlots[slotType] || this.adSlots.header;
    
    const adHTML = `
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${this.adsenseClientId}"
           data-ad-slot="${adSlot}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    
    element.innerHTML = adHTML;
    
    // Push ad
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  }

  /**
   * إدراج إعلانات بديلة (Adsterra, PropellerAds)
   */
  insertAlternativeAds(elementId, network = 'adsterra') {
    const element = document.getElementById(elementId);
    if (!element) return;

    let adCode = '';
    
    if (network === 'adsterra') {
      adCode = `
        <script type="text/javascript">
          atOptions = {
            'key' : 'YOUR_ADSTERRA_KEY',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
          document.write('<scr' + 'ipt type="text/javascript" src="//www.highperformanceformat.com/YOUR_ADSTERRA_KEY/invoke.js"><\/scr' + 'ipt>');
        </script>
      `;
    } else if (network === 'propellerads') {
      adCode = `
        <script type="text/javascript" src="https://cdn.propellerads.com/loader.js" data-propeller data-site="YOUR_PROPELLER_SITE_ID"></script>
      `;
    }
    
    element.innerHTML = adCode;
  }
}

/**
 * فئة لإدارة التوليد التلقائي بالذكاء الاصطناعي
 */
class AIMovieGenerator {
  constructor() {
    this.apiEndpoint = '/api/generate-movies'; // يجب إنشاء هذا الـ endpoint
  }

  /**
   * توليد وصف الفيلم بالذكاء الاصطناعي
   */
  async generateDescription(movieTitle, genre) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: movieTitle,
          genre: genre,
          language: 'ar'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate description');
      
      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('خطأ في توليد الوصف:', error);
      return null;
    }
  }

  /**
   * توليد قائمة أفلام مقترحة
   */
  async generateRecommendations(userPreferences) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'recommend',
          preferences: userPreferences,
          language: 'ar'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate recommendations');
      
      const data = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('خطأ في توليد التوصيات:', error);
      return [];
    }
  }

  /**
   * توليد عناوين بديلة للأفلام
   */
  async generateAlternativeTitles(movieTitle) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'titles',
          title: movieTitle,
          language: 'ar'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate titles');
      
      const data = await response.json();
      return data.titles;
    } catch (error) {
      console.error('خطأ في توليد العناوين:', error);
      return [];
    }
  }
}

/**
 * تصدير الفئات للاستخدام في الملفات الأخرى
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MoviesManager,
    AdManager,
    AIMovieGenerator,
    CONFIG
  };
}

// إنشاء نسخة عامة من المدراء
const moviesManager = new MoviesManager();
const adManager = new AdManager();
const aiGenerator = new AIMovieGenerator();
