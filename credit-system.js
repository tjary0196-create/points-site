/**
 * نظام الرصيد الذكي والخصم التلقائي
 * يدعم الخصم بدون نوافذ منبثقة مع عرض سلس للرصيد
 */

class CreditSystem {
  constructor() {
    this.userCredits = this.loadCredits();
    this.subscriptionPlans = {
      free: { name: 'مجاني', monthlyCredits: 50, price: 0, features: ['جودة 480p', 'إعلانات'] },
      basic: { name: 'أساسي', monthlyCredits: 200, price: 9.99, features: ['جودة 720p', 'إعلانات محدودة'] },
      premium: { name: 'مميز', monthlyCredits: 500, price: 19.99, features: ['جودة 1080p', 'بدون إعلانات'] }
    };
    
    this.movieCosts = {
      free: 5,      // فيلم مجاني يكلف 5 نقاط
      standard: 10, // فيلم عادي يكلف 10 نقاط
      premium: 20   // فيلم مميز يكلف 20 نقطة
    };
    
    this.init();
  }

  init() {
    this.createCreditDisplay();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  createCreditDisplay() {
    // إنشاء عنصر عرض الرصيد في الرأس
    const creditDisplay = document.createElement('div');
    creditDisplay.id = 'credit-display';
    creditDisplay.className = 'credit-display';
    creditDisplay.innerHTML = `
      <div class="credit-info">
        <span class="credit-icon">💎</span>
        <span class="credit-amount">${this.userCredits}</span>
        <span class="credit-label">نقطة</span>
      </div>
      <button class="credit-menu-btn">⋮</button>
      <div class="credit-menu" style="display: none;">
        <div class="menu-item subscription-info">
          <strong>الاشتراك الحالي:</strong>
          <span id="current-subscription">مجاني</span>
        </div>
        <button class="menu-item upgrade-btn">ترقية الاشتراك</button>
        <button class="menu-item history-btn">سجل المعاملات</button>
        <button class="menu-item settings-btn">الإعدادات</button>
      </div>
    `;
    
    const header = document.querySelector('header') || document.body;
    header.appendChild(creditDisplay);
    
    this.creditDisplay = creditDisplay;
    this.creditAmount = creditDisplay.querySelector('.credit-amount');
    this.creditMenu = creditDisplay.querySelector('.credit-menu');
    this.creditMenuBtn = creditDisplay.querySelector('.credit-menu-btn');
    
    // إضافة مستمعي الأحداث
    this.creditMenuBtn.addEventListener('click', () => this.toggleMenu());
    document.addEventListener('click', (e) => {
      if (!creditDisplay.contains(e.target)) {
        this.creditMenu.style.display = 'none';
      }
    });
  }

  toggleMenu() {
    this.creditMenu.style.display = 
      this.creditMenu.style.display === 'none' ? 'flex' : 'none';
  }

  /**
   * خصم الرصيد عند مشاهدة فيلم
   * بدون نوافذ منبثقة - خصم سلس وتلقائي
   */
  async deductCreditsForMovie(movieId, movieType = 'standard') {
    const cost = this.movieCosts[movieType] || this.movieCosts.standard;
    
    // التحقق من وجود رصيد كافي
    if (this.userCredits < cost) {
      this.showInsufficientCreditsNotification(cost - this.userCredits);
      return false;
    }
    
    // خصم الرصيد بسلاسة
    this.userCredits -= cost;
    this.saveCredits();
    this.updateCreditDisplay();
    
    // إضافة تأثير بصري سلس
    this.animateCreditDeduction(cost);
    
    // حفظ المعاملة
    this.recordTransaction({
      type: 'deduction',
      amount: cost,
      movieId: movieId,
      timestamp: new Date(),
      description: `مشاهدة فيلم - ${movieType}`
    });
    
    // إرسال إشعار سلس بدون مقاطعة
    this.showSmoothNotification(`تم خصم ${cost} نقطة`, 'success');
    
    return true;
  }

  /**
   * إضافة رصيد (للاشتراكات أو العروض)
   */
  addCredits(amount, reason = 'إضافة رصيد') {
    this.userCredits += amount;
    this.saveCredits();
    this.updateCreditDisplay();
    
    this.animateCreditAddition(amount);
    this.showSmoothNotification(`تمت إضافة ${amount} نقطة`, 'success');
    
    this.recordTransaction({
      type: 'addition',
      amount: amount,
      timestamp: new Date(),
      description: reason
    });
  }

  /**
   * تحديث الاشتراك
   */
  upgradeSubscription(planName) {
    const plan = this.subscriptionPlans[planName];
    if (!plan) return false;
    
    this.currentPlan = planName;
    this.userCredits = plan.monthlyCredits;
    this.saveCredits();
    this.updateCreditDisplay();
    
    this.showSmoothNotification(`تم الترقية إلى ${plan.name}`, 'success');
    
    this.recordTransaction({
      type: 'subscription',
      planName: planName,
      amount: plan.monthlyCredits,
      timestamp: new Date(),
      description: `ترقية إلى ${plan.name}`
    });
    
    return true;
  }

  /**
   * التحقق من الرصيد الكافي
   */
  hasEnoughCredits(movieType = 'standard') {
    const cost = this.movieCosts[movieType] || this.movieCosts.standard;
    return this.userCredits >= cost;
  }

  /**
   * الحصول على معلومات الفيلم (التكلفة والنوع)
   */
  getMovieCost(movieType = 'standard') {
    return this.movieCosts[movieType] || this.movieCosts.standard;
  }

  /**
   * تحديث عرض الرصيد
   */
  updateCreditDisplay() {
    this.creditAmount.textContent = this.userCredits;
    this.creditAmount.style.animation = 'creditPulse 0.6s ease-out';
    
    setTimeout(() => {
      this.creditAmount.style.animation = '';
    }, 600);
  }

  /**
   * تأثير بصري لخصم الرصيد
   */
  animateCreditDeduction(amount) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-credit-text deduction';
    floatingText.textContent = `-${amount}`;
    floatingText.style.cssText = `
      position: fixed;
      top: ${this.creditDisplay.offsetTop + 10}px;
      right: ${window.innerWidth - this.creditDisplay.offsetLeft - 50}px;
      color: #ff4444;
      font-weight: bold;
      font-size: 18px;
      pointer-events: none;
      z-index: 10000;
      animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
  }

  /**
   * تأثير بصري لإضافة الرصيد
   */
  animateCreditAddition(amount) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-credit-text addition';
    floatingText.textContent = `+${amount}`;
    floatingText.style.cssText = `
      position: fixed;
      top: ${this.creditDisplay.offsetTop + 10}px;
      right: ${window.innerWidth - this.creditDisplay.offsetLeft - 50}px;
      color: #44ff44;
      font-weight: bold;
      font-size: 18px;
      pointer-events: none;
      z-index: 10000;
      animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
  }

