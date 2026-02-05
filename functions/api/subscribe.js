export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response("Email gerekli", { status: 400 });
    }

    // Supabase insert
    await fetch(`${env.SUPABASE_URL}/rest/v1/subscribers`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ email })
    });

    // MailChannels (fail-safe)
    try {
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: {
            email: "noreply@aikariyer.com",
            name: "AIKariyer"
          },
          subject: "🎉 AIKariyer – Kaydınız Alındı",
          content: [{
            type: "text/html",
            value: "<p>Kaydınız başarıyla alınmıştır.</p>"
          }]
        })
      });
    } catch (mailErr) {
      // Mail gitmese bile kullanıcıyı üzmüyoruz
      console.warn("Mail gönderilemedi:", mailErr);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
