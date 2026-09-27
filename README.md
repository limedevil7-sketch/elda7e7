# ويبسايت الدحيح

## الملفات

- index.html: الموقع وسكربت Firebase وSupabase مدموجة في ملف واحد.
- firebase.json وfirestore.rules: إعداد Firebase والأسئلة المشتركة.
- supabase-setup.sql: إنشاء جداول المواد ورسائل منشئ الموقع وسياساتها.

## إعداد Supabase

1. استخدم bucket باسم elday7e7 واجعله Public.
2. تأكد من وجود مستخدم المسؤول limedevil7@gmail.com في Supabase Authentication.
3. شغّل supabase-setup.sql في Supabase SQL Editor. يمكن إعادة تشغيله لتحديث الإعداد بأمان.
4. رسائل الطلاب لمنشئ الموقع تُحفظ في جدول creator_messages. الإرسال متاح للطلاب، والقراءة والرد للمسؤول المسجل بالبريد أعلاه.

## إعداد Firebase

فعّل Anonymous Authentication وCloud Firestore، وأضف نطاق GitHub Pages ضمن Authorized domains، وانشر firestore.rules من Firebase Console. Firebase مسؤول عن الأسئلة والردود العامة؛ الرسائل الخاصة للمنشئ تعمل عبر Supabase.

## النشر

استبدل index.html في GitHub Pages. شغّل supabase-setup.sql مرة واحدة في SQL Editor لتفعيل جدول الرسائل الجديد. لا يلزم تعديل قواعد Firestore لصندوق الرسائل.
