# Week 1

## Day 1 · MyMedicalHub story · Finite state machine

```text
৪০টার বেশি useEffect মুছে দিয়েছিলাম। আমার এখন পর্যন্ত সবচেয়ে ভালো refactor ছিল ওটা।

আমাদের biometric assessment flow এ browser এর ভেতরে একসাথে চলে MediaPipe pose detection, WebRTC video recording আর audio instruction। পুরোটা সামলানো হচ্ছিল useState আর useEffect এর chain দিয়ে, সাথে ১০টা boolean flag।

ফল যা হওয়ার তাই হলো। Race condition। কোন flag কখন বদলাচ্ছে কেউ নিশ্চিত না। একটা flag ভুল সময়ে বদলালে recording ভাঙে, আর recording ভাঙা মানে একজন patient এর assessment data হারানো।

সমস্যাটা developer দের ছিল না, ছিল paradigm এ। ১০টা state, ১৯টা event আর 60 FPS এ চলা pose detection, এই বাস্তবতা dependency array দিয়ে model করা যায় না।

তাই পুরো flow টা একটা finite state machine এ নিয়ে গেলাম। একটা pure reducer সব transition handle করে। প্রতিটা state explicit, প্রতিটা event এর নাম আছে, প্রতিটা transition guard করা।

যে bug খুঁজতে আগে পাঁচটা component জুড়ে তিন ঘণ্টা লাগত, এখন লাগে কয়েক মিনিট। State chart টাই এখন documentation। আর এখন ৯৯.৯% assessment session crash বা freeze ছাড়া শেষ হয়।

সব জায়গায় state machine লাগে না। কিন্তু যেখানে একটা state bug এর দাম কারো data, সেখানে "সম্ভবত ঠিক আছে" যথেষ্ট না।
```

**Scheduled:** not scheduled (removed from LinkedIn)

**First comment:** `পুরো লেখাটা, state chart আর detection bridge pattern সহ: https://montasim.dev/blog/from-useeffect-chaos-to-deterministic-systems?lang=bn`

---

## Day 2 · Short

```text
Pull request merge হয়েছে মানে feature টা user এর কাছে পৌঁছেছে, এমন না।

Merge, build, deploy আর production এ যাচাই, চারটা আলাদা ঘটনা। Ticket বন্ধ করার আগে শেষটা নিজের চোখে দেখে নিন।
```

**Scheduled:** Mon, Nov 2, 2026, 9:00 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/a-merged-pull-request-is-not-a-deployed-feature?lang=bn`

---

## Day 3 · Side product · Giftbook

```text
বিয়ে, আকিকা বা জন্মদিনে কে কত টাকা উপহার দিল, বেশিরভাগ পরিবারে সেটা লেখা থাকে একটা খাতায়। খাতা হারায়, খোঁজা যায় না, আর একসাথে দুজন লিখতে পারে না।

এটার জন্য Giftbook বানালাম। কিন্তু শুরুতেই একটা সিদ্ধান্ত নিলাম, আমার কোনো server থাকবে না।

পরিবারের টাকার হিসাব একটা অচেনা app এর database এ থাকা উচিত না। তাই পুরো ledger থাকে owner এর নিজের Google Sheet এ। App শুধু drive.file scope চায়, মানে যে file টা সে নিজে বানিয়েছে শুধু সেটাই দেখতে পারে, Drive এর বাকি কিছু না।

বিয়েবাড়িতে network থাকে না। তাই entry আগে phone এ লেখা হয় (Dexie, IndexedDB), পরে sheet এ sync হয়। একই row দুজন বদলালে last-write-wins, আর delete করা row মুছে যায় না, deletedAt দিয়ে চিহ্ন দেওয়া থাকে।

সবচেয়ে কাজের guard টা ছিল সবচেয়ে সাধারণ। মানুষ sheet টা হাতেও edit করবে। কেউ যদি column এর header বদলে ফেলে, app sync বন্ধ করে দেয় আর Bangla তে পরিষ্কার জানায়, ভুল data লেখার বদলে।

আর পুরো interface Bangla তে, সংখ্যা, তারিখ, লাখ-হাজার এর comma সহ।

সবচেয়ে নিরাপদ data হলো যেটা কখনো আপনার server এ আসেনি।
```

**Scheduled:** Tue, Nov 3, 2026, 9:00 AM (Bangladesh time)

**First comment:** `কীভাবে sync engine আর Google mock বানিয়েছি: https://montasim.dev/blog/a-family-gift-ledger-that-lives-in-your-own-google-sheet?lang=bn`

---

## Day 4 · Production lesson · Telemedicine

```text
একটা video call আর একটা clinical workflow এক জিনিস না। এটা বুঝেছি দুটো bug ঠিক করতে গিয়ে।

প্রথম bug: patient এক exercise শেষ করে পরেরটায় গেলে, আগের exercise এর recording preview আবার দেখা যাচ্ছিল। একটা clinical system এ ভুল movement এর video ভুল জায়গায় দেখানো ছোট সমস্যা না।

দ্বিতীয় bug: provider session ছেড়ে গেলে patient একটা loading screen এ আটকে থাকত। কেউ আসছে না, কিছু হচ্ছেও না।

দুটোর কারণ একই। আমরা state কে video call এর জিনিস ভেবেছিলাম, workflow এর না।

ঠিক করলাম এভাবে:
Exercise বদলালে সেই exercise এর সব media, প্রশ্ন আর movement state reset হয়। আগের কিছু পরের কাজে ঢুকতে পারে না।
Socket, media, recording আর error, প্রতিটার আলাদা React context। একটা high-frequency জিনিস পুরো room এর মালিক হয়ে বসে না।
Provider চলে যাওয়া, connection কেটে যাওয়া, API fail করা, এগুলোকে error না ভেবে product state বানালাম। প্রতিটার একটা পরিষ্কার message আর পরের ধাপ আছে।

Real-time app এ happy path টা সহজ অংশ। আসল product টা হলো, কেউ চলে গেলে কী হয়।
```

