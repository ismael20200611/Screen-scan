# Rudaw CG Smart Assistant

ئەم وەشانە MVP ـی سەرەتاییە بۆ Windows، Android و iOS وەک PWA.

## چۆن دەست پێ بکەیت
1. هەموو فایلەکان لە GitHub repository ـێکی نوێ دابنێ.
2. لە Vercel پڕۆژەکە Deploy بکە.
3. لینکەکە لە Windows بە Chrome/Edge، لە Android بە Chrome، و لە iPhone بە Safari بکەرەوە.
4. بۆ کامێرا HTTPS پێویستە؛ Vercel HTTPS دابین دەکات.
5. لە iPhone: Safari > Share > Add to Home Screen.
6. لە Android/Windows: لە نیشانەی Install یان browser menu دامەزراندن هەڵبژێرە.

## گرنگییەکانی وەشانی ئێستا
- کامێرا بە getUserMedia و پشکنینی دەستیی وێنە.
- OCR بە Tesseract.js لە CDN بار دەکرێت؛ بۆ یەکەم بەکارهێنان ئینتەرنێت پێویستە. بەشەکانی PWA دوای بارکردنی سەرەتا offline دەمێننەوە، بەڵام OCR لە offline ـدا تا library و language data پێشتر cache نەکرابن مسۆگەر نییە.
- Tesseract.js پشتگیریی فەرمی و تەواوی OCR بۆ سۆرانی نییە. `ara` تەنها هەڵبژاردەی نزیکە و دەتوانێت هەڵەی خوێندنەوە دروست بکات. بۆ بەرهەمهێنانی پەخشی، دەقی OCR پێویستی بە پشتڕاستکردنەوەی مرۆیی هەیە.
- پشکنینی ناوخۆیی لەم وەشانەدا یاسایەکی سادەیە، نەک مۆدێلی ڕێزمانی سۆرانی. هیچ دەقێک بە خۆکار بە هەڵە ناداتەوە.
- Hybrid AI: URL ـی API ـی خۆت لە Settings دابنێ. API ـەکە دەبێت POST و JSON وەربگرێت: `{ "text":"...", "language":"ckb", "style":"Rudaw broadcast Sorani" }` و وەڵامی `{ "correctedText":"...", "issues":[{"tag":"ڕێزمان","old":"...","next":"...","why":"..."}] }` بداتەوە.
- API key لە frontend مەخە؛ endpoint ـێکی backend/ serverless دروست بکە و کلیلی نهێنی لە environment variables هەڵبگرە.
- بۆ کاری ڕاستەوخۆی پەخش، ئەم MVP ـە وەک یاریدەدەر بەکاربهێنە، نەک وەک سیستەمی بڕیاردانی خۆکار. خێرایی ١–٣ چرکە بە هیچ شێوەیەک مسۆگەر نییە؛ بە مۆبایل، ئینتەرنێت، فۆکەس و خزمەتگوزاری AI دەگۆڕێت.

## ڕێکخستنی OCR
`app.js` هەڵبژاردەی ara و eng هەیە. بۆ کوردی سۆرانی، باشترە داتای OCR ـی تایبەتی سۆرانی یان خزمەتگوزارییەکی OCR کە Sorani پشتیوانی دەکات تاقی بکرێتەوە.
