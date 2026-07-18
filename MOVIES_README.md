# 🎬 قسم الأفلام المترجمة - دليل شامل

## نظرة عامة

قسم أفلام احترافي وعصري مع **7 سيرفرات مجانية** للمشاهدة، تصميم متحرك حديث، وتوليد تلقائي للمحتوى باستخدام الذكاء الاصطناعي (Claude AI و Manus AI).

## ✨ المميزات الرئيسية

### 1. **7 سيرفرات مجانية للمشاهدة**
- **VidSrc Pro** - السيرفر الأساسي
- **VidSrc XYZ** - بديل سريع
- **VidSrc Dev** - نسخة تطوير
- **2Embed** - سيرفر بديل قوي
- **Embed.su** - سيرفر إضافي
- **MultiEmbed** - سيرفر متعدد
- **AutoEmbed** - سيرفر تلقائي
- **Backup Server** - سيرفر احتياطي

### 2. **تصميم عصري وجذاب**
- واجهة مستخدم حديثة بألوان متدرجة (أزرق سماوي، بنفسجي، وردي)
- تأثيرات حركية سلسة وانتقالات جميلة
- تصميم متجاوب يعمل على جميع الأجهزة
- شاشة عرض احترافية للأفلام

### 3. **نظام التوليد التلقائي**
- توليد أوصاف الأفلام بالعربية باستخدام Claude AI
- توليد توصيات أفلام مخصصة
- جدولة التوليد التلقائي كل 24 ساعة
- دعم توليد محتوى بكميات كبيرة

### 4. **نظام الإعلانات المرن**
- دعم Google AdSense
- دعم شبكات إعلانية بديلة (Adsterra, PropellerAds)
- مساحات إعلانية متعددة
- تكامل سهل مع أي شبكة إعلانية

## 📁 هيكل الملفات

```
points-site/
├── movies.html              # الصفحة الرئيسية لقسم الأفلام
├── movies-api.js            # إدارة الأفلام والسيرفرات والإعلانات
├── backend-movies.js        # توليد الأفلام بالذكاء الاصطناعي
├── package.json             # المكتبات والـ dependencies
├── .env.example             # متغيرات البيئة
├── MOVIES_README.md         # هذا الملف
└── scripts/
    ├── generate-movies.js   # سكريبت التوليد اليدوي
    └── schedule-generation.js # جدولة التوليد التلقائي
```

## 🚀 البدء السريع

### 1. التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/tjary0196-create/points-site.git
cd points-site

# تثبيت المكتبات
npm install
```

### 2. إعداد متغيرات البيئة

```bash
# نسخ ملف المثال
cp .env.example .env

# تحرير الملف وإضافة مفاتيح API الخاصة بك
nano .env
```

**المتغيرات المطلوبة:**

```env
# Google AdSense
ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
ADSENSE_SLOT_HEADER=xxxxxxxx

# OpenAI (Claude AI)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Manus AI (اختياري)
MANUS_API_KEY=YOUR_MANUS_API_KEY

# TMDB (للحصول على بيانات الأفلام)
TMDB_API_KEY=YOUR_TMDB_API_KEY
```

### 3. تشغيل الخادم

```bash
# في بيئة التطوير
npm run dev

# في الإنتاج
npm start
```

## 📖 كيفية الاستخدام

### إضافة قسم الأفلام إلى الموقع

1. **أضف رابط في الصفحة الرئيسية:**

```html
<!-- في index.html -->
<a href="movies.html" class="nav-link">🎬 الأفلام</a>
```

2. **تحميل ملفات JavaScript:**

```html
<!-- في movies.html -->
<script src="movies-api.js"></script>
<script src="backend-movies.js"></script>
```

3. **تهيئة المدراء:**

```javascript
// تحميل الأفلام
moviesManager.loadMoviesFromTMDB().then(movies => {
  moviesManager.movies = movies;
  moviesManager.filteredMovies = movies;
  loadMovies();
});

// تحميل الإعلانات
adManager.loadAdSense();
```

### استخدام نظام التوليد التلقائي

#### 1. التوليد اليدوي

```javascript
// توليد وصف فيلم
const description = await aiGenerator.generateDescription(
  'Inception',
  'sci-fi'
);

// توليد توصيات
const recommendations = await aiGenerator.generateRecommendations({
  genres: ['action', 'drama'],
  language: 'ar'
});
```

#### 2. جدولة التوليد التلقائي

```bash
# تشغيل جدولة التوليد
npm run schedule
```

أو في الكود:

```javascript
const generator = new AIMovieGeneratorBackend();
generator.scheduleAutomaticGeneration(86400000); // كل 24 ساعة
```

#### 3. توليد محتوى بكميات كبيرة

```javascript
const movies = await generator.generateBulkMovieContent(
  ['action', 'drama', 'comedy'],
  20 // عدد الأفلام
);

await generator.updateMovieDatabase(movies);
```

## 🎯 السيرفرات وكيفية عملها

### اختيار السيرفر

عند اختيار السيرفر، يتم إنشاء رابط embed بناءً على معرف IMDb:

```javascript
// مثال
const imdbId = 'tt1375666'; // Inception
const embedUrl = `https://vidsrc.to/embed/movie/${imdbId}`;

