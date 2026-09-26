/* =========================================================
   FLAGS — HISTORICAL DATA — for the "جولة الأعلام القديمة" mode.

   These are old/former flags that no longer exist today, so
   there's no emoji for them. Loading them as images from
   Wikimedia turned out unreliable (wrong/renamed filenames,
   hotlink issues on some networks/webviews) — so every flag
   here is drawn as plain inline SVG instead. No internet
   connection needed, nothing to break.

   Shape: [svgMarkup, hint, answer, note]
     svgMarkup : a self-contained <svg>…</svg> string (colors only,
                 simplified emblems where the real flag had one —
                 accurate enough to recognize, not museum-grade)
     hint      : what the GM says instead of showing the name
     answer    : country name shown after reveal
     note      : short "من سنة كذا لسنة كذا" shown under the answer

   To add more: reuse hStripes()/vStripes() below for simple
   banded flags, or write a one-off <svg> string for anything
   with an emblem.
========================================================= */

function hStripes(colors){
  const n=colors.length,h=100/n;
  return `<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">${
    colors.map((c,i)=>`<rect x="0" y="${(i*h*6).toFixed(2)}" width="900" height="${(h*6).toFixed(2)}" fill="${c}"/>`).join("")
  }</svg>`;
}
function vStripes(colors){
  const n=colors.length,w=100/n;
  return `<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">${
    colors.map((c,i)=>`<rect x="${(i*w*9).toFixed(2)}" y="0" width="${(w*9).toFixed(2)}" height="600" fill="${c}"/>`).join("")
  }</svg>`;
}
function starGrid(cols,rows,x0,y0,x1,y1,r,color){
  let dots="";
  for(let r_=0;r_<rows;r_++){
    for(let c_=0;c_<cols;c_++){
      const x=x0+(x1-x0)*(c_/(cols-1)),y=y0+(y1-y0)*(r_/(rows-1));
      dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}"/>`;
    }
  }
  return dots;
}

const FLAGS_HISTORICAL_DATA=[

// مصر — علم اتحاد الجمهوريات العربية (مصر وليبيا وسوريا)، أحمر-أبيض-أسود ونجمتين خضر
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#ce1126'/><rect y='200' width='900' height='200' fill='#fff'/><rect y='400' width='900' height='200' fill='#000'/>"+
 "<g fill='#007a3d'><path d='M370 260 l14 30 33 3 -25 22 8 33 -30 -18 -30 18 8 -33 -25 -22 33 -3 z'/>"+
 "<path d='M480 260 l14 30 33 3 -25 22 8 33 -30 -18 -30 18 8 -33 -25 -22 33 -3 z'/></g></svg>",
 "دولة أفريقية وآسيوية، من سنة 1972 لحد سنة 1984",
 "مصر","علم اتحاد الجمهوريات العربية (مصر وليبيا وسوريا)، من 1972 لـ1984"],

// ليبيا — أخضر بالكامل
[hStripes(["#007a3d"]),
 "دولة أفريقية، من سنة 1977 لحد سنة 2011",
 "ليبيا","العلم الأخضر بالكامل، زمن القذافي، من 1977 لـ2011"],

// جنوب أفريقيا زمن الأبارتايد — تراي كولور برتقالي-أبيض-أزرق مع علم بريطانيا في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#ff7f00'/><rect y='200' width='900' height='200' fill='#fff'/><rect y='400' width='900' height='200' fill='#00287a'/>"+
 "<rect x='370' y='230' width='160' height='140' fill='#fff' stroke='#333' stroke-width='2'/>"+
 "<rect x='378' y='238' width='144' height='124' fill='#00287a'/>"+
 "<path d='M378 238 L522 362 M522 238 L378 362' stroke='#fff' stroke-width='10'/>"+
 "<path d='M450 238 V362 M378 300 H522' stroke='#ce1126' stroke-width='10'/></svg>",
 "دولة في جنوب القارة الأفريقية، من سنة 1928 لحد سنة 1994",
 "جنوب أفريقيا","علم زمن نظام الفصل العنصري (أبارتايد)، من 1928 لـ1994"],

