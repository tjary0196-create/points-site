// ============================================================
// ملف: functions/index.js
// الوظيفة: التحقق من توقيع تلغرام (Telegram Login Widget)
// وإصدار Firebase Custom Token حتى يقدر المستخدم يسجّل دخول
// بالموقع باستخدام حسابه بتلغرام.
// ============================================================
//
// طريقة النشر (خطوة بخطوة):
// 1) ثبّت Firebase CLI من جهازك (أو Termux):
//      npm install -g firebase-tools
// 2) سجّل دخول:
//      firebase login
// 3) داخل مجلد مشروعك:
//      firebase init functions
//    اختر المشروع "my-websit-2e275"، اختر JavaScript
// 4) استبدل ملف functions/index.js بهذا الكود
// 5) ثبّت المكتبات داخل مجلد functions:
//      cd functions
//      npm install firebase-admin firebase-functions
// 6) رجّع لمجلد المشروع الرئيسي وفعّل خطة Blaze (مدفوعة عند الاستخدام،
//    فيها حد مجاني كبير وما رح يكلفك شي بهاي المرحلة):
//      من Firebase Console > Settings > Usage and billing > Upgrade
// 7) انشر:
//      firebase deploy --only functions
//
// ============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

// 🔧 ضع توكن البوت الحقيقي هنا (تحصل عليه من BotFather)
// الأفضل تخزينه كمتغير بيئة بدل كتابته مباشرة:
// firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
const BOT_TOKEN = functions.config().telegram?.bot_token || "8872873864:AAHK6SJ4M2nsakg_yROnE39PvNTRsl8ZEAo";

/**
 * يتحقق من صحة hash توقيع تلغرام حسب الخوارزمية الرسمية:
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramHash(data) {
  const { hash, ...fields } = data;

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
}

exports.verifyTelegramLogin = functions.https.onCall(async (data, context) => {
  // 1) تحقق من التوقيع
  const isValid = verifyTelegramHash(data);
  if (!isValid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "توقيع تلغرام غير صحيح"
    );
  }

  // 2) تحقق إنه التسجيل ما هو قديم (حماية من إعادة استخدام الرابط)
  const authDate = parseInt(data.auth_date, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    throw new functions.https.HttpsError(
      "deadline-exceeded",
      "انتهت صلاحية تسجيل الدخول، حاول مرة ثانية"
    );
  }

  const telegramId = String(data.id);
  const uid = `tg_${telegramId}`;

  const userRef = admin.firestore().collection("users").doc(uid);
  const userSnap = await userRef.get();

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ");

  if (!userSnap.exists) {
    // مستخدم جديد - أنشئ سجله الأساسي
    let referredBy = null;
    if (data.start_param && data.start_param.startsWith("ref_")) {
      referredBy = data.start_param.replace("ref_", "");
    }

    await userRef.set({
      telegramId,
      username: data.username || null,
      name: fullName || "مستخدم تلغرام",
      photoUrl: data.photo_url || null,
      points: 0,
      tasksDoneToday: 0,
      referralCount: 0,
      referredBy: referredBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // إذا انضم عن طريق إحالة، زيد للمُحيل 10 نقاط وعداد الإحالات
    if (referredBy) {
      const referrerRef = admin.firestore().collection("users").doc(referredBy);
      const referrerSnap = await referrerRef.get();
      if (referrerSnap.exists) {
        await referrerRef.update({
          points: admin.firestore.FieldValue.increment(10),
          referralCount: admin.firestore.FieldValue.increment(1),
        });
      }
    }
  } else {
    // مستخدم موجود - حدّث بياناته فقط
    await userRef.update({
      username: data.username || null,
      name: fullName || userSnap.data().name,
      photoUrl: data.photo_url || null,
    });
  }

  // 3) أصدر Firebase custom token مرتبط بنفس uid
  const customToken = await admin.auth().createCustomToken(uid);

  return { token: customToken };
});

// ============================================================
// وظيفة اختيارية: تصفير نقاط "مهام اليوم" كل منتصف ليل
// (تحتاج جدولة Cloud Scheduler - تعمل تلقائياً مع Firebase Functions v2)
// ============================================================
exports.resetDailyTasks = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Damascus")
  .onRun(async () => {
    const usersSnap = await admin.firestore().collection("users").get();
    const batch = admin.firestore().batch();
    usersSnap.forEach((doc) => {
      batch.update(doc.ref, { tasksDoneToday: 0 });
    });
    await batch.commit();
    console.log(`تم تصفير مهام ${usersSnap.size} مستخدم`);
  });
