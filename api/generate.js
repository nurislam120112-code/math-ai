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
Сен профессионал математика мугалими жана презентация дизайнерисиң.

Мектеп сабагына заманбап, визуалдуу презентация түз.

Класс: ${grade}
Тема: ${topic}
Тил: ${language}
Слайд саны: ${slideCount}
Стиль: ${style || "VIP"}
Кошумча талап: ${extra || "Жок"}

МААНИЛҮҮ ТАЛАПТАР:

1. Так ${slideCount} слайд түз.
2. Материал ${grade} деңгээлине ылайык болсун.
3. Ар бир слайдда текст өтө көп болбосун.
4. Формулалар математикалык жактан туура болсун.
5. Кеминде 2 мисал болсун.
6. Практикалык тапшырмалар кош.
7. Акыркы слайд жыйынтык жана үй тапшырмасы болсун.

АР БИР СЛАЙД ҮЧҮН:
- title
- 2-5 кыска point
- imagePrompt

imagePrompt англис тилинде болсун.

imagePrompt:
- слайддын темасына түз байланыштуу болсун;
- мектептик жана билим берүүчү болсун;
- профессионал презентация үчүн жарактуу болсун;
- сүрөттө текст же жазуу болбосун;
- clean modern educational illustration;
- landscape 16:9 композициясында болсун.

Мисалы:
"Modern educational illustration of a right triangle showing geometric relationships, clean blue background, no text, professional classroom presentation, landscape 16:9"

ЖООП JSON ГАНА БОЛСУН.
Markdown жазба.
\`\`\` белгилерин колдонбо.

Формат:

{
  "topic": "${topic}",
  "grade": "${grade}",
  "language": "${language}",
  "style": "${style || "VIP"}",
  "slides": [
    {
      "title": "Слайддын аталышы",
      "points": [
        "Биринчи пункт",
        "Экинчи пункт",
        "Үчүнчү пункт"
      ],
      "imagePrompt": "English image generation prompt here"
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
    } catch (error) {
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
    presentation.style = style || "VIP";

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