// يتم تحميل الفيديو في iframe
<iframe src="${embedUrl}" allowfullscreen></iframe>
```

### إضافة سيرفرات جديدة

لإضافة سيرفر جديد، عدّل `CONFIG.SERVERS` في `movies-api.js`:

```javascript
CONFIG.SERVERS.newServer = {
  name: 'اسم السيرفر',
  url: (imdbId) => `https://example.com/embed/${imdbId}`,
  status: 'online'
};
```

## 💰 نظام الإعلانات

### Google AdSense

1. **الحصول على معرف AdSense:**
   - اذهب إلى [Google AdSense](https://www.google.com/adsense/)
   - أنشئ حساباً وأضف موقعك
   - احصل على معرف الناشر (Publisher ID)

2. **إضافة الإعلانات:**

```html
<!-- في movies.html -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
     data-ad-slot="xxxxxxxx"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### شبكات إعلانية بديلة

#### Adsterra
```html
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
```

#### PropellerAds
```html
<script type="text/javascript" src="https://cdn.propellerads.com/loader.js" data-propeller data-site="YOUR_PROPELLER_SITE_ID"></script>
```

## 🤖 التوليد بالذكاء الاصطناعي

### كيفية عمل النظام

1. **تلقي الطلب:** يتم استقبال طلب لتوليد محتوى
2. **معالجة الطلب:** يتم صياغة prompt مناسب
3. **استدعاء API:** يتم استدعاء Claude AI أو Manus AI
4. **معالجة النتيجة:** يتم معالجة الرد وحفظه
5. **التحديث:** يتم تحديث قاعدة البيانات

### أمثلة على الاستخدام

#### توليد وصف فيلم

```javascript
const description = await aiGenerator.generateDescription(
  'The Matrix',
  'sci-fi'
);

// النتيجة:
// "فيلم خيال علمي ثوري يتحدث عن عالم افتراضي..."
```

#### توليد توصيات

```javascript
const recommendations = await aiGenerator.generateRecommendations(
  ['action', 'drama']
);

// النتيجة: مصفوفة من الأفلام المقترحة
```

#### توليد عناوين بديلة

```javascript
const titles = await aiGenerator.generateAlternativeTitles(
  'Inception'
);

// النتيجة: قائمة بعناوين بديلة بالعربية
```

## 🔄 جدولة التوليد التلقائي

### إعداد الجدولة

```javascript
// في backend-movies.js
const generator = new AIMovieGeneratorBackend();

// جدولة التوليد كل 24 ساعة
generator.scheduleAutomaticGeneration(86400000);
```

### تخصيص الجدولة

```javascript
// توليد كل ساعة
generator.scheduleAutomaticGeneration(3600000);

// توليد كل 12 ساعة
generator.scheduleAutomaticGeneration(43200000);

// توليد كل 7 أيام
generator.scheduleAutomaticGeneration(604800000);
```

## 📊 قاعدة البيانات

### هيكل البيانات

```javascript
{
  id: 1,
  title: "Inception",
  titleAr: "بداية",
  year: 2010,
  rating: 8.8,
  genre: "sci-fi",
  genreAr: "خيال علمي",
  description: "فيلم خيال علمي...",
  imdbId: "tt1375666",
  poster: "🎬",
  backdrop: "🎬"
}
```

### حفظ البيانات

البيانات يتم حفظها في:
- `movies-database.json` (ملف محلي)
- Firebase (اختياري)
- قاعدة بيانات MySQL/PostgreSQL (اختياري)

## 🔐 الأمان والخصوصية

### نصائح الأمان

1. **حماية مفاتيح API:**
   - استخدم `.env` ولا تشارك المفاتيح
   - قم بتدوير المفاتيح بانتظام

2. **التحقق من المدخلات:**
   - تحقق من صحة البيانات المدخلة
   - استخدم validation libraries

3. **معدل الطلبات:**
   - حدد حد أقصى لعدد الطلبات
   - استخدم caching للبيانات المتكررة

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

#### 1. السيرفرات لا تعمل
```javascript
// تحقق من حالة السيرفر
const servers = moviesManager.getAvailableServers();
console.log(servers);

// حدّث حالة السيرفر
moviesManager.updateServerStatus('server1', 'offline');
```

#### 2. الإعلانات لا تظهر
```javascript
// تأكد من تحميل AdSense
adManager.loadAdSense();

// تحقق من معرف الناشر
console.log(adManager.adsenseClientId);
```

#### 3. التوليد لا يعمل
```javascript
// تحقق من مفاتيح API
console.log(process.env.OPENAI_API_KEY);

// اختبر الاتصال
const test = await aiGenerator.generateDescription('Test', 'action');
```

## 📱 الاستجابة والتوافق

- ✅ متوافق مع جميع المتصفحات الحديثة
- ✅ متجاوب على الهواتف والأجهزة اللوحية
- ✅ يدعم اللغة العربية بالكامل
- ✅ يعمل بدون JavaScript (fallback)

## 🚀 النشر والإطلاق

### على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# نشر المشروع
vercel
```

### على Firebase

```bash
# تثبيت Firebase CLI
npm i -g firebase-tools

# تسجيل الدخول
firebase login

# نشر المشروع
firebase deploy
```

### على GitHub Pages

```bash
# إنشاء فرع gh-pages
git checkout -b gh-pages

# دفع الملفات الثابتة
git push origin gh-pages
```

## 📞 الدعم والمساعدة

للمزيد من المساعدة:
- 📧 البريد الإلكتروني: support@example.com
- 💬 Telegram: @example
- 🐙 GitHub Issues: [اضغط هنا](https://github.com/tjary0196-create/points-site/issues)

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License

## 🙏 شكر وتقدير

شكراً لاستخدامك هذا النظام. نتمنى أن يساعدك في بناء موقع أفلام احترافي!

---

**آخر تحديث:** يوليو 2026
**الإصدار:** 1.0.0
