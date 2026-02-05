export async function onRequestPost({ request, env }) {
  try {
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("JSON hatası", { status: 400 });
    }

    const email = data.email?.toLowerCase();
    if (!email) {
      return new Response("Email gerekli", { status: 400 });
    }

    // 1️⃣ Supabase insert
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "resolution=ignore-duplicates"
      },
      body: JSON.stringify({ email })
    });

    const isDuplicate = res.status === 409;

    if (!res.ok && !isDuplicate) {
      return new Response("Supabase hatası", { status: 500 });
    }

    // 2️⃣ Her durumda bilgilendirme maili
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AIKariyer <noreply@aikariyer.com>",
        to: [email],
        subject: "🎉 AIKariyer – Kaydınız Alındı",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Merhaba 👋</h2>
            <p>
              <strong>AIKariyer</strong> için ${
                isDuplicate
                  ? "daha önce kayıt oluşturmuştunuz"
                  : "kay­dınız başarıyla alındı"
              }.
            </p>
            <p>
              Yapay zekâ destekli kariyer asistanımız yayına girdiğinde
              sizi ilk haberdar edeceğiz 🚀
            </p>
            <p style="margin-top:24px">
              İlginiz için teşekkür ederiz.<br/>
              <strong>AIKariyer Ekibi</strong>
            </p>
            <hr/>
            <small>Bu e-posta otomatik gönderilmiştir. Yanıtlamayınız.</small>
          </div>
        `
      })
    });

    // 3️⃣ Frontend cevabı
    if (isDuplicate) {
      return new Response("DUPLICATE", { status: 200 });
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
