/**
 * Backend Movies Generation Module
 * يدير توليد الأفلام التلقائي باستخدام Claude AI و Manus AI
 * يمكن تشغيله على Node.js أو في بيئة Vercel/Firebase
 */

// استيراد المكتبات المطلوبة
// npm install openai axios dotenv

const axios = require('axios');
require('dotenv').config();

/**
 * فئة لتوليد الأفلام باستخدام الذكاء الاصطناعي
 */
class AIMovieGeneratorBackend {
  constructor() {
    // مفاتيح API
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.manusApiKey = process.env.MANUS_API_KEY;
    
    // نقاط النهاية
    this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.manusEndpoint = 'https://api.manus.im/v1';
    
    // قاعدة بيانات الأفلام (يمكن استبدالها بقاعدة بيانات حقيقية)
    this.moviesDatabase = [];
  }

  /**
   * توليد وصف فيلم باستخدام Claude AI
   */
  async generateMovieDescriptionWithClaude(movieTitle, genre, year) {
    try {
      const prompt = `
أنت كاتب متخصص في الأفلام. قم بكتابة وصف احترافي وجذاب لفيلم بالعربية:
- العنوان: ${movieTitle}
- النوع: ${genre}
- السنة: ${year}

الوصف يجب أن يكون:
1. بين 150-200 كلمة
2. جذاب وممتع
3. يحتوي على ملخص الحبكة الرئيسية
4. يشير إلى النجوم الرئيسيين (إن أمكن)
5. يحتوي على عناصر تشويق

قدم الوصف فقط بدون تعليقات إضافية.
      `;

      const response = await axios.post(this.openaiEndpoint, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد متخصص في كتابة أوصاف الأفلام بالعربية بطريقة احترافية وجذابة.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('خطأ في توليد الوصف مع Claude:', error);
      return null;
    }
  }

  /**
   * توليد قائمة أفلام مقترحة باستخدام Manus AI
   */
  async generateMovieRecommendations(userGenres, count = 10) {
    try {
      const prompt = `
أنت خبير توصيات الأفلام. قم بتوليد قائمة بـ ${count} أفلام مقترحة بناءً على التفضيلات التالية:
- الأنواع المفضلة: ${userGenres.join(', ')}

لكل فيلم، قدم المعلومات التالية بصيغة JSON:
{
  "title": "عنوان الفيلم بالإنجليزية",
  "titleAr": "عنوان الفيلم بالعربية",
  "year": سنة الإصدار,
  "genre": "النوع الرئيسي",
  "genreAr": "النوع بالعربية",
  "rating": تقييم من 1-10,
  "description": "وصف قصير بالعربية",
  "imdbId": "رقم IMDb"
}

قدم النتيجة كمصفوفة JSON فقط.
      `;

      const response = await axios.post(this.manusEndpoint + '/chat/completions', {
        model: 'claude-3-sonnet',
        messages: [
          {
            role: 'system',
            content: 'أنت متخصص في توصيات الأفلام. قدم الإجابات بصيغة JSON صحيحة فقط.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.manusApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      try {
        // محاولة استخراج JSON من الرد
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
      } catch (e) {
        console.error('خطأ في تحليل JSON:', e);
        return [];
      }
    } catch (error) {
      console.error('خطأ في توليد التوصيات:', error);
      return [];
    }
  }

  /**
   * توليد محتوى متعدد الأفلام تلقائياً
   */
  async generateBulkMovieContent(genres, count = 20) {
    try {
      const movies = [];
      
      for (let i = 0; i < count; i++) {
        const genre = genres[i % genres.length];
        const year = 2020 + Math.floor(Math.random() * 5);
        
        // توليد عنوان عشوائي (يمكن تحسينه)
        const movieTitle = `فيلم ${genre} ${i + 1}`;
        
        // توليد الوصف
        const description = await this.generateMovieDescriptionWithClaude(
          movieTitle,
          genre,
          year
        );

        if (description) {
          movies.push({
            id: i + 1,
            title: movieTitle,
            titleAr: movieTitle,
            year: year,
            genre: genre,
            genreAr: genre,
            rating: 6 + Math.random() * 3.5,
            description: description,
            imdbId: `tt${String(i).padStart(7, '0')}`,
            poster: '🎬',
            backdrop: '🎬'
          });
        }

        // تأخير بسيط لتجنب حد معدل الطلبات
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return movies;
    } catch (error) {
      console.error('خطأ في توليد محتوى الأفلام:', error);
      return [];
    }
  }

  /**
   * تحديث قاعدة البيانات بأفلام جديدة
   */
  async updateMovieDatabase(newMovies) {
    try {
      this.moviesDatabase = [...this.moviesDatabase, ...newMovies];
      
      // حفظ في ملف JSON (يمكن استبدالها بقاعدة بيانات حقيقية)
      const fs = require('fs');
      fs.writeFileSync(
        'movies-database.json',
        JSON.stringify(this.moviesDatabase, null, 2)
      );

      return {
        success: true,
        count: this.moviesDatabase.length,
        message: `تم إضافة ${newMovies.length} فيلم جديد`
      };
    } catch (error) {
      console.error('خطأ في تحديث قاعدة البيانات:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * جدولة التوليد التلقائي
   */
  scheduleAutomaticGeneration(interval = 86400000) { // 24 ساعة افتراضياً
    console.log('جدولة التوليد التلقائي كل', interval / 1000, 'ثانية');

    setInterval(async () => {
      console.log('بدء التوليد التلقائي للأفلام...');
      
      const genres = ['action', 'drama', 'comedy', 'horror', 'romance', 'sci-fi'];
      const newMovies = await this.generateBulkMovieContent(genres, 5);
      
      if (newMovies.length > 0) {
        await this.updateMovieDatabase(newMovies);
        console.log(`تم توليد وحفظ ${newMovies.length} فيلم جديد`);
      }
    }, interval);
  }

  /**
   * API endpoint للتوليد عند الطلب
   */
  async handleGenerateRequest(req, res) {
    try {
      const { action, title, genre, preferences } = req.body;

      if (action === 'description') {
        const description = await this.generateMovieDescriptionWithClaude(
          title,
          genre,
          new Date().getFullYear()
        );
        return res.json({ description });
      }

      if (action === 'recommend') {
        const recommendations = await this.generateMovieRecommendations(
          preferences || ['action', 'drama'],
          10
        );
        return res.json({ recommendations });
      }

      if (action === 'bulk') {
        const genres = req.body.genres || ['action', 'drama', 'comedy'];
        const count = req.body.count || 10;
        const movies = await this.generateBulkMovieContent(genres, count);
        return res.json({ movies });
      }

      return res.status(400).json({ error: 'إجراء غير معروف' });
    } catch (error) {
      console.error('خطأ في معالجة الطلب:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

/**
 * إعداد Express server (اختياري)
 */
function setupExpressServer() {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  const generator = new AIMovieGeneratorBackend();

  // API endpoint للتوليد
  app.post('/api/generate-movies', (req, res) => {
    generator.handleGenerateRequest(req, res);
  });

  // API endpoint للحصول على الأفلام
  app.get('/api/movies', (req, res) => {
    res.json(generator.moviesDatabase);
  });

  // بدء جدولة التوليد التلقائي
  generator.scheduleAutomaticGeneration(86400000); // كل 24 ساعة

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/**
 * تصدير الفئة للاستخدام
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIMovieGeneratorBackend,
    setupExpressServer
  };
}

// تشغيل الـ server إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  setupExpressServer();
}