  /**
   * إشعار سلس بدون مقاطعة
   */
  showSmoothNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `smooth-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${this.getNotificationBg(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideInRight 0.4s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.4s ease-out';
      setTimeout(() => notification.remove(), 400);
    }, 3000);
  }

  /**
   * إشعار رصيد غير كافي
   */
  showInsufficientCreditsNotification(needed) {
    const notification = document.createElement('div');
    notification.className = 'insufficient-credits-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h3>رصيد غير كافي</h3>
        <p>تحتاج إلى ${needed} نقطة إضافية</p>
        <button class="upgrade-now-btn">ترقية الآن</button>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b, #ff4444);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255,68,68,0.3);
      z-index: 10000;
      animation: slideInRight 0.4s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.upgrade-now-btn').addEventListener('click', () => {
      this.showUpgradeModal();
      notification.remove();
    });
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.4s ease-out';
      setTimeout(() => notification.remove(), 400);
    }, 5000);
  }

  /**
   * عرض نافذة الترقية
   */
  showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-btn">×</button>
        <h2>اختر خطتك المفضلة</h2>
        <div class="plans-grid">
          ${Object.entries(this.subscriptionPlans).map(([key, plan]) => `
            <div class="plan-card">
              <h3>${plan.name}</h3>
              <p class="price">${plan.price === 0 ? 'مجاني' : `$${plan.price}/شهر`}</p>
              <p class="credits">${plan.monthlyCredits} نقطة شهرياً</p>
              <ul class="features">
                ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
              </ul>
              <button class="select-plan-btn" data-plan="${key}">اختيار</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.select-plan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.upgradeSubscription(btn.dataset.plan);
        modal.remove();
      });
    });
  }

  /**
   * حفظ الرصيد في LocalStorage
   */
  saveCredits() {
    localStorage.setItem('userCredits', JSON.stringify({
      amount: this.userCredits,
      plan: this.currentPlan || 'free',
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * تحميل الرصيد من LocalStorage
   */
  loadCredits() {
    const saved = localStorage.getItem('userCredits');
    if (saved) {
      const data = JSON.parse(saved);
      this.currentPlan = data.plan || 'free';
      return data.amount || 50;
    }
    return 50; // رصيد افتراضي
  }

  /**
   * تسجيل المعاملات
   */
  recordTransaction(transaction) {
    let transactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
    transactions.unshift(transaction);
    transactions = transactions.slice(0, 100); // الاحتفاظ بآخر 100 معاملة
    localStorage.setItem('creditTransactions', JSON.stringify(transactions));
  }

  /**
   * الحصول على سجل المعاملات
   */
  getTransactionHistory() {
    return JSON.parse(localStorage.getItem('creditTransactions') || '[]');
  }

  /**
   * دوال مساعدة
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  }

  getNotificationBg(type) {
    const colors = {
      success: '#44aa44',
      error: '#ff4444',
      warning: '#ffaa00',
      info: '#4488ff'
    };
    return colors[type] || '#4488ff';
  }

  /**
   * تحديث تلقائي للرصيد
   */
  startAutoRefresh() {
    setInterval(() => {
      this.updateCreditDisplay();
    }, 60000); // كل دقيقة
  }
}

// إنشاء نسخة عامة من النظام
const creditSystem = new CreditSystem();
