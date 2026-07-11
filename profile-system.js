// ===== نظام الملف الشخصي والمستويات والمزاد والإعلانات المدفوعة =====

// نظام المستويات
const LOYALTY_LEVELS = {
  bronze: { name: 'برونزي 🥉', minSpent: 0, maxSpent: 50, color: '#cd7f32', icon: '🥉' },
  silver: { name: 'فضي 🥈', minSpent: 50, maxSpent: 150, color: '#c0c0c0', icon: '🥈' },
  gold: { name: 'ذهبي 🏆', minSpent: 150, maxSpent: Infinity, color: '#d4a24c', icon: '🏆' }
};

function getLoyaltyLevel(totalSpent) {
  if (totalSpent >= 150) return 'gold';
  if (totalSpent >= 50) return 'silver';
  return 'bronze';
}

function getLoyaltyInfo(level) {
  return LOYALTY_LEVELS[level] || LOYALTY_LEVELS.bronze;
}

// ===== نظام اليوزرنيم الفريد =====
async function checkUsernameAvailability(username, db) {
  if (!username || username.length < 3 || username.length > 20) {
    return { available: false, message: 'اليوزرنيم يجب أن يكون بين 3 و 20 حرف' };
  }
  
  // التحقق من أن اليوزرنيم يحتوي على أحرف وأرقام فقط
  if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username)) {
    return { available: false, message: 'اليوزرنيم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط' };
  }

  try {
    const { query, where, getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { available: true, message: '✅ اليوزرنيم متاح' };
    } else {
      return { available: false, message: '❌ اليوزرنيم مستخدم بالفعل' };
    }
  } catch (err) {
    console.error('Error checking username:', err);
    return { available: false, message: 'حدث خطأ في التحقق' };
  }
}

// ===== نظام رفع الصور =====
function compressImage(file, maxWidth = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== نظام المزاد (Auction System) =====
const AUCTION_STATUS = {
  active: 'نشط',
  pending: 'قيد المراجعة',
  sold: 'مباع',
  closed: 'مغلق'
};

// ===== نظام الإعلانات المدفوعة =====
const PAID_AD_TYPES = {
  banner: 'إعلان بانر',
  featured: 'منتج مميز',
  popup: 'نافذة منبثقة'
};

// ===== نظام أكواد الشحن (Recharge Codes) =====
async function validateRechargeCode(code, db) {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const codeRef = doc(db, 'rechargeCodes', code);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return { valid: false, message: 'الكود غير صحيح' };
    }
    
    const codeData = codeSnap.data();
    if (codeData.used) {
      return { valid: false, message: 'الكود تم استخدامه بالفعل' };
    }
    
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return { valid: false, message: 'الكود انتهت صلاحيته' };
    }
    
    return { 
      valid: true, 
      amount: codeData.amount,
      message: `✅ الكود صحيح - رصيد: ${codeData.amount} $`
    };
  } catch (err) {
    console.error('Error validating code:', err);
    return { valid: false, message: 'حدث خطأ في التحقق' };
  }
}

// ===== دالة تحديث ملف المستخدم الشخصي =====
async function updateUserProfile(uid, profileData, db) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const userRef = doc(db, 'users', uid);
    
    await setDoc(userRef, profileData, { merge: true });
    return { success: true, message: 'تم حفظ البيانات بنجاح' };
  } catch (err) {
    console.error('Error updating profile:', err);
    return { success: false, message: 'حدث خطأ: ' + err.message };
  }
}

// ===== دالة تحميل ملف المستخدم الشخصي =====
async function loadUserProfile(uid, db) {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (err) {
    console.error('Error loading profile:', err);
    return null;
  }
}

// ===== نظام الإحالة المحسّن =====
async function validateReferralCode(code, db, currentUid) {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const codeRef = doc(db, 'referralCodes', code);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return { valid: false, message: 'كود الإحالة غير صحيح' };
    }
    
    const referrerUid = codeSnap.data().uid;
    if (referrerUid === currentUid) {
      return { valid: false, message: 'لا يمكنك استخدام كودك الخاص' };
    }
    
    return { valid: true, referrerUid, message: 'كود الإحالة صحيح' };
  } catch (err) {
    console.error('Error validating referral code:', err);
    return { valid: false, message: 'حدث خطأ في التحقق' };
  }
}

// ===== دالة إنشاء كود مزاد فريد =====
function generateAuctionId() {
  return 'AUC_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===== دالة إنشاء كود شحن فريد =====
function generateRechargeCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===== دالة حساب مستوى الولاء من الإنفاق =====
function calculateLoyaltyProgress(totalSpent) {
  const level = getLoyaltyLevel(totalSpent);
  const levelInfo = getLoyaltyInfo(level);
  const nextLevel = level === 'gold' ? 'gold' : (level === 'silver' ? 'gold' : 'silver');
  const nextLevelInfo = getLoyaltyInfo(nextLevel);
  
  const currentMin = levelInfo.minSpent;
  const currentMax = levelInfo.maxSpent;
  const progress = Math.min(100, Math.max(0, ((totalSpent - currentMin) / (currentMax - currentMin)) * 100));
  
  return {
    level,
    levelName: levelInfo.name,
    progress,
    nextLevel,
    nextLevelName: nextLevelInfo.name,
    nextLevelRequired: nextLevelInfo.minSpent,
    remaining: Math.max(0, nextLevelInfo.minSpent - totalSpent)
  };
}

export {
  LOYALTY_LEVELS,
  AUCTION_STATUS,
  PAID_AD_TYPES,
  getLoyaltyLevel,
  getLoyaltyInfo,
  checkUsernameAvailability,
  compressImage,
  validateRechargeCode,
  updateUserProfile,
  loadUserProfile,
  validateReferralCode,
  generateAuctionId,
  generateRechargeCode,
  calculateLoyaltyProgress
};