// روديسيا (قبل زيمبابوي) — أخضر-أبيض-أخضر رأسي مع شعار في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='300' height='600' fill='#007a3d'/><rect x='300' width='300' height='600' fill='#fff'/><rect x='600' width='300' height='600' fill='#007a3d'/>"+
 "<circle cx='450' cy='300' r='90' fill='none' stroke='#8a6d3b' stroke-width='8'/>"+
 "<path d='M450 240 l20 45 -40 0 z' fill='#8a6d3b'/><rect x='430' y='285' width='40' height='55' fill='#8a6d3b'/></svg>",
 "دولة أفريقية، العلم اتغيّر سنة 1980",
 "زيمبابوي","علم روديسيا، قبل ما تتسمى زيمبابوي سنة 1980"],

// رواندا القديم — أحمر-أصفر-أخضر رأسي وحرف R أسود في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='300' height='600' fill='#20603d'/><rect x='300' width='300' height='600' fill='#fad201'/><rect x='600' width='300' height='600' fill='#ce1126'/>"+
 "<text x='450' y='390' font-family='Arial,sans-serif' font-size='160' font-weight='900' fill='#000' text-anchor='middle'>R</text></svg>",
 "دولة أفريقية في وسط القارة، من سنة 1962 لحد سنة 2001",
 "رواندا","العلم القديم، من الاستقلال 1962 لحد 2001"],

// إيران زمن الشاه — أخضر-أبيض-أحمر مع شمس وأسد مبسّطين في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#239f40'/><rect y='200' width='900' height='200' fill='#fff'/><rect y='400' width='900' height='200' fill='#da0000'/>"+
 "<circle cx='450' cy='300' r='55' fill='#f4c430' stroke='#a8791b' stroke-width='4'/>"+
 "<path d='M410 320 q40 -60 80 0' fill='none' stroke='#a8791b' stroke-width='6'/></svg>",
 "دولة آسيوية، قبل سنة 1979",
 "إيران","علم زمن الشاه (فيه أسد وشمس)، قبل الثورة الإسلامية 1979"],

// فيتنام الجنوبية — أصفر وفيه ٣ خطوط حمرا في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#fcd116'/>"+
 "<rect y='230' width='900' height='30' fill='#da251d'/><rect y='285' width='900' height='30' fill='#da251d'/><rect y='340' width='900' height='30' fill='#da251d'/></svg>",
 "دولة آسيوية، قبل سنة 1975",
 "فيتنام","علم فيتنام الجنوبية، قبل توحيد البلد سنة 1975"],

// ميانمار زمن الحكم العسكري القديم — أزرق غامق وركن أحمر فيه نجمة
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#004a8f'/>"+
 "<rect width='260' height='260' fill='#da251d'/>"+
 "<path d='M130 60 l24 74 78 0 -63 46 24 74 -63 -46 -63 46 24 -74 -63 -46 78 0 z' fill='#fff'/></svg>",
 "دولة آسيوية (جنوب شرق آسيا)، من سنة 1974 لحد سنة 2010",
 "ميانمار","العلم القديم زمن الحكم العسكري، من 1974 لـ2010"],

// كمبوتشيا الديمقراطية (الخمير الحمر) — أحمر وفيه برج معبد أصفر في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#da0000'/>"+
 "<g fill='#fcd116'><rect x='420' y='260' width='60' height='120'/><rect x='340' y='300' width='50' height='80'/><rect x='510' y='300' width='50' height='80'/>"+
 "<path d='M420 260 l30 -50 30 50 z'/><path d='M340 300 l25 -40 25 40 z'/><path d='M510 300 l25 -40 25 40 z'/></g></svg>",
 "دولة آسيوية، من سنة 1975 لحد سنة 1979",
 "كمبوديا","علم كمبوتشيا الديمقراطية (الخمير الحمر)، من 1975 لـ1979"],

// الاتحاد السوفيتي — أحمر ونجمة ومطرقة ومنجل مبسّطين
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#cc0000'/>"+
 "<path d='M170 70 l16 48 50 0 -40 30 15 48 -41 -30 -41 30 15 -48 -40 -30 50 0 z' fill='#ffcc00'/>"+
 "<rect x='230' y='150' width='90' height='16' fill='#ffcc00' transform='rotate(35 230 150)'/>"+
 "<circle cx='200' cy='210' r='40' fill='none' stroke='#ffcc00' stroke-width='14'/></svg>",
 "دولة ممتدة بين قارتي أوروبا وآسيا، قبل سنة 1991",
 "روسيا","علم الاتحاد السوفيتي، قبل ما ينهار سنة 1991"],

