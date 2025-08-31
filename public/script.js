// modernize camera/detection + safe DOM + better overlay placement + token handling
const $ = (id) => document.getElementById(id)

const video = $("video") || $("videoEl") || $("video") // keep flexible
const toggleButton = $("toggleButton")
const expressionBox = $("expressionBox")
const recommendationsDiv = $("recommendations")
const canvasWrap = $("canvasWrap") || document.body // prefer wrapper, fallback to body

let isCameraOn = false
let stream
let detectIntervalId = null

// Load models once
const faceapi = window.faceapi // Declare the faceapi variable
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.ageGenderNet.loadFromUri("./models"),
])
  .then(() => {
    toggleButton?.addEventListener("click", toggleCamera)
  })
  .catch((e) => console.error("[v0] model load error:", e))

async function toggleCamera() {
  if (isCameraOn) stopCamera()
  else await startCamera()
}

async function startCamera() {
  if (!video) return console.error("[v0] Missing <video id='video'> element")
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.srcObject = stream
    isCameraOn = true
    if (toggleButton) toggleButton.textContent = "Stop Camera"
    await video.play() // ensure playback before starting detection
    startDetection()
  } catch (error) {
    console.error("[v0] camera error:", error)
  }
}

function stopCamera() {
  if (detectIntervalId) {
    clearInterval(detectIntervalId)
    detectIntervalId = null
  }
  const existing = canvasWrap.querySelector("canvas")
  if (existing) {
    const ctx = existing.getContext("2d")
    ctx.clearRect(0, 0, existing.width, existing.height)
    existing.remove()
  }
  if (stream) stream.getTracks().forEach((t) => t.stop())
  if (video) video.srcObject = null
  isCameraOn = false
  if (toggleButton) toggleButton.textContent = "Start Camera"
}

function startDetection() {
  if (!video) return

  // Avoid stacking multiple listeners/intervals
  if (detectIntervalId) {
    clearInterval(detectIntervalId)
    detectIntervalId = null
  }

  // remove any old canvas and create a fresh one over the video
  const old = canvasWrap.querySelector("canvas")
  if (old) old.remove()

  const canvas = faceapi.createCanvasFromMedia(video)
  canvas.style.display = "block"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvasWrap.appendChild(canvas)

  faceapi.matchDimensions(canvas, { height: video.videoHeight || video.height, width: video.videoWidth || video.width })

  detectIntervalId = setInterval(async () => {
    if (!isCameraOn) return

    const dims = { height: video.videoHeight || video.height, width: video.videoWidth || video.width }
    faceapi.matchDimensions(canvas, dims)

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const resized = faceapi.resizeResults(detections, dims)

    faceapi.draw.drawDetections(canvas, resized)
    faceapi.draw.drawFaceLandmarks(canvas, resized)
    faceapi.draw.drawFaceExpressions(canvas, resized)

    resized.forEach((d) => {
      const drawBox = new faceapi.draw.DrawBox(d.detection.box, {
        label: `${Math.round(d.age)} year old ${d.gender}`,
      })
      drawBox.draw(canvas)

      const exps = d.expressions || {}
      const max = Math.max(...Object.values(exps), Number.NEGATIVE_INFINITY)
      const dominant = Object.keys(exps).find((k) => exps[k] === max)
      if (expressionBox && dominant) expressionBox.value = dominant
    })
  }, 140) // slightly throttled for performance
}

// Optional: use your mapping to broaden search
const emotionGenreMapping = {
  happy: ["happy", "latino", "pop"],
  sad: ["sad", "acoustic", "blues"],
  angry: ["metal", "rock", "punk"],
  neutral: ["pop", "classical", "jazz"],
  surprise: ["electronic", "k-pop", "dance"],
  fearful: ["classical", "ambient", "new-age"],
}

// Build a Spotify search query from emotion
function buildQuery(emotion = "neutral") {
  const terms = emotionGenreMapping[emotion] || [emotion]
  // Prefer generic text search; genre: filters are not always consistent
  return encodeURIComponent(terms.join(" OR "))
}

async function getRecommendations(emotion) {
  try {
    const token = (window.SPOTIFY_TOKEN || (SpotifyAuth.loadToken()?.access_token) || "").trim();
    if (!token) {
      console.warn("[v0] Missing Spotify token. Complete login first.")
      const statusEl = document.getElementById("status")
      if (statusEl) statusEl.textContent = "Please login with Spotify first."
      return
    }
    const q = buildQuery(emotion)
    const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error("[v0] Spotify API error:", res.status, errText)
      const statusEl = document.getElementById("status")
      if (statusEl) statusEl.textContent = "Spotify request failed. Try re-login."
      return
    }
    const data = await res.json()
    displayRecommendations(data?.tracks?.items || [])
  } catch (error) {
    console.error("[v0] Error fetching recommendations:", error)
    const statusEl = document.getElementById("status")
    if (statusEl) statusEl.textContent = "Unexpected error. Check console."
  }
}

function displayRecommendations(tracks) {
  if (!recommendationsDiv) return
  recommendationsDiv.innerHTML = ""

  let rowDiv = document.createElement("div")
  rowDiv.className = "row"

  tracks.forEach((track, index) => {
    if (index > 0 && index % 4 === 0) {
      recommendationsDiv.appendChild(rowDiv)
      rowDiv = document.createElement("div")
      rowDiv.className = "row"
    }

    const card = document.createElement("div")
    card.className = "track"

    const img = document.createElement("img")
    img.className = "song-image"
    img.alt = track?.name || "Track cover"
    img.src = track?.album?.images?.[0]?.url || "/placeholder.svg?height=200&width=320"
    img.addEventListener("click", () => {
      const url = track?.external_urls?.spotify
      if (url) window.open(url, "_blank", "noopener,noreferrer")
    })

    const name = document.createElement("p")
    name.className = "song-name"
    name.textContent = track?.name || "Untitled"

    card.append(img, name)
    rowDiv.appendChild(card)
  })

  recommendationsDiv.appendChild(rowDiv)
}

// Button bindings (guard missing nodes)
$("search")?.addEventListener("click", () => getRecommendations(expressionBox?.value || "neutral"))
$("happy")?.addEventListener("click", () => getRecommendations("happy"))
$("sad")?.addEventListener("click", () => getRecommendations("sad"))
$("angry")?.addEventListener("click", () => getRecommendations("angry"))
$("neutral")?.addEventListener("click", () => getRecommendations("neutral"))
$("surprise")?.addEventListener("click", () => getRecommendations("surprise"))
$("fearful")?.addEventListener("click", () => getRecommendations("fearful"))
