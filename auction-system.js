// ===== نظام المزاد الشامل =====

let allAuctions = [];
let currentAuctionDetail = null;
let auctionImagesData = [];

// ===== دوال المزاد =====
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
      highestBidderName: null,
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
    const { doc, getDoc, setDoc, serverTimestamp, runTransaction } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const auctionRef = doc(db, 'auctions', auctionId);
    const auctionSnap = await getDoc(auctionRef);
    
    if (!auctionSnap.exists()) {
      return { success: false, message: 'المزاد غير موجود' };
    }
    
    const auctionData = auctionSnap.data();
    
    // التحقق من شروط المزايدة
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

async function loadAuctions(db) {
  try {
    const { collection, query, where, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const q = query(collection(db, 'auctions'), where('status', '==', 'active'));
    onSnapshot(q, (snap) => {
      allAuctions = [];
      snap.forEach(doc => {
        allAuctions.push({ id: doc.id, ...doc.data() });
      });
      renderAuctions();
    });
  } catch (err) {
    console.error('Error loading auctions:', err);
  }
}

function renderAuctions() {
  const grid = document.getElementById('auctions-grid');
  if (!grid) return;
  
  if (allAuctions.length === 0) {
    grid.innerHTML = '<div class="empty-state">لا توجد مزادات حالياً</div>';
    return;
  }
  
  grid.innerHTML = '';
  allAuctions.forEach(auction => {
    const card = createAuctionCard(auction);
    grid.appendChild(card);
  });
}

function createAuctionCard(auction) {
  const card = document.createElement('div');
  card.className = 'auction-card' + (auction.bidsCount > 5 ? ' hot' : '');
  
  const timeLeft = getTimeRemaining(auction.endsAt);
  const isHot = auction.bidsCount > 5;
  
  card.innerHTML = `
    <div class="auction-images">
      <div class="auction-image-slider" id="slider-${auction.id}">
        ${auction.images && auction.images.length > 0 
          ? auction.images.map(img => `<div class="auction-image-slide"><img src="${img}" alt="صورة"></div>`).join('')
          : '<div class="auction-image-slide"><div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:48px;">🎮</div></div>'
        }
      </div>
      <div class="auction-image-arrows">
        <button class="auction-arrow" onclick="slideAuction('${auction.id}', -1)">❮</button>
        <button class="auction-arrow" onclick="slideAuction('${auction.id}', 1)">❯</button>
      </div>
      <div class="auction-image-nav">
        ${auction.images && auction.images.length > 1
          ? auction.images.map((_, i) => `<div class="auction-image-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide('${auction.id}', ${i})"></div>`).join('')
          : '<div class="auction-image-dot active"></div>'
        }
      </div>
    </div>
    <div class="auction-body">
      <div class="auction-name">${escapeHTML(auction.name)}</div>
      <div class="auction-game">🎮 ${escapeHTML(auction.game)}</div>
      <div class="auction-stats">
        <div class="auction-stat price">
          <div class="s-val">${auction.currentPrice.toFixed(2)}</div>
          <div class="s-lbl">السعر الحالي</div>
        </div>
        <div class="auction-stat">
          <div class="s-val">${auction.bidsCount}</div>
          <div class="s-lbl">مزايدات</div>
        </div>
        <div class="auction-stat">
          <div class="s-val">${timeLeft.hours}:${timeLeft.mins}</div>
          <div class="s-lbl">الوقت المتبقي</div>
        </div>
      </div>
      <div class="auction-actions">
        <button class="btn-bid" onclick="openAuctionDetail('${auction.id}')">💰 ضع عرض</button>
        <button class="btn-details-auction" onclick="openAuctionDetail('${auction.id}')">📋 التفاصيل</button>
      </div>
    </div>
  `;
  
  return card;
}

function openAuctionDetail(auctionId) {
  const auction = allAuctions.find(a => a.id === auctionId);
  if (!auction) return;
  
  currentAuctionDetail = auction;
  
  document.getElementById('auction-detail-name').textContent = escapeHTML(auction.name);
  document.getElementById('auction-detail-game').textContent = escapeHTML(auction.game);
  document.getElementById('auction-detail-current-price').textContent = `${auction.currentPrice.toFixed(2)} $`;
  document.getElementById('auction-detail-min-price').textContent = `${auction.minPrice.toFixed(2)} $`;
  document.getElementById('auction-detail-bids-count').textContent = auction.bidsCount || 0;
  document.getElementById('auction-detail-seller').textContent = escapeHTML(auction.sellerName);
  document.getElementById('auction-detail-description').textContent = escapeHTML(auction.description);
  
  // عرض الصور
  const imagesDiv = document.getElementById('auction-detail-images');
  if (auction.images && auction.images.length > 0) {
    imagesDiv.innerHTML = auction.images.map(img => `<img src="${img}" style="width:100%; border-radius:12px; margin-bottom:12px;">`).join('');
  }
  
  // تحديث الوقت المتبقي
  updateAuctionTimer(auction);
  
  switchView('view-auction-detail');
}

function updateAuctionTimer(auction) {
  const timerEl = document.getElementById('auction-detail-time-left');
  const updateTimer = () => {
    const timeLeft = getTimeRemaining(auction.endsAt);
    timerEl.textContent = `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.mins}m ${timeLeft.secs}s`;
  };
  updateTimer();
  setInterval(updateTimer, 1000);
}

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

function slideAuction(auctionId, direction) {
  const slider = document.getElementById(`slider-${auctionId}`);
  if (!slider) return;
  
  const slides = slider.querySelectorAll('.auction-image-slide');
  const currentIndex = Array.from(slides).findIndex(s => s.style.transform === 'translateX(0px)' || !s.style.transform);
  const nextIndex = (currentIndex + direction + slides.length) % slides.length;
  
  slider.style.transform = `translateX(-${nextIndex * 100}%)`;
  
  // تحديث النقاط
  const dots = document.querySelectorAll(`[onclick*="goToSlide('${auctionId}"]`);
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === nextIndex);
  });
}

function goToSlide(auctionId, index) {
  const slider = document.getElementById(`slider-${auctionId}`);
  if (!slider) return;
  
  slider.style.transform = `translateX(-${index * 100}%)`;
  
  const dots = document.querySelectorAll(`[onclick*="goToSlide('${auctionId}"]`);
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
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
      
      // تحديث شريط الإعلانات المتحرك
      const track = document.getElementById('paid-ad-ticker-track');
      if (track && data.ticker) {
        track.innerHTML = `<span>${escapeHTML(data.ticker)}</span>`;
        document.getElementById('paid-ad-ticker').style.display = 'block';
      }
      
      if (wrap) wrap.style.display = 'block';
    });
  } catch (err) {
    console.error('Error loading paid ad:', err);
  }
}

function showPaidAdContact() {
  const contactModal = document.getElementById('contact-modal-backdrop');
  if (contactModal) {
    contactModal.classList.add('active');
  }
}

// ===== نظام أكواد الشحن =====
async function redeemRechargeCode(code, db, currentUser) {
  try {
    const { doc, getDoc, setDoc, serverTimestamp, runTransaction } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
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

export {
  createAuction,
  placeBid,
  loadAuctions,
  renderAuctions,
  openAuctionDetail,
  loadPaidAd,
  showPaidAdContact,
  redeemRechargeCode,
  slideAuction,
  goToSlide
};
