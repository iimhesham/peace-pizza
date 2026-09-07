// js/api.js

const API_KEY = "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"; // ضع مفتاح Gemini API هنا

async function generateGameData(selectedCategories, language = 'ar') {
  if (!API_KEY || API_KEY === "حط_المفتاح_بتاعك_هنا") {
    alert('يرجى إضافة مفتاح Gemini API داخل ملف js/api.js');
    return;
  }

  const langPrompt = language === 'ar' ? 'اللغة العربية' : 'English';

  const prompt = `
أنت مساعد متخصص في إنشاء ألعاب المسابقات والـ Trivia.
المطلوب منك إنشاء أسئلة لعبة مسابقات بالـ ${langPrompt} للتصنيفات التالية:
${selectedCategories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

الشروط والتفاصيل المطلوب إرجاعها:
1. لكل تصنيف من التصنيفات المذكورة، قم بإنشاء أسئلة متدرجة الصعوبة كالتالي:
   - سؤال بقيمة 200 نقطة (سهل)
   - سؤال بقيمة 400 نقطة (متوسط)
   - سؤال بقيمة 600 نقطة (صعب)
2. كل سؤال يجب أن يحتوي على:
   - نص السؤال
   - 4 خيارات للإجابة
   - الإجابة الصحيحة (يجب أن تكون مطابقة تماماً لأحد الخيارات الأربعة)
3. قم بإنشاء ID فريد لكل تصنيف ولكل سؤال.
`;

  const jsonSchema = {
    type: "OBJECT",
    properties: {
      categories: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            name: { type: "STRING" },
            questions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  question: { type: "STRING" },
                  options: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  correctAnswer: { type: "STRING" },
                  points: { type: "INTEGER" }
                },
                required: ["id", "question", "options", "correctAnswer", "points"]
              }
            }
          },
          required: ["id", "name", "questions"]
        }
      }
    },
    required: ["categories"]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`فشل الاتصال بـ Gemini API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);

  } catch (error) {
    console.error('خطأ أثناء توليد أسئلة اللعبة:', error);
    throw error;
  }
}