// ألمانيا الشرقية — أسود-أحمر-أصفر مع شعار دائري في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#000'/><rect y='200' width='900' height='200' fill='#da0000'/><rect y='400' width='900' height='200' fill='#ffce00'/>"+
 "<circle cx='450' cy='300' r='70' fill='#f4c430' stroke='#333' stroke-width='4'/>"+
 "<rect x='420' y='270' width='60' height='14' fill='#333' transform='rotate(20 450 300)'/>"+
 "<path d='M420 330 a35 35 0 1 1 60 0' fill='none' stroke='#333' stroke-width='8'/></svg>",
 "دولة أوروبية، قبل سنة 1990",
 "ألمانيا","علم ألمانيا الشرقية (الشيوعية)، قبل الوحدة سنة 1990"],

// الصين — العلم خماسي الألوان قبل الشيوعية
[hStripes(["#da0000","#ffcc00","#0000da","#fff","#000"]),
 "دولة آسيوية، من سنة 1912 لحد سنة 1928",
 "الصين","العلم \"خماسي الألوان\"، من أول الجمهورية 1912 لحد 1928"],

// السودان قبل 1970 — أزرق-أصفر-أخضر أفقي
[hStripes(["#0072ce","#fcd116","#007a33"]),
 "دولة أفريقية، جنوب مصر، من قبل سنة 1970",
 "السودان","العلم القديم (أزرق-أصفر-أخضر)، قبل ما ياخد الألوان العربية سنة 1970"],

// تنجانيقا (قبل تنزانيا) — أخضر-أسود-أخضر أفقي بخطوط ذهب رفيعة
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#00a651'/>"+
 "<rect y='230' width='900' height='140' fill='#000'/>"+
 "<rect y='222' width='900' height='10' fill='#fcd116'/><rect y='368' width='900' height='10' fill='#fcd116'/></svg>",
 "دولة أفريقية شرقية، ده كان اسمها ورايتها قبل الاتحاد مع زنجبار سنة 1964",
 "تنزانيا","علم تنجانيقا، قبل الاتحاد مع زنجبار وتكوين تنزانيا سنة 1964"],

// العراق 1963-1991 — أحمر-أبيض-أسود وتلات نجوم خضر
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#ce1126'/><rect y='200' width='900' height='200' fill='#fff'/><rect y='400' width='900' height='200' fill='#000'/>"+
 "<g fill='#007a3d'>"+
 "<path d='M330 260 l12 26 29 3 -22 20 7 29 -26 -16 -26 16 7 -29 -22 -20 29 -3 z'/>"+
 "<path d='M450 260 l12 26 29 3 -22 20 7 29 -26 -16 -26 16 7 -29 -22 -20 29 -3 z'/>"+
 "<path d='M570 260 l12 26 29 3 -22 20 7 29 -26 -16 -26 16 7 -29 -22 -20 29 -3 z'/></g></svg>",
 "دولة عربية آسيوية، العلم القديم ده كان قبل ما تتغيّر التفاصيل جواه أكتر من مرة",
 "العراق","علم العراق من 1963 لـ1991 (قبل ما تتضاف عبارة الله أكبر)"],

// اليمن الشمالي قبل الوحدة — أحمر-أبيض-أسود ونجمة خضرا
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='200' fill='#ce1126'/><rect y='200' width='900' height='200' fill='#fff'/><rect y='400' width='900' height='200' fill='#000'/>"+
 "<path d='M450 250 l16 36 40 3 -30 27 10 40 -36 -22 -36 22 10 -40 -30 -27 40 -3 z' fill='#007a3d'/></svg>",
 "دولة عربية آسيوية، قبل الوحدة بين شمالها وجنوبها سنة 1990",
 "اليمن","علم اليمن الشمالي، قبل وحدة الشمال والجنوب سنة 1990"],

