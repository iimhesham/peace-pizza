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
 "دولة أفريقية وآسيوية، من سنة 1972 لحد سنة 1984",
 "مصر","علم اتحاد الجمهوريات العربية (مصر وليبيا وسوريا)، من 1972 لـ1984"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Libya%20(1977%E2%80%932011).svg",
 "دولة أفريقية، من سنة 1977 لحد سنة 2011",
 "ليبيا","العلم الأخضر بالكامل، زمن القذافي، من 1977 لـ2011"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20South%20Africa%20(1928%E2%80%931994).svg",
 "دولة في جنوب القارة الأفريقية، من سنة 1928 لحد سنة 1994",
 "جنوب أفريقيا","علم زمن نظام الفصل العنصري (أبارتايد)، من 1928 لـ1994"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Rhodesia.svg",
 "دولة أفريقية، العلم اتغيّر سنة 1980",
 "زيمبابوي","علم روديسيا، قبل ما تتسمى زيمبابوي سنة 1980"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Rwanda%20(1962%E2%80%932001).svg",
 "دولة أفريقية في وسط القارة، من سنة 1962 لحد سنة 2001",
 "رواندا","العلم القديم، من الاستقلال 1962 لحد 2001"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Iran%20(1964%E2%80%931980).svg",
 "دولة آسيوية، قبل سنة 1979",
 "إيران","علم زمن الشاه (فيه أسد وشمس)، قبل الثورة الإسلامية 1979"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20South%20Vietnam.svg",
 "دولة آسيوية، قبل سنة 1975",
 "فيتنام","علم فيتنام الجنوبية، قبل توحيد البلد سنة 1975"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Myanmar%20(1974%E2%80%932010).svg",
 "دولة آسيوية (جنوب شرق آسيا)، من سنة 1974 لحد سنة 2010",
 "ميانمار","العلم القديم زمن الحكم العسكري، من 1974 لـ2010"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Democratic%20Kampuchea.svg",
 "دولة آسيوية، من سنة 1975 لحد سنة 1979",
 "كمبوديا","علم كمبوتشيا الديمقراطية (الخمير الحمر)، من 1975 لـ1979"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20the%20Soviet%20Union.svg",
 "دولة ممتدة بين قارتي أوروبا وآسيا، قبل سنة 1991",
 "روسيا","علم الاتحاد السوفيتي، قبل ما ينهار سنة 1991"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20East%20Germany.svg",
 "دولة أوروبية، قبل سنة 1990",
 "ألمانيا","علم ألمانيا الشرقية (الشيوعية)، قبل الوحدة سنة 1990"],

["https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20the%20Republic%20of%20China%20(1912%E2%80%931928).svg",
 "دولة آسيوية، من سنة 1912 لحد سنة 1928",
 "الصين","العلم \"خماسي الألوان\"، من أول الجمهورية 1912 لحد 1928"]

];
