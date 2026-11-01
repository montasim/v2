# Week 2

## Day 1 · MyMedicalHub story · Replacing a video vendor

```text
যত বেশি patient আমাদের platform ব্যবহার করছিল, video vendor এর bill তত বাড়ছিল। Success এর সাথে সাথে খরচও বাড়ছিল।

আমাদের telemedicine এর video চলত একটা third-party service এ, per-minute billing এ। মাসে কয়েকশো ডলার, বছরে প্রায় তিন হাজার। আর consultation যত বাড়বে, এটা তত বাড়বে।

তার ওপর connection drop হলে আমাদের হাতে করার কিছু ছিল না। সমস্যাটা vendor এর ভেতরে, আমরা শুধু দেখছি।

তাই নিজেদের WebRTC pipeline বানালাম। Peer-to-peer video, নিজেদের host করা STUN/TURN server, আর live feedback এর জন্য Socket.IO।

ফল দুটো। Usage-based bill এর জায়গায় এখন একটা fixed server খরচ। আর latency আর connection drop নিয়ে কাজ করার ক্ষমতা এখন আমাদের হাতে।

কিন্তু এটা বিনা মূল্যে না। TURN server এখন আমাদের দায়িত্ব। Monitoring, scaling, NAT এর অদ্ভুত সব case, সব নিজের। Vendor এর bill কমেছে, কিন্তু operations এর দায় বেড়েছে।

Vendor বদলানোর আগে জিজ্ঞেস করুন, আমি কি bill টা কমাচ্ছি, নাকি সমস্যাটা নিজের ঘাড়ে নিচ্ছি? কখনো কখনো দুটোই ঠিক সিদ্ধান্ত।
```

**First comment:** none. Optional: link your Experience section.

---

## Day 2 · Short

```text
README এ যে visitor counter দেখেন, ওটা মানুষ গোনে না। Request গোনে।

Bot, cache, GitHub এর image proxy, page refresh, সবই এক একটা "visitor"। নিজে একটা বানানোর পর থেকে ওটাকে আমি "request count" বলি।
```

**First comment:** `https://montasim.dev/blog/a-readme-counter-measures-requests-not-people?lang=bn`

---

## Day 3 · Side product · BugReceipt

```text
"Button টা কাজ করছে না।" এই একটা বাক্য থেকে bug reproduce করতে কত সময় যায়, প্রতিটা developer জানে।

Screenshot এ sequence থাকে না। Console error থাকে না। কোন request fail করেছে, কোন browser, কী click করা হয়েছিল, কিছুই না।

তাই BugReceipt বানালাম, একটা Chrome extension যেটা reproduction steps, console log, network request আর একটা recording এক জায়গায় ধরে।

কিন্তু সবচেয়ে কঠিন সিদ্ধান্ত ছিল, কী ধরব না।

Bug report এ password, token, customer এর data চলে যাওয়া খুব সহজ। তাই BugReceipt ইচ্ছা করেই DOM snapshot, cookie, browser storage, header, form value, keystroke, clipboard বা audio নেয় না।

যা নেয়, তাও সরাসরি কোথাও যায় না। প্রথমে extension এর ভেতরে filter হয়, token আর secret এর মতো দেখতে জিনিস সরানো হয়। তারপর user একটা review screen এ প্রতিটা step, প্রতিটা log দেখে, যেটা চায় মুছে দেয়। Default হলো download। Email পাঠানো একটা আলাদা, স্পষ্ট সিদ্ধান্ত।

Automatic filter সব secret ধরতে পারে না। তাই শেষ সিদ্ধান্ত মানুষের হাতে।

Debugging tool এর প্রথম দায়িত্ব হলো নিজে একটা নতুন security bug না হওয়া।
```

**First comment:** `Demo video আর design decision গুলো: https://montasim.dev/blog/reproducible-bug-reports-without-default-surveillance?lang=bn`

---

## Day 4 · Production lesson · Re-annotation

```text
AI একটা measurement দিল। ভুল। এখন একজন clinician সেটা ঠিক করবেন। এই "ঠিক করা" অংশটা বানাতে গিয়ে বুঝলাম, এটা UI এর কাজ না, এটা geometry এর কাজ।

আমাদের system recorded movement থেকে automatic ভাবে joint এর line আর angle বসায়। মাঝে মাঝে ভুল frame এ, বা একটু ভুল জায়গায়। Clinician কে সঠিক frame বেছে, line টেনে ঠিক করে, নতুন measurement save করতে হয়।

পুরনো version এ সবকিছু canvas এর ভেতরে মিশে ছিল। Zoom করলে point সরে যেত। কোনো line শুধু একদিকে নড়ার কথা, সেটা সবদিকে নড়ত। আর কিছু ভুল হলে canvas শুধু ফাঁকা দেখাত।

তাই নতুন করে বানানোর সময় তিনটা জিনিস আলাদা করলাম:

Geometry: coordinate আর angle এর হিসাব pure function এ, canvas ছাড়াই test করা যায়।
Workflow: frame বাছাই, alignment, verification, তিনটা স্পষ্ট ধাপ। অসম্পূর্ণ অবস্থায় save চলতেই পারে না।
Boundary: পুরনো API থেকে আসা data UI তে ঢোকার আগেই যাচাই হয়। ভুল data মানে একটা পরিষ্কার "unavailable" state, ভাঙা canvas না।

Konva এখন শুধু আঁকে। কোনটা সঠিক, সেটা ঠিক করে domain model।

AI এর ভুল ধরার tool যদি নিজেই অস্পষ্ট হয়, তাহলে মানুষ AI কে আরো বেশি বিশ্বাস করবে, কম না।
```

