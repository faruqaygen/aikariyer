export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response("Email gerekli", { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    /* 1️⃣ VAR MI KONTROLÜ */
    const check = await fetch(
      `${env.SUPABASE_URL}/rest/v1/waitlist?email=eq.${normalizedEmail}&select=id`,
      {
        headers: {
          "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const existing = await check.json();
    const isDuplicate = existing.length > 0;

    /* 2️⃣ VARSA → DUR */
    if (isDuplicate) {
      return new Response("DUPLICATE", { status: 200 });
    }

    /* 3️⃣ YOKSA → INSERT */
    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: normalizedEmail })
    });

    if (!insert.ok) {
      return new Response("Supabase hatası", { status: 500 });
    }

    /* 4️⃣ SADECE YENİ KAYITTA MAIL */
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AIKariyer <noreply@aikariyer.com>",
        to: [normalizedEmail],
        subject: "🎉 AIKariyer – Kaydınız Alındı",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Merhaba 👋</h2>
            <p><strong>AIKariyer</strong> için kaydınız başarıyla alındı.</p>
            <p>Platform yayına girdiğinde sizi ilk haberdar edeceğiz 🚀</p>
            <p style="margin-top:24px">
              Teşekkürler,<br/>
              <strong>AIKariyer Ekibi</strong>
            </p>
          </div>
        `
      })
    });

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
