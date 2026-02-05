import { createClient } from "@supabase/supabase-js";

export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response("Email gerekli", { status: 400 });
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1️⃣ Supabase'e ekle
    const { error } = await supabase
      .from("subscribers")
      .insert([{ email }]);

    // duplicate ise devam et ama mail gönder
    if (error && !error.message.includes("duplicate")) {
      return new Response("DB error", { status: 500 });
    }

    // 2️⃣ Resend ile mail gönder
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
      })
    });

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
