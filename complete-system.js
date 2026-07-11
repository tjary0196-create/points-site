// ===== نظام شامل للمزاد والملف الشخصي والمستويات والإعلانات والأكواد =====

// ===== دوال مساعدة عامة =====
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmt(usdAmount, currency = 'SYR', exchangeRate = 15000) {
  const n = Number(usdAmount) || 0;
  if (currency === 'USD') return n.toFixed(2) + ' $';
  return Math.round(n * exchangeRate).toLocaleString('en-US') + ' ل.س';
}

function showToast(msg, isError = false) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${isError ? '#B4543A' : '#D4A24C'}; color:#1A140A; padding:14px 24px; border-radius:16px; font-weight:bold; box-shadow:0 8px 20px rgba(0,0,0,0.6); z-index:1000; opacity:0; transition:0.3s;`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = '1');
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}

// ===== نظام الملف الشخصي =====
async function loadUserProfile(uid, db) {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (err) {
    console.error('Error loading profile:', err);
    return null;
  }
}

async function updateUserProfile(uid, profileData, db) {
  try {
    const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function checkUsernameAvailability(username, db) {
  if (!username || username.length < 3 || username.length > 20) {
    return { available: false, message: 'اليوزرنيم يجب أن يكون بين 3 و 20 حرف' };
  }
  
  try {
    const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { available: true, message: '✅ اليوزرنيم متاح' };
    } else {
      return { available: false, message: '❌ اليوزرنيم مستخدم بالفعل' };
    }
  } catch (err) {
    return { available: false, message: 'حدث خطأ في التحقق' };
  }
}

// ===== نظام المزاد =====
async function createAuction(auctionData, db, currentUser) {
  try {
    const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const auctionRef = await addDoc(collection(db, 'auctions'), {
      ...auctionData,
      sellerId: currentUser.uid,
      sellerName: currentUser.displayName,
      sellerEmail: currentUser.email,
      currentPrice: auctionData.startPrice,
      highestBidderId: null,
      bidsCount: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      endsAt: new Date(Date.now() + auctionData.duration * 3600000),
      images: auctionData.images || []
    });
    
    return { success: true, auctionId: auctionRef.id };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function placeBid(auctionId, bidAmount, db, currentUser) {
  try {
    const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const auctionRef = doc(db, 'auctions', auctionId);
    const auctionSnap = await getDoc(auctionRef);
    
    if (!auctionSnap.exists()) {
      return { success: false, message: 'المزاد غير موجود' };
    }
    
    const auctionData = auctionSnap.data();
    
    if (auctionData.status !== 'active') {
      return { success: false, message: 'المزاد غير نشط' };
    }
    
    if (new Date(auctionData.endsAt) < new Date()) {
      return { success: false, message: 'انتهى وقت المزاد' };
    }
    
    if (bidAmount <= auctionData.currentPrice) {
      return { success: false, message: `يجب أن يكون العرض أكثر من ${auctionData.currentPrice}` };
    }
    
    if (bidAmount < auctionData.minPrice) {
      return { success: false, message: `السعر الأدنى المقبول هو ${auctionData.minPrice}` };
    }
    
    // تسجيل المزايدة
    await setDoc(doc(db, 'auctions', auctionId, 'bids', currentUser.uid), {
      bidderId: currentUser.uid,
      bidderName: currentUser.displayName,
      bidAmount,
      bidTime: serverTimestamp()
    });
    
    // تحديث المزاد
    await setDoc(auctionRef, {
      currentPrice: bidAmount,
      highestBidderId: currentUser.uid,
      highestBidderName: currentUser.displayName,
      bidsCount: (auctionData.bidsCount || 0) + 1
    }, { merge: true });
    
    return { success: true, message: 'تم تسجيل العرض بنجاح' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ===== نظام المستويات =====
const LOYALTY_LEVELS = {
  bronze: { name: 'برونزي 🥉', minSpent: 0, maxSpent: 50 },
  silver: { name: 'فضي 🥈', minSpent: 50, maxSpent: 150 },
  gold: { name: 'ذهبي 🏆', minSpent: 150, maxSpent: Infinity }
};

function getLoyaltyLevel(totalSpent) {
  if (totalSpent >= 150) return 'gold';
  if (totalSpent >= 50) return 'silver';
  return 'bronze';
}

function calculateLoyaltyProgress(totalSpent) {
  const level = getLoyaltyLevel(totalSpent);
  const levelInfo = LOYALTY_LEVELS[level];
  const nextLevel = level === 'gold' ? 'gold' : (level === 'silver' ? 'gold' : 'silver');
  const nextLevelInfo = LOYALTY_LEVELS[nextLevel];
  
  const currentMin = levelInfo.minSpent;
  const currentMax = levelInfo.maxSpent;
  const progress = Math.min(100, Math.max(0, ((totalSpent - currentMin) / (currentMax - currentMin)) * 100));
  
  return {
    level,
    levelName: levelInfo.name,
    progress,
    nextLevel,
    nextLevelName: nextLevelInfo.name,
    remaining: Math.max(0, nextLevelInfo.minSpent - totalSpent)
  };
}

// ===== نظام أكواد الشحن =====
async function redeemRechargeCode(code, db, currentUser) {
  try {
    const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const codeRef = doc(db, 'rechargeCodes', code);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return { success: false, message: 'الكود غير صحيح' };
    }
    
    const codeData = codeSnap.data();
    if (codeData.used) {
      return { success: false, message: 'الكود تم استخدامه بالفعل' };
    }
    
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return { success: false, message: 'الكود انتهت صلاحيته' };
    }
    
    // تحديث الكود كمستخدم
    await setDoc(codeRef, {
      used: true,
      usedBy: currentUser.uid,
      usedAt: serverTimestamp()
    }, { merge: true });
    
    // إضافة الرصيد للمستخدم
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.data()?.balance || 0;
    
    await setDoc(userRef, {
      balance: currentBalance + codeData.amount,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { 
      success: true, 
      amount: codeData.amount,
      message: `✅ تم إضافة ${codeData.amount} $ إلى رصيدك` 
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ===== نظام الإعلانات المدفوعة =====
async function loadPaidAd(db) {
  try {
    const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    onSnapshot(doc(db, 'settings', 'paidAd'), (snap) => {
      const wrap = document.getElementById('paid-ad-wrap');
      if (!snap.exists() || !snap.data().imageData) {
        if (wrap) wrap.style.display = 'none';
        return;
      }
      
      const data = snap.data();
      const img = document.getElementById('paid-ad-image');
      const link = document.getElementById('paid-ad-link');
      
      if (img) img.src = data.imageData;
      if (link) {
        const safeLink = /^https?:\/\//i.test(data.link) ? data.link : '#';
        link.href = safeLink;
      }
      
      if (wrap) wrap.style.display = 'block';
    });
  } catch (err) {
    console.error('Error loading paid ad:', err);
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
    return { valid: false, message: 'حدث خطأ في التحقق' };
  }
}

// ===== دوال مساعدة للمزاد =====
function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, mins: 0, secs: 0 };
  }
  
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000)
  };
}

function generateAuctionId() {
  return 'AUC_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateRechargeCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===== تصدير الدوال =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHTML,
    fmt,
    showToast,
    loadUserProfile,
    updateUserProfile,
    checkUsernameAvailability,
    createAuction,
    placeBid,
    LOYALTY_LEVELS,
    getLoyaltyLevel,
    calculateLoyaltyProgress,
    redeemRechargeCode,
    loadPaidAd,
    compressImage,
    validateReferralCode,
    getTimeRemaining,
    generateAuctionId,
    generateRechargeCode
  };
}
