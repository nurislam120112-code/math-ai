export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST гана уруксат берилет"
    });
  }

  try {
    const {
      grade,
      slides,
      language,
      style,
      topic,
      extra
    } = req.body || {};

    if (!grade || !slides || !language || !topic) {
      return res.status(400).json({
        error: "Маалыматтар толук эмес"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY коюлган эмес"
      });
    }

    const slideCount = Math.min(
      Math.max(parseInt(slides) || 10, 5),
      20
    );

    const prompt = `
Сен тажрыйбалуу математика мугалими жана профессионал презентация түзүүчүсүң.

Мага мектеп сабагы үчүн даяр презентация түз.

МААЛЫМАТ:
Класс: ${grade}
Тема: ${topic}
Тил: ${language}
Слайд саны: ${slideCount}
Дизайн стили: ${style || "Заманбап"}
Кошумча талап: ${extra || "Жок"}

ТАЛАПТАР:
- Материал ${grade} окуучуларына түшүнүктүү болсун.
- Так жана жеңил тил колдон.
- Математикалык аныктамалар туура болсун.
- Формула керек болсо кадимки текст форматында жаз.
- Мисалдарды этап-этабы менен түшүндүр.
- Өтө көп текст жазба.
- Ар бир слайд презентацияга ылайыктуу кыска болсун.
- Слайддардын бири сабактын максаты болсун.
- Негизги түшүндүрмөлөр болсун.
- Кеминде 2 практикалык мисал болсун.
- Окуучулар үчүн тапшырмалар болсун.
- Акыркы слайд жыйынтык жана үй тапшырмасы болсун.
- Так ${slideCount} слайд түз.

ЖООПТУ JSON ГАНА БЕР.
Markdown колдонбо.
\`\`\`json деген белгилерди жазба.

Формат:

{
  "topic": "${topic}",
  "grade": "${grade}",
  "language": "${language}",
  "style": "${style || "Заманбап"}",
  "slides": [
    {
      "title": "Слайддын аталышы",
      "points": [
        "Биринчи кыска пункт",
        "Экинчи кыска пункт",
        "Үчүнчү кыска пункт"
      ]
    }
  ]
}
`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", openaiData);

      return res.status(openaiResponse.status).json({
        error:
          openaiData?.error?.message ||
          "AI жооп берген жок"
      });
    }

    let text = "";

    if (typeof openaiData.output_text === "string") {
      text = openaiData.output_text;
    }

    if (!text && Array.isArray(openaiData.output)) {
      for (const item of openaiData.output) {
        if (!Array.isArray(item.content)) continue;

        for (const part of item.content) {
          if (
            part.type === "output_text" &&
            typeof part.text === "string"
          ) {
            text += part.text;
          }
        }
      }
    }

    if (!text) {
      console.error("No AI text:", openaiData);

      return res.status(500).json({
        error: "AI текст кайтарган жок"
      });
    }

    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let presentation;

    try {
      presentation = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", text);

      return res.status(500).json({
        error: "AI презентацияны туура форматта берген жок"
      });
    }

    if (
      !presentation ||
      !Array.isArray(presentation.slides)
    ) {
      return res.status(500).json({
        error: "Слайддар түзүлгөн жок"
      });
    }

    presentation.topic = topic;
    presentation.grade = grade;
    presentation.language = language;
    presentation.style = style || "Заманбап";

    return res.status(200).json({
      success: true,
      presentation
    });

  } catch (error) {
    console.error("Generate error:", error);

    return res.status(500).json({
      error: "Серверде ката кетти"
    });
  }
}
