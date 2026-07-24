/**
 * مصدر الأفلام: Internet Archive (archive.org)
 * ================================================
 * كل الأفلام هون من مجموعة "Public Domain" الرسمية بموقع Internet Archive —
 * يعني حقوقها منتهية أو منشورة مفتوحة، والمشاهدة/التضمين قانوني 100% بدون
 * أي حاجة لترخيص أو اتفاقية توزيع.
 *
 * ملاحظة مهمة: هذا مصدر مؤقت مجاني وقانوني. لو حبيت لاحقاً تضيف مصادر
 * مرخّصة إضافية (اتفاقية توزيع رسمية مع منصة أخرى)، بس ضيف endpoint جديد
 * بنفس شكل fetchMovies وادمجه بمصفوفة النتائج.
 */

const ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php";
const ARCHIVE_THUMB_URL = "https://archive.org/services/img";
const ARCHIVE_EMBED_URL = "https://archive.org/embed";

let currentIdentifier = null;
let heroMovie = null;

/**
 * جلب أفلام Public Domain من Internet Archive حسب كلمة بحث/تصنيف،
 * وعرضها بالحاوية المطلوبة.
 */
async function fetchMovies(searchQuery, containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div style="color:#999;padding:20px;">جاري التحميل...</div>';
  }

  try {
    const q = `collection:(feature_films) AND mediatype:(movies) AND ${searchQuery}`;
    const params = new URLSearchParams({
      q,
      output: "json",
      rows: "20",
      page: "1",
      "sort[]": "downloads desc",
    });
    ["identifier", "title", "description", "year"].forEach((f) => params.append("fl[]", f));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 ثانية كحد أقصى

    const res = await fetch(`${ARCHIVE_SEARCH_URL}?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    const docs = (data.response && data.response.docs) || [];

    if (!container) return docs;
    container.innerHTML = "";

    if (docs.length === 0) {
      container.innerHTML = '<div style="color:#999;padding:20px;">ما في أفلام متاحة بهذا التصنيف حالياً</div>';
      return docs;
    }

    docs.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie-card";
      const title = escapeHTML(movie.title || movie.identifier);
      const year = movie.year ? ` (${escapeHTML(String(movie.year))})` : "";
      card.innerHTML = `
        <img src="${ARCHIVE_THUMB_URL}/${encodeURIComponent(movie.identifier)}" alt="${title}" loading="lazy"
             onerror="this.src='https://archive.org/images/notfound.png'">
        <div class="movie-card-info">
          <h4 style="font-size:14px;margin-bottom:5px;">${title}${year}</h4>
          <p style="font-size:11px;color:#00D4FF;">🏛️ Public Domain — قانوني ومجاني</p>
        </div>
      `;
      card.onclick = () => openPlayer(movie);
      container.appendChild(card);
    });

    if (containerId === "trending-movies" && docs.length > 0) {
      setHeroMovie(docs[0]);
    }
    return docs;
  } catch (error) {
    console.error("Error fetching movies from Internet Archive:", error);
    if (container) {
      const isTimeout = error.name === "AbortError";
      container.innerHTML = `<div style="color:#999;padding:20px;">${
        isTimeout
          ? "الاتصال بـ Internet Archive بطيء جداً أو محجوب من شبكتك — جرّب VPN أو شبكة تانية"
          : "تعذّر تحميل الأفلام حالياً، حاول لاحقاً"
      }</div>`;
    }
    return [];
  }
}

// تعقيم بسيط لمنع أي XSS من بيانات وصفية قد يرفعها مستخدمون آخرون بـ Archive.org
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setHeroMovie(movie) {
  heroMovie = movie;
  const hero = document.getElementById("hero");
  if (hero) {
    hero.style.backgroundImage = `url(${ARCHIVE_THUMB_URL}/${encodeURIComponent(movie.identifier)})`;
    document.getElementById("hero-title").textContent = movie.title || movie.identifier;
    document.getElementById("hero-overview").textContent =
      stripHtml(movie.description) || "فيلم من مجموعة الملكية العامة (Public Domain) — مجاني وقانوني بالكامل.";
  }
}

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function playHeroMovie() {
  if (heroMovie) openPlayer(heroMovie);
}

function openPlayer(movie) {
  currentIdentifier = movie.identifier;
  const modal = document.getElementById("player-modal");
  modal.style.display = "block";
  document.getElementById("player-title").textContent = movie.title || movie.identifier;
  const overviewText = stripHtml(movie.description) || "لا يوجد وصف متاح حالياً لهذا الفيلم.";
  document.getElementById("player-overview").textContent = overviewText;
  // نخزّن النص الأصلي (قبل أي ترجمة) حتى زر "ترجم الوصف" بـ movies.html
  // يقدر يوصله دايماً، وحتى ما نترجم نص مترجم أصلاً لو ضغط المستخدم الزر
  // أكتر من مرة
  window.currentMovieOriginalOverview = overviewText;
  const translateBtn = document.getElementById("translate-desc-btn");
  if (translateBtn) translateBtn.style.display = "inline-block";

  const iframe = document.getElementById("video-iframe");
  // مشغّل Internet Archive الرسمي — قانوني ومباشر، بدون أي سيرفرات وسيطة
  iframe.src = `${ARCHIVE_EMBED_URL}/${encodeURIComponent(currentIdentifier)}`;

  document.body.style.overflow = "hidden";
}

function closePlayer() {
  document.getElementById("player-modal").style.display = "none";
  document.getElementById("video-iframe").src = "";
  document.body.style.overflow = "auto";
}

// Initialize — تصنيفات مبنية على كلمات مفتاحية حقيقية بمجموعة feature_films
document.addEventListener("DOMContentLoaded", () => {
  fetchMovies('subject:("action" OR "adventure")', "trending-movies");
  fetchMovies('subject:("action")', "action-movies");
  fetchMovies('subject:("horror" OR "thriller")', "horror-movies");
});