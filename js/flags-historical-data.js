/* =========================================================
   FLAGS — HISTORICAL DATA — for the "جولة الأعلام القديمة" mode.
   These are old/former flags that no longer exist today, so
   there's no emoji for them — each entry ships an actual image
   (hosted on Wikimedia Commons, public-domain / free-licensed)
   plus an Arabic hint (continent + era) instead of the country
   name, so the GM reads the hint out loud before revealing.

   Shape: [imageUrl, hint, answer, note]
     imageUrl : Wikimedia Commons "Special:FilePath" link — this
                is a stable redirect that doesn't depend on the
                file's internal hash path.
     hint     : what the GM says instead of showing the name
     answer   : country name shown after reveal
     note     : short "كان علم كذا من سنة كذا لسنة كذا" shown
                next to the answer after reveal

   ⚠️ Wikimedia occasionally renames/moves files. If an image
   breaks, the game falls back to a plain 🏳️ instead of crashing
   (see flags.js) — just swap the filename in the URL when you
   notice one down.

   Feel free to add more entries in the same shape — variety in
   "how old" and "how well-known" keeps the round from being
   either too easy or impossible.
========================================================= */

const FLAGS_HISTORICAL_DATA=[

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Egypt%201972.svg",
 "دولة أفريقية وآسيوية (فيها سيناء)، العلم ده كان بتاعها ضمن اتحاد مع دولتين عربيتين تانيين",
 "مصر","علم اتحاد الجمهوريات العربية (مصر وليبيا وسوريا)، من 1972 لـ1984"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Libya%20(1977%E2%80%932011).svg",
 "دولة أفريقية، عاصمتها طرابلس، العلم ده كان أبسط علم في العالم كله",
 "ليبيا","العلم الأخضر بالكامل، زمن القذافي، من 1977 لـ2011"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20South%20Africa%20(1928%E2%80%931994).svg",
 "دولة في جنوب القارة الأفريقية، العلم ده اتلغى بعد ما انتهى نظام سياسي مشهور فيها",
 "جنوب أفريقيا","علم زمن نظام الفصل العنصري (أبارتايد)، من 1928 لـ1994"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Rhodesia.svg",
 "دولة أفريقية، كان اسمها مختلف تمامًا عن اسمها دلوقتي، غيّرت اسمها وعلمها سنة 1980",
 "زيمبابوي","علم روديسيا، قبل ما تتسمى زيمبابوي سنة 1980"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Rwanda%20(1962%E2%80%932001).svg",
 "دولة أفريقية صغيرة في وسط القارة، غيّرت علمها بعد أحداث مأساوية مرّت بيها في التسعينات",
 "رواندا","العلم القديم، من الاستقلال 1962 لحد 2001"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Iran%20(1964%E2%80%931980).svg",
 "دولة آسيوية، العلم ده كان زمن حكم الشاه، قبل ما يحصل فيها تغيير نظام كبير",
 "إيران","علم زمن الشاه (فيه أسد وشمس)، قبل الثورة الإسلامية 1979"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20South%20Vietnam.svg",
 "دولة آسيوية، كانت متقسّمة نُص ونُص، والنُص ده اتحد مع التاني سنة 1975",
 "فيتنام","علم فيتنام الجنوبية، قبل توحيد البلد سنة 1975"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Myanmar%20(1974%E2%80%932010).svg",
 "دولة آسيوية جنب تايلاند، اسمها القديم كان بورما",
 "ميانمار","العلم القديم زمن الحكم العسكري، من 1974 لـ2010"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Democratic%20Kampuchea.svg",
 "دولة آسيوية، العلم ده كان زمن نظام دموي جدًا اتسمى الخمير الحمر",
 "كمبوديا","علم كمبوتشيا الديمقراطية (الخمير الحمر)، من 1975 لـ1979"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20the%20Soviet%20Union.svg",
 "أكبر دولة كانت موجودة في العالم مساحة، اتقسّمت لدول كتير أوي سنة 1991",
 "روسيا","علم الاتحاد السوفيتي، قبل ما ينهار سنة 1991"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20East%20Germany.svg",
 "دولة أوروبية، كانت متقسّمة لنُصين زمن الحرب الباردة، واتحدت تاني سنة 1990",
 "ألمانيا","علم ألمانيا الشرقية (الشيوعية)، قبل الوحدة سنة 1990"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20the%20Republic%20of%20China%20(1912%E2%80%931928).svg",
 "أكبر دولة في آسيا من ناحية عدد السكان، ده كان علمها قبل ما يحكمها الحزب الشيوعي",
 "الصين","العلم \"خماسي الألوان\"، من أول الجمهورية 1912 لحد 1928"]

];
