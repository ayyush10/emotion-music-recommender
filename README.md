Here’s a combined and polished `README.md` for your project, merging both the Emotion-Based Music Recommendation Application and the Spotify PKCE authorization flow documentation:

---

# Emotion-Based Music Recommendation Application

A web application that detects user emotions via facial recognition and recommends music from Spotify based on the detected mood. It integrates **Face API** for emotion detection and **Spotify API** with a secure PKCE flow for music recommendations.

---

## Features

* **Real-time Facial Expression Recognition:** Uses the webcam to capture user expressions.
* **Emotion Detection:** Identifies emotions such as happy, sad, angry, etc.
* **Music Recommendations:** Suggests songs based on detected emotions.
* **Spotify Integration:** Uses Spotify API to fetch and play songs securely with PKCE.
* **Authorization Code with PKCE:** Frontend-only secure authentication flow without exposing client secrets.

---

## Technologies Used

* **HTML & CSS:** Structure and styling
* **JavaScript:** Frontend functionality and logic
* **Face API:** Facial expression detection
* **Spotify API:** Music recommendations and playback
* **Web Crypto API:** Secure PKCE code challenge generation

---

## Prerequisites

* Basic knowledge of HTML, CSS, and JavaScript
* **Spotify Developer account** for API access
* **Face API** setup for emotion detection
* Local static server (e.g., VS Code Live Server)

---

## Installation & Setup

1. **Clone the repository:**

```bash
git clone https://github.com/charanteja-7/emotion-based-music-recommendation-system.git
```

2. **Set Up API Keys:**

* **Face API:** Follow [Face API documentation](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
* **Spotify API:** Follow [Spotify Developer documentation](https://developer.spotify.com/documentation/web-api/) to create an app and get your **Client ID**

3. **Configure Spotify PKCE:**

   * Set your Client ID in `js/spotify-auth.js`:

```js
const CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
```

* Register your Redirect URI(s) in your Spotify app dashboard (exact match required, e.g., `http://127.0.0.1:5500/callback.html`)
* Set required scopes in `js/spotify-auth.js`:

```js
const scopes = "user-read-private user-read-email";
```

---

## Project Structure

```
/public
├─ index.html
├─ facedetection.html
├─ callback.html
├─ style.css
├─ script.js
├─ /js
│  └─ spotify-auth.js
├─ /models
│  ├─ face-api.js
│  ├─ face-api.min.js
│  └─ face-api.js.map
.gitignore
README.md
vercel.json
odels                 # Face API models
```

---

## Usage

1. **Start the Application:**
   Serve the project using a local static server (e.g., VS Code Live Server) and open `index.html`.

2. **Login to Spotify:**
   Click the **Login to Spotify** button to authenticate via PKCE.

3. **Interact with the App:**

   * Allow camera access
   * Facial expressions are detected in real-time
   * Music is recommended and played based on your current emotion

---

## Troubleshooting

**Spotify Authorization Errors:**

* **400 Bad Request:** Usually a redirect URI mismatch

  * Ensure exact match between code and Spotify dashboard
  * Avoid double encoding the redirect URI
* **404 callback.html:** Check the path of your redirect URI matches the actual file location
* **PKCE / state errors:** Clear session/local storage and retry:

```js
sessionStorage.removeItem("spotify_auth_state");
sessionStorage.removeItem("spotify_code_verifier");
localStorage.removeItem("spotify_pkce_verifier");
```

**Face API Issues:**

* Verify that model files are correctly placed in `/models`
* Ensure camera permissions are granted

---

## Production Notes

* Add production Redirect URI(s) in Spotify dashboard
* Do **not** include client secrets in frontend code
* PKCE ensures secure token exchange for public clients
* Consider a backend if refresh tokens need secure handling

---

## Acknowledgements

* **Face API:** Facial expression detection
* **Spotify API:** Music recommendations
* **Open Source Libraries:** Various JS libraries used for development

---
