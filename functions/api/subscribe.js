export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response("Email gerekli", { status: 400 });
    }

    // 1️⃣ Supabase REST insert
    const supabaseRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({ email })
      }
    );

    if (!supabaseRes.ok && supabaseRes.status !== 409) {
      return new Response("DB error", { status: 500 });
    }

    // 2️⃣ Cloudflare MailChannels ile mail gönder
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }]
          }
        ],
        from: {
          email: "noreply@aikariyer.com",
          name: "AIKariyer"
        },
        subject: "🎉 AIKariyer – Kaydınız Alındı",
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family:Arial,sans-serif;line-height:1.6">
                <h2>Merhaba 👋</h2>
                <p>
                  <strong>AIKariyer</strong> için yaptığınız kayıt başarıyla alınmıştır.
                </p>
                <p>
                  Yapay zekâ destekli kariyer asistanımız yayına girdiğinde
                  sizi ilk haberdar edenlerden biri olacaksınız 🚀
                </p>
                <p style="margin-top:24px">
                  İlginiz için teşekkür ederiz.<br/>
                  <strong>AIKariyer Ekibi</strong>
                </p>
                <hr/>
                <small>
                  Bu e-posta otomatik olarak gönderilmiştir.  
                  Lütfen yanıtlamayınız.
                </small>
              </div>
            `
          }
        ]
      })
    });

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
