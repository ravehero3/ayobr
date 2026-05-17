export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // 1. Get backend API URL from Cloudflare environment variables
  // Configure BACKEND_URL (e.g., 'https://ayobr-backend.onrender.com') in the Cloudflare Pages dashboard.
  const BACKEND_URL = context.env.BACKEND_URL || "https://ayobr-backend.onrender.com";
  
  // 2. Construct the target backend API URL
  const pathStr = params.path ? params.path.join('/') : '';
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${url.search}`;

  // 3. Clone and adjust headers
  const headers = new Headers(request.headers);
  const backendHost = new URL(BACKEND_URL).host;
  headers.set("host", backendHost);
  
  // 4. Handle request body
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.clone().arrayBuffer() : null;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: 'manual' // Standard 302 redirects (like Google OAuth) must be returned directly to the browser
    });
    
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: "Backend proxy error", details: err.message }), { 
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }
}
