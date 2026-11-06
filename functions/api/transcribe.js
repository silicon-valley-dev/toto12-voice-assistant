export async function onRequestPost({ request, env }) {
  try {
    // Memastikan Environment Variable GEMINI_API_KEY ada
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Secret GEMINI_API_KEY belum dipasang di Cloudflare Settings." },
        { status: 500 }
      );
    }

    const { audio, mimeType } = await request.json();
    if (!audio) {
      return Response.json({ error: "Data audio tidak ditemukan." }, { status: 400 });
    }

    const systemInstruction = `Anda adalah transkriptor profesional untuk customer service perbankan & e-wallet Indonesia TOTO12.
Tugas Anda: Salin audio yang diberikan menjadi teks Bahasa Indonesia yang sangat akurat.
Aturan Penting:
1. Pertahankan kata yang diucapkan tanpa mengarang atau menambah informasi yang tidak ada dalam audio.
2. Eja dengan akurat istilah CS seperti: TOTO12, Deposit, Withdraw, WD, LiveChat, QRIS, DANA, OVO, GoPay, BCA, BRI, BNI, Mandiri, CIMB, BSI, Bank Jago, Rollingan, Cashback, Rekening.
3. Tuliskan angka/nominal mata uang dan nomor rekening secara jelas dan rapi.
4. Jangan memberikan komentar atau intro, langsung berikan teks hasil transkripsinya saja.`;

    const modelName = "gemini-3-flash-preview";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: "Transkripsikan rekaman audio ini ke teks Bahasa Indonesia:" },
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: audio
              }
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "Gagal memproses dengan Gemini API." },
        { status: response.status }
      );
    }

    const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return Response.json({ text: transcribedText }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error) {
    return Response.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}