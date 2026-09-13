export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST гана уруксат берилет"
    });
  }


  try {

    const {
      subject,
      grade,
      slides,
      language,
      style,
      lessonType,
      topic,
      extra
    } = req.body || {};


    if (!subject) {
      return res.status(400).json({
        error: "Предмет тандалган жок"
      });
    }


    if (!grade) {
      return res.status(400).json({
        error: "Класс тандалган жок"
      });
    }


    if (!topic) {
      return res.status(400).json({
        error: "Сабактын темасы жазылган жок"
      });
    }


    const apiKey =
      process.env.OPENAI_API_KEY;


    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY табылган жок"
      });
    }


    const slideCount =
      Number(slides) || 10;


    const prompt = `
Сен профессионал мектеп мугалими жана презентация түзүүчү AI'сың.

Мага мектеп сабагына даяр презентация түз.

ПРЕДМЕТ:
${subject}

КЛАСС:
${grade}

ТЕМА:
${topic}

САБАКТЫН ТҮРҮ:
${lessonType || "Жаңы тема"}

ТИЛ:
${language || "Кыргызча"}

ДИЗАЙН:
${style || "VIP"}

СЛАЙД САНЫ:
${slideCount}

КОШУМЧА ТАЛАП:
${extra || "Жок"}


МААНИЛҮҮ ТАЛАПТАР:

1. Так ${slideCount} слайд түз.

2. Мазмун ${grade} окуучуларына түшүнүктүү болсун.

3. Текст өтө узун болбосун.

4. Ар бир слайдда:
- так аталыш
- 2ден 5ке чейин негизги пункт болсун.

5. Биринчи слайд:
- теманын аталышы
- кыскача киришүү.

6. Ортоңку слайддар:
- негизги түшүндүрмөлөр
- мисалдар
- кызыктуу фактылар
- керектүү формулалар же терминдер.

7. Акыркы слайд:
- жыйынтык
же
- окуучулар үчүн суроолор.

8. Предметке жараша мазмун түз:

Математика / Алгебра / Геометрия:
формула, мисал, эсеп, түшүндүрмө.

Физика:
физикалык мыйзам, формула, өлчөө бирдиги, мисал.

Химия:
элементтер, реакциялар, формулалар, түшүнүктөр.

Биология:
организмдер, клетка, системалар, процесстер.

География:
өлкөлөр, жаратылыш, карта, климат, жер бедери.

Тарых:
даталар, окуялар, инсандар, себеп жана натыйжа.

Кыргыз тили / Орус тили / Англис тили:
эрежелер, мисалдар, сөздөр, сүйлөмдөр.

Адабият:
чыгарма, автор, каармандар, негизги ой.

Информатика:
компьютер, алгоритм, программа, технология.

Астрономия:
планеталар, космос, жылдыздар, астрономиялык түшүнүктөр.

Жаратылыш таануу / Экология:
жаратылыш, экосистема, айлана-чөйрө.

Экономика:
акча, рынок, киреше, чыгаша, негизги түшүнүктөр.

Укук / Адам жана коом:
укук, милдет, коом, мамлекеттик жана социалдык түшүнүктөр.

Музыка:
музыкалык терминдер, аспаптар, жанрлар.

Көркөм өнөр:
түстөр, композиция, сүрөт искусствосу.

Дене тарбия:
спорт, көнүгүү, ден соолук жана коопсуздук.

Технология:
курал-жабдык эмес, мектептик технология сабагына ылайык
коопсуз жана билим берүүчү теориялык мазмун түз.


ЖООПТУ JSON ГАНА КАЙТАР.

Башка түшүндүрмө жазба.

Формат так ушундай болсун:

{
  "topic": "${topic}",
  "subject": "${subject}",
  "grade": "${grade}",
  "language": "${language || "Кыргызча"}",
  "style": "${style || "VIP"}",
  "lessonType": "${lessonType || "Жаңы тема"}",
  "slides": [
    {
      "title": "Слайддын аталышы",
      "points": [
        "Биринчи маалымат",
        "Экинчи маалымат",
        "Үчүнчү маалымат"
      ]
    }
  ]
}
`;


    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            model: "gpt-5.6-luna",

            input: prompt,

            reasoning: {
              effort: "none"
            }
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "OPENAI ERROR:",
        JSON.stringify(data)
      );

      return res.status(
        response.status
      ).json({
        error:
          data?.error?.message ||
          "OpenAI жооп берген жок"
      });
    }


    let text = "";


    if (
      typeof data.output_text === "string"
    ) {

      text =
        data.output_text;

    } else if (
      Array.isArray(data.output)
    ) {

      for (const item of data.output) {

        if (
          !Array.isArray(item.content)
        ) {
          continue;
        }


        for (
          const content
          of item.content
        ) {

          if (
            typeof content.text === "string"
          ) {

            text += content.text;

          }

        }

      }

    }


    if (!text) {

      console.error(
        "NO OUTPUT:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        error:
          "AI текст кайтарган жок"
      });
    }


    /*
      Кээде AI JSON'ду
      ```json
      ...
      ```
      деп кайтарышы мүмкүн.

      Ошол белгилерди тазалайбыз.
    */

    text =
      text.trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();


    let presentation;


    try {

      presentation =
        JSON.parse(text);

    } catch (parseError) {

      console.error(
        "JSON PARSE ERROR:",
        text
      );

      return res.status(500).json({
        error:
          "AI презентацияны туура форматта кайтарган жок. Кайра аракет кылыңыз."
      });
    }


    if (
      !presentation ||
      !Array.isArray(
        presentation.slides
      )
    ) {

      return res.status(500).json({
        error:
          "AI слайддарды кайтарган жок"
      });
    }


    /*
      Предмет жана башка
      маалыматтарды сервер өзү
      кайра так жазып коёт.
    */

    presentation.subject =
      subject;

    presentation.grade =
      grade;

    presentation.topic =
      topic;

    presentation.language =
      language || "Кыргызча";

    presentation.style =
      style || "VIP";

    presentation.lessonType =
      lessonType || "Жаңы тема";


    return res.status(200).json({
      success: true,
      presentation: presentation
    });


  } catch (error) {

    console.error(
      "SERVER ERROR:",
      error
    );


    return res.status(500).json({
      error:
        error.message ||
        "Серверде ката кетти"
    });

  }

}
