export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST гана уруксат"
    });
  }

  try {

    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({
        error: "Сүрөт үчүн prompt жок"
      });
    }


    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY табылган жок"
      });
    }


    const finalPrompt = `
Create a professional educational mathematics presentation illustration.

Topic:
${prompt}

Requirements:
- educational mathematics visual
- modern clean design
- suitable for a school presentation
- landscape composition
- 16:9 style
- clear mathematical objects and diagrams when appropriate
- attractive but professional
- no text
- no words
- no letters
- no watermark
`;


    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: finalPrompt,
          size: "1536x1024",
          quality: "medium"
        })
      }
    );


    const data = await response.json();


    if (!response.ok) {

      console.error(
        "OPENAI IMAGE ERROR:",
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI сүрөт түзгөн жок"
      });
    }


    const imageData =
      data?.data?.[0]?.b64_json;


    if (!imageData) {

      console.error(
        "NO IMAGE DATA:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        error:
          "OpenAI сүрөт маалыматтарын кайтарган жок"
      });
    }


    return res.status(200).json({
      success: true,
      image:
        `data:image/png;base64,${imageData}`
    });


  } catch (error) {

    console.error(
      "IMAGE SERVER ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Сүрөт түзүүдө сервер катасы"
    });

  }
}