// مملكة إيطاليا — أخضر-أبيض-أحمر رأسي وشعار ملكي صغير في النص
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='300' height='600' fill='#008C45'/><rect x='300' width='300' height='600' fill='#fff'/><rect x='600' width='300' height='600' fill='#CD212A'/>"+
 "<rect x='420' y='250' width='60' height='100' fill='#00296b' stroke='#f4c430' stroke-width='6'/>"+
 "<path d='M420 250 h60 M410 240 h80' stroke='#f4c430' stroke-width='8' fill='none'/></svg>",
 "دولة أوروبية، شكل علمها القديم زي النهارده تقريبًا، بس كان فيه شعار ملكي في النص",
 "إيطاليا","علم مملكة إيطاليا، قبل ما تبقى جمهورية سنة 1946 (اتشال الشعار الملكي)"],

// إمبراطورية النمسا-المجر — أسود وأصفر أفقي
[hStripes(["#000","#ffd700"]),
 "امبراطورية أوروبية قديمة كبيرة، اتقسّمت لدول كتير بعد الحرب العالمية الأولى",
 "النمسا","علم إمبراطورية النمسا-المجر (آل هابسبورغ)، قبل ما تتفكك سنة 1918"],

// إسبانيا زمن فرانكو — أحمر-أصفر (تخين)-أحمر مع شعار نسر مبسّط
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#aa151b'/><rect y='150' width='900' height='300' fill='#f1bf00'/>"+
 "<path d='M450 240 l-10 60 h20 z' fill='#4a3b1f'/><path d='M410 260 q40 -20 80 0' fill='none' stroke='#4a3b1f' stroke-width='10'/>"+
 "<rect x='435' y='300' width='30' height='40' fill='#aa151b' stroke='#4a3b1f' stroke-width='4'/></svg>",
 "دولة أوروبية، العلم ده كان زمن حكم ديكتاتوري طال لحد ما الديكتاتور مات سنة 1975",
 "إسبانيا","علم إسبانيا زمن نظام فرانكو، قبل التحول الديمقراطي أواخر السبعينات"],

// مملكة البرتغال قبل 1910 — أزرق-أبيض رأسي وشعار
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='450' height='600' fill='#003399'/><rect x='450' width='450' height='600' fill='#fff'/>"+
 "<rect x='400' y='250' width='100' height='120' fill='#fff' stroke='#aa151b' stroke-width='6'/>"+
 "<circle cx='450' cy='300' r='20' fill='#aa151b'/></svg>",
 "دولة أوروبية، العلم القديم اتغيّر بعد إسقاط الملكية فيها سنة 1910",
 "البرتغال","علم مملكة البرتغال، قبل إعلان الجمهورية سنة 1910"],

// أمريكا (علم الـ48 نجمة) — قبل انضمام ألاسكا وهاواي
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 [0,1,2,3,4,5,6].map(i=>`<rect y="${i*600/13}" width="900" height="${600/13}" fill="${i%2?'#fff':'#B22234'}"/>`).join("")+
 [7,8,9,10,11,12].map(i=>`<rect y="${i*600/13}" width="900" height="${600/13}" fill="${i%2?'#fff':'#B22234'}"/>`).join("")+
 "<rect width='400' height='323' fill='#3C3B6E'/>"+
 starGrid(6,8,40,35,360,290,7,"#fff")+
 "</svg>",
 "دولة أمريكية كبيرة، العلم ده كان قبل ما توصل لعدد الولايات النهارده بولايتين",
 "أمريكا","علم فيه 48 نجمة، قبل انضمام ألاسكا وهاواي سنة 1959"],

// إمبراطورية البرازيل قبل 1889 — أخضر ومعين أصفر ودايرة زرقا
["<svg viewBox='0 0 900 600' xmlns='http://www.w3.org/2000/svg'>"+
 "<rect width='900' height='600' fill='#009739'/>"+
 "<path d='M450 60 L790 300 L450 540 L110 300 Z' fill='#fedd00'/>"+
 "<circle cx='450' cy='300' r='95' fill='#002776'/>"+
 "<path d='M355 300 a95 95 0 0 1 190 0' fill='none' stroke='#fff' stroke-width='6'/></svg>",
 "دولة أمريكا الجنوبية الكبيرة، العلم القديم ده كان زمن الإمبراطورية قبل ما تتحول لجمهورية",
 "البرازيل","علم إمبراطورية البرازيل، قبل إعلان الجمهورية سنة 1889"]

];