**First comment:** `https://montasim.dev/blog/human-review-needs-a-geometry-domain?lang=bn`

---

## Day 5 · Checklist · Local build vs deploy

```text
Local এ npm run build পাস করেছে। Netlify তে deploy fail। এটা সবচেয়ে বেশি দেখেছি এই পাঁচ কারণে:

১. Publish directory ভুল। dist, build, .output, out, framework অনুযায়ী আলাদা। ভুল folder deploy হলে site খোলে, কিন্তু খালি।

২. Base path ভুল। Monorepo তে app টা subfolder এ, কিন্তু build root থেকে চলছে।

৩. Runtime model গুলিয়ে ফেলা। Static site, SPA আর SSR, তিনটার routing আর function এর চাহিদা আলাদা। SSR app কে static এর মতো deploy করলে শুধু home page চলে।

৪. সব route কে /index.html এ redirect করা। এতে broken build ও "চলছে" মনে হয়, আসল error টা লুকিয়ে যায়।

৫. Environment variable শুধু আপনার machine এ আছে। .env commit হয় না, তাই Netlify জানেই না।

ঠিক করার আগে একটা কাজ করুন। লিখে ফেলুন, এই app কোন ধরনের, কোথা থেকে build হয়, কোন folder publish হয়, কোন route কোথায় যায়। ওই contract টা থাকলে বেশিরভাগ সমস্যা config লেখার আগেই ধরা পড়ে।

Local build শুধু প্রমাণ করে code compile হয়। Deploy যোগ্য, সেটা প্রমাণ করে না।
```

**First comment:** `https://montasim.dev/blog/local-build-does-not-prove-deployability?lang=bn`

---

## Day 6 · Client work · Coaching Management

```text
একটা client এর coaching platform এ দুই company র biometric attendance device লাগাতে হবে। দুটোর protocol আলাদা, data format আলাদা, কাজের ধরনও আলাদা।

সহজ রাস্তা ছিল, attendance এর code এ if-else বসানো। Device A হলে এভাবে, B হলে ওভাবে।

সমস্যা হলো, তৃতীয় device এলে আবার পুরো attendance code খুলতে হবে। আর vendor এর অদ্ভুত নিয়ম ধীরে ধীরে মূল business logic এর ভেতরে ঢুকে যাবে।

তাই একটা internal device contract বানালাম। Attendance workflow শুধু ওই contract চেনে। প্রতিটা vendor এর জন্য একটা adapter, যে vendor এর ভাষাকে আমাদের ভাষায় translate করে। নতুন vendor মানে নতুন adapter, attendance code এ কোনো পরিবর্তন না।

একই platform এ আরো দুটো নিয়ম শুরু থেকে রেখেছি:
প্রতিটা protected query তে organization scope backend এ বসানো। এক institute কখনো আরেকটার data দেখবে না।
Payment বা student record delete হয় না, soft-delete হয় কারণসহ। Financial history কখনো মুছে যায় না।

Hardware বদলাবে, vendor বদলাবে। Business logic এর সেটা জানার দরকার নেই।
```

**First comment:** `https://montasim.dev/blog/one-attendance-model-for-multiple-biometric-vendors?lang=bn`

---

## Day 7 · Career · Junior to Senior

```text
২০২২ এর নভেম্বরে Junior Software Engineer হিসেবে join করেছিলাম। ২০২৫ এর অক্টোবরে Senior হলাম, একই company তে।

মাঝের তিন বছরে আমার code লেখার skill যতটা বদলেছে, তার চেয়ে বেশি বদলেছে কাজের সংজ্ঞা।

Junior হিসেবে আমার কাজ ছিল ticket শেষ করা। একটা feature, একটা bug। Code চললেই কাজ শেষ।

Software Engineer হিসেবে কাজ হলো একটা module এর মালিক হওয়া। Strength assessment module টা শুরু থেকে বানালাম, cloud খরচ নিয়ে কাজ করলাম। তখন প্রশ্ন বদলে গেল, "এটা চলছে কি?" থেকে "এটা ছয় মাস পরে কেমন থাকবে?"

Senior হিসেবে কাজ হলো architecture আর মানুষ। তিনজনের একটা team, review process, কোন technical সিদ্ধান্ত নেব আর কোনটা নেব না। এখন আমার সবচেয়ে ভালো দিন সেটা, যেদিন আমি নিজে কম code লিখেছি কিন্তু team বেশি ship করেছে।

যেটা কেউ বলে দেয়নি: promotion title এর আগে আসে দায়িত্ব। Senior হওয়ার অনেক আগে থেকেই আমাকে senior এর মতো কাজ করতে হয়েছে।

পরের title টা চাওয়ার আগে, পরের title এর কাজটা শুরু করুন।
```

**First comment:** none
