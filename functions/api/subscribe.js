export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email) {
    return new Response("Email gerekli", { status: 400 });
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "resolution=ignore-duplicates"
    },
    body: JSON.stringify({
      email: email.toLowerCase(),
      source: "coming-soon"
    })
  });

  if (!res.ok) {
    return new Response("Bir hata oluştu", { status: 500 });
  }

  return new Response(`
    <html>
      <body style="font-family:system-ui;text-align:center;padding:40px">
        <h2>Teşekkürler 🎉</h2>
        <p>AIKariyer yayına açıldığında seni bilgilendireceğiz.</p>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" }});
}
