export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response("JSON hatası", { status: 400 });
  }

  const email = data.email;
  if (!email) return new Response("Email gerekli", { status: 400 });

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

  if (res.status === 409) {
    return new Response("duplicate", { status: 409 });
  }

  if (!res.ok) return new Response("Supabase hatası", { status: 500 });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
