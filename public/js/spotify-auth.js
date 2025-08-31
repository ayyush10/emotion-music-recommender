const SpotifyAuth = (() => {
  const CLIENT_ID = "2cb3f9d1752d46e8b7e5d397c2ab66b4"; 
  const SCOPES = [
    "user-read-private",
    "user-read-email",
  ].join(" ");

  function getRedirectUri() {
    const isLocal = ["127.0.0.1", "localhost"].includes(window.location.hostname)
return isLocal
? "[http://127.0.0.1:5500/public/callback.html](http://127.0.0.1:5500/public/callback.html)"
: "[https://emotionmusicrecommender-fnqua08mc-ayuysh10s-projects.vercel.app/callback.html](https://emotionmusicrecommender-fnqua08mc-ayuysh10s-projects.vercel.app/callback.html)";
  }

  const STATE_KEY = "spotify_auth_state";
  function generateState(len = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }

  function base64UrlEncode(str) {
    return btoa(String.fromCharCode(...new Uint8Array(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(digest);
  }

  async function buildAuthorizeUrl() {
    const redirectUri = getRedirectUri();
    const state = generateState(20);
    sessionStorage.setItem(STATE_KEY, state);

    const codeVerifier = generateState(64);
    sessionStorage.setItem("spotify_code_verifier", codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);

    return url.toString();
  }

  const TOKEN_KEY = "spotify_token_payload";

  function saveToken({ access_token, refresh_token, expires_in, token_type }) {
    const expires_at = Date.now() + Number(expires_in) * 1000;
    const payload = { access_token, refresh_token, token_type, expires_at };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
    return payload;
  }

  function loadToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      console.log("📦 Loaded token:", parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isTokenValid(payload) {
    if (!payload || !payload.access_token || !payload.expires_at) return false;
    return Date.now() < payload.expires_at - 5000;
  }

  return {
    STATE_KEY,
    buildAuthorizeUrl,
    saveToken,
    loadToken,
    clearToken,
    isTokenValid,
  };
})();
