# Week 3

## Day 1 · MyMedicalHub story · 70% cloud cost

```text
আমাদের cloud bill এর ৭০% কমিয়েছিলাম। কোনো জটিল optimization না, একটা প্রশ্ন দিয়ে: আমরা কি আসলে server চালাতে চাই?

আমাদের application চলত নিজেদের manage করা virtual machine এ। Dev, staging, UAT, production, চারটা environment। প্রতিটা machine এর OS update, patch, process restart, scaling, সব আমাদের হাতে।

আর একটা VM চালু থাকলে bill আসে, ব্যবহার হোক বা না হোক।

Managed platform এ (Azure App Service) সরে গেলাম। Server, OS, patching platform এর দায়িত্ব। আমরা শুধু app deploy করি। সাথে GitHub Actions দিয়ে CI/CD automate করলাম, যাতে চারটা environment এ deploy একই পদ্ধতিতে হয়, কারো হাতের ওপর নির্ভর না করে।

ফল: hosting খরচ ৭০% কম, বছরে প্রায় দশ হাজার ডলার। আর deploy এর সময় কেউ আর SSH করে server এ ঢোকে না।

তবে managed platform সবার জন্য না। কিছু workload এ নিয়ন্ত্রণ বেশি লাগে, তখন VM ই ঠিক। আমাদের ক্ষেত্রে আমরা নিয়ন্ত্রণের জন্য টাকা দিচ্ছিলাম, যে নিয়ন্ত্রণ আমাদের দরকারই ছিল না।

Cloud খরচ কমানোর প্রথম ধাপ সস্তা machine খোঁজা না। আগে জিজ্ঞেস করুন, কোন কাজটা আপনার করার দরকারই নেই।
```

**Scheduled:** Wed, Nov 11, 2026, 9:00 AM (Bangladesh time)

**First comment:** `Experience আর বাকি কাজ: https://montasim.dev` (home page has no Bangla version)

---

## Day 2 · Short

```text
Prayer time এর app এ "সঠিক সময়" বলে কিছু নেই। আছে কোন source, কোন calculation method, কোন জেলা।

Ramadan Clock বানাতে গিয়ে শিখলাম, এক মিনিট বেশি precise দেখানোর চেয়ে source টা দেখানো বেশি সৎ।
```

**Scheduled:** Thu, Nov 12, 2026, 9:00 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/prayer-time-software-needs-provenance?lang=bn`

---

## Day 3 · Side product · Air Traffic Control

```text
একটা game এ player যদি দেখে দুটো plane একে অপরকে ছোঁয়নি, কিন্তু game বলে crash, সে game টা আর খেলবে না।

Air Traffic Control বানালাম, একটা flight-path drawing game। আঙুল বা mouse দিয়ে plane এর রাস্তা আঁকতে হয়, যাতে ধাক্কা না লেগে সব runway তে নামে। এখন Google Play, Microsoft Store, Snap Store আর browser এ আছে, একটাই TypeScript codebase থেকে।

সবচেয়ে বেশি সময় গেছে collision এ। প্রথমে collision ধরা হচ্ছিল sprite এর পুরো box দিয়ে। কিন্তু box এর ভেতরে ছিল selection এর halo, shadow, rotor এর blur। Player এর চোখে plane ছোঁয়নি, কিন্তু shadow ছুঁয়েছে, তাই crash।

ঠিক করলাম collision outline টা plane এর আসল শরীর অনুযায়ী, plane যেদিকে মুখ করে আছে সেদিকে ঘুরিয়ে। Visual effect কখনো মৃত্যুর কারণ হয় না।

আরেকটা সিদ্ধান্ত পুরো project টা সহজ করেছে। Game এর নিয়ম (simulation) আর আঁকা (Phaser renderer) আলাদা। Simulation fixed step এ চলে, traffic seeded random এ। ফলে collision, landing, progression, সব browser ছাড়াই test করা যায়।

Game এর নিয়ম যদি player যা দেখে তার সাথে না মেলে, player ভুল ভাবে না। ভাবে game টা অন্যায্য।
```

**Scheduled:** Fri, Nov 13, 2026, 10:30 AM (Bangladesh time)

**First comment:** `Play Store, Microsoft Store, Snap Store আর browser link: https://montasim.dev/blog/separating-flight-rules-from-the-renderer?lang=bn`

---

## Day 4 · Production lesson · TIN lookup

```text
আপনার TIN নম্বর একটা অচেনা website এ টাইপ করার আগে একবার ভাবুন, ওটা কোথায় যাচ্ছে।

NBR এর risk-based audit selection হিসেবে একটা পুরনো list ঘুরছিল, যেটা দেখে বোঝা যায় কোন TIN audit এর জন্য selected হয়েছিল। List টা ঘাঁটা কষ্টের, বিশেষ করে phone এ। তাই একটা lookup tool বানালাম।

সহজ রাস্তা ছিল একটা API। User TIN দেয়, server খুঁজে উত্তর দেয়। কিন্তু তাহলে প্রতিটা মানুষের TIN আমার server এর log এ যেত।

তাই lookup টা পুরোটাই browser এ চলে। List টা একবার load হয়, তারপর সব খোঁজা user এর device এর ভেতরে। কেউ কী খুঁজল, আমার server জানেই না।

এখানে একটা trade-off আছে, যেটা লুকাইনি। List টা browser এ আসে, তাই data টা আর গোপন থাকে না। আর এটা একটা পুরনো list, এখনকার audit status না। Match হলেও, না হলেও, tool টা বলে official ভাবে যাচাই করে নিন।

সব কিছু server এ পাঠানো default হওয়া উচিত না। প্রশ্ন করুন, এই data আসলে আমার দেখার দরকার আছে কি?
```

