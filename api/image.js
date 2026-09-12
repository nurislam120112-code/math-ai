export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST гана уруксат берилет"
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
        error: "OPENAI_API_KEY коюлган эмес"
      });
    }

    const finalPrompt = `
${prompt}

Important:
- educational mathematics presentation illustration
- professional modern design
- landscape composition
- no words
- no letters
- no watermark
- clean classroom presentation visual
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
      console.error("Image API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Сүрөт түзүлгөн жок"
      });
    }

    const base64 = data?.data?.[0]?.b64_json;

    if (!base64) {
      return res.status(500).json({
        error: "Сүрөт маалыматтары келген жок"
      });
    }

    return res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64}`
    });

  } catch (error) {
    console.error("Image generation error:", error);

    return res.status(500).json({
      error: "Сүрөт түзүүдө сервер катасы кетти"
    });
  }
}