**Scheduled:** not scheduled (removed from LinkedIn)

**First comment:** `https://montasim.dev/blog/a-video-call-is-not-a-clinical-workflow?lang=bn`

---

## Day 5 · Checklist · Link previews

```text
Page browser এ একদম ঠিক দেখাচ্ছে, কিন্তু LinkedIn এ link share করলে card টা ভাঙা। কারণ প্রায় সবসময় এই পাঁচটার একটা:

১. og:title, og:image JavaScript দিয়ে বসানো। Crawler JS চালায় না, সে শুধু server থেকে আসা HTML পড়ে।

২. og:image এর URL relative। "/og.png" crawler এর কাছে কিছুই না, পুরো https URL লাগে।

৩. Image ছোট, বা extension .png কিন্তু ভেতরে অন্য format। 1200×630 রাখুন, আর file এর আসল bytes যাচাই করুন, নাম না।

৪. Image টা login, redirect বা robots rule এর পেছনে। Browser এ খোলে কারণ আপনি logged in, crawler এর কাছে খোলে না।

৫. সব ঠিক, কিন্তু platform এর cache এ পুরনো card। LinkedIn Post Inspector দিয়ে refresh করুন।

প্রথম চারটা আপনার code এর সমস্যা, পাঁচ নম্বরটা platform এর। কোনটা কোনটা, আগে আলাদা করুন, নইলে ঠিক জিনিসটাই বারবার "fix" করবেন।

Browser যা দেখে, crawler তা দেখে না।
```

**Scheduled:** Wed, Nov 4, 2026, 9:00 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/when-the-page-is-right-but-the-link-card-is-wrong?lang=bn`

---

## Day 6 · Client work · Liftuno

```text
একটা gym software যদি নিজে থেকে কারো নামে বকেয়া বানিয়ে দেয়, সেটা bug, feature না।

Liftuno বানাচ্ছি, বাংলাদেশের gym গুলোর জন্য একটা management platform। এখানে member, payment আর attendance এর হিসাব এখনো চলে খাতায় বা staff এর মাথায়।

সাধারণ software এর logic হয়, প্রতি মাসে automatic একটা fee বসাও। কিন্তু বাস্তবে একজন member তিন মাস না এলে সে তিন মাসের টাকা দেনা না। সে শুধু আসেনি।

তাই model টা বদলালাম। Member টাকা দিলে একটা coverage পায়। Coverage শেষ হলে নতুন কোনো charge তৈরি হয় না। সে আবার এলে তখন পরের payable period শুরু হয়। Inactive থাকা আর টাকা বাকি থাকা, দুটো আলাদা জিনিস হিসেবে থাকে।

আরো দুটো জিনিস শুরু থেকে রেখেছি:
Payment আর attendance command idempotent। Network খারাপ হয়ে request দুবার গেলেও দুবার টাকা বা দুটো check-in তৈরি হয় না।
কে কোন gym এর data দেখতে পারবে, সেটা backend ঠিক করে, UI না।

Software এর কাজ বাস্তবতা ধরে রাখা। Calendar দিয়ে নতুন বাস্তবতা বানানো না।
```

**Scheduled:** not scheduled (removed from LinkedIn)

**First comment:** `https://montasim.dev/blog/gym-membership-debt-cannot-be-invented-by-a-calendar?lang=bn`

---

## Day 7 · Career · Code review

```text
আমাদের team এ একটা code review process চালু করার পর একটা জিনিস বুঝলাম। ভালো review মানে বেশি comment না, ঠিক জায়গায় comment।

শুরুতে review মানে ছিল naming, formatting, একটা function এর জায়গা বদলানো। এগুলো দরকারি, কিন্তু এগুলো linter আর prettier এর কাজ। মানুষের সময় যায় সেখানে, যেটা machine ধরতে পারে না।

এখন আমি একটা PR এ প্রথমে তিনটা প্রশ্ন করি:

এটা fail করলে কী হয়? Network কাটলে, API ভুল data দিলে, user মাঝপথে চলে গেলে।
এখানে কোন state বদলাচ্ছে, আর পুরনো state কি পরের কাজে ঢুকে পড়তে পারে?
কোন resource খোলা হচ্ছে, camera, socket, timer, recorder, আর সেটা কোথায় বন্ধ হচ্ছে?

এই তিনটা প্রশ্নের উত্তর না থাকলে, code যত সুন্দরই হোক, merge হয় না।

আর comment লিখি প্রশ্ন হিসেবে, রায় হিসেবে না। "এটা ভুল" লিখলে মানুষ নিজেকে রক্ষা করে। "provider চলে গেলে এখানে কী হবে?" লিখলে মানুষ ভাবে।

Review এর লক্ষ্য code টা ঠিক করা না। পরের PR টা আরো ভালো হওয়া।
```

**Scheduled:** Thu, Nov 5, 2026, 9:00 AM (Bangladesh time)

**First comment:** `Review এ যে প্রশ্নটা করি, সেটা একটা আসল bug থেকে এসেছিল: https://montasim.dev/blog/a-video-call-is-not-a-clinical-workflow?lang=bn`