**Scheduled:** not scheduled (removed from LinkedIn)

**First comment:** `https://montasim.dev/blog/keeping-tax-id-lookups-out-of-the-server?lang=bn`

---

## Day 5 · Checklist · Making a repo public

```text
একটা private repo public করার আগে এই ছয়টা জিনিস দেখে নিন। এর একটাও ভুললে রিস্ক আছে।

১. পুরো git history তে secret খুঁজুন, শুধু এখনকার file এ না। ছয় মাস আগে commit করে মুছে ফেলা API key এখনো history তে আছে। একবার public হলে key টা rotate করুন, মোছা যথেষ্ট না।

২. .env, config, test fixture, log, screenshot এ real data আছে কিনা দেখুন। Customer এর email, internal URL, server এর নাম।

৩. License ঠিক করুন, নিজে বেছে। License না থাকলে code দেখা যায়, কিন্তু আইনত কেউ ব্যবহার করতে পারে না।

৪. README, SECURITY.md আর কোন issue কোথায় report করতে হবে, লিখে রাখুন।

৫. CI যেন fork থেকে আসা PR এ আপনার secret না পায়।

৬. Public করার পর repo settings, default branch আর visibility আবার পড়ে দেখুন। Command সফল হয়েছে বলে ধরে নেবেন না।

Code public করা একটা button না। এটা একটা security আর operations এর সিদ্ধান্ত।
```

**Scheduled:** Sat, Nov 14, 2026, 10:30 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/making-a-codebase-public-safely?lang=bn`

---

## Day 6 · Client work · FormFlow

```text
একটা form বদলালে পুরনো submission গুলোর কী হবে? বেশিরভাগ system এই প্রশ্নটা করেই না।

FormFlow বানাচ্ছি, institution গুলোর জন্য একটা bilingual platform। কেউ একটা request জমা দেয়, সেটা একটা workflow ধরে বিভিন্ন মানুষের হাত ঘুরে শেষ হয়।

সমস্যাটা আসে তিন মাস পরে। Admin form এ একটা নতুন প্রশ্ন যোগ করলেন, workflow এ একটা approval ধাপ বাড়ালেন। এখন তিন মাস আগের submission গুলো কোন নিয়মে চলবে? নতুন প্রশ্নের উত্তর তো ওদের কাছে নেই।

তাই form আর workflow দুটোরই version হয়। Publish করলে একটা immutable version তৈরি হয়। প্রতিটা submission যে version এ ঢুকেছিল, সেটা মনে রাখে। পরে form যতই বদলাক, পুরনো submission এর অর্থ আর process বদলায় না।

আরেকটা নিয়ম: Google দিয়ে sign in করা মানে শুধু আপনি কে, সেটা প্রমাণ। আপনি কোন institution এ কী করতে পারবেন, সেটা আলাদা ভাবে server এ যাচাই হয়, প্রতিটা read আর write এ।

শুধু data কে version করলে হয় না। যে নিয়মে data তৈরি হয়েছিল, সেটাকেও version করতে হয়।
```

**Scheduled:** Sun, Nov 15, 2026, 9:00 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/version-the-workflow-not-just-the-form?lang=bn`

---

## Day 7 · Reflection · AI-first engineering

```text
AI দিয়ে README লেখালে একটা অদ্ভুত জিনিস হয়। লেখাটা খুব আত্মবিশ্বাসী, খুব সুন্দর, আর অর্ধেকটা ভুল।

পুরনো README তে লেখা ছিল "supports Node 16"। AI সেটা যত্ন করে রেখে দেয়। Project এ এমন feature এর কথা লেখে যেটা কখনো ছিল না। Command দেয় যেটা package.json এ নেই।

সমস্যা AI এর না। সমস্যা হলো আমরা ওকে প্রমাণ ছাড়া লিখতে দিচ্ছি।

তাই Claude Code আর Codex এর জন্য নিজের কিছু agent skill বানিয়েছি। README লেখার skill টা লেখা শুরু করার আগে project টা পড়ে। পুরনো README কে template না, শুধু একটা দাবি হিসেবে দেখে, যেটা যাচাই করতে হবে। প্রতিটা তথ্যকে তিন ভাগে রাখে: verified, inferred, unknown। আর যা জানে না, সেটা বানায় না, বলে দেয় নেই।

একই নিয়মে release, deploy আর metadata ঠিক করার skill ও বানিয়েছি। সবগুলোর মূল কথা একটা: আগে evidence, তারপর লেখা।

AI first মানে AI কে সব কিছু করতে দেওয়া না। মানে AI কে এমনভাবে বাঁধা, যাতে সে মিথ্যা বলতে না পারে।
```

**Scheduled:** Mon, Nov 16, 2026, 9:00 AM (Bangladesh time)

**First comment:** `https://montasim.dev/blog/readme-generation-must-start-with-evidence?lang=bn`
