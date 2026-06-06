// --- STATE VARIABLES ---
let deck = [];
let currentIndex = 0;
let score = 10;

// --- DOM ELEMENTS ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const mediaContainer = document.getElementById('media-container');
const scoreDisplay = document.getElementById('score-val');

const redditInput = document.getElementById('subreddit-input');
const startRedditBtn = document.getElementById('start-reddit-btn');
const localUploadInput = document.getElementById('local-upload');
const startLocalBtn = document.getElementById('start-local-btn');

// --- HELPER: SHUFFLE DECK ---
function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- INITIALIZE GAME ---
function startGame() {
    if (deck.length === 0) return;
    score = 10;
    scoreDisplay.innerText = score;
    currentIndex = 0;
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    renderCard();
}

// --- OPTION A: REDDIT FETCH (Top 50 of Month + Proxy) ---
startRedditBtn.addEventListener('click', async () => {
    let sub = redditInput.value.split(',')[0].trim() || "pics";
    startRedditBtn.innerText = "Fetching...";

    try {
        // Wrap the Reddit URL in a proxy so it doesn't get blocked
        const targetUrl = encodeURIComponent(`https://www.reddit.com/r/${sub}/top.json?t=month&limit=50`);
        const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;
        
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const json = JSON.parse(proxyData.contents);

        if (!json.data || !json.data.children) {
            alert("Subreddit not found. Try 'luxurycars' or 'movieposters'.");
            startRedditBtn.innerText = "Fetch Reddit";
            return;
        }

        deck = [];
        json.data.children.forEach(post => {
            let url = post.data.url;
            // Does it look like a video or gif?
            let isVideo = post.data.is_video || url.endsWith('.mp4') || url.endsWith('.webm');
            let isImage = url.match(/\.(jpeg|jpg|gif|png)$/) != null;

            if (isVideo || isImage) {
                deck.push({
                    url: url,
                    type: isVideo ? 'video' : 'image'
                });
            }
        });

        if (deck.length === 0) {
            alert("No images or videos found here this month!");
            startRedditBtn.innerText = "Fetch Reddit";
            return;
        }

        shuffleDeck(deck); // Shuffle the Reddit posts so it's not strictly 1 to 50
        startGame();

    } catch (error) {
        alert("Reddit proxy failed. Try again or use Local Upload.");
        startRedditBtn.innerText = "Fetch Reddit";
    }
});

// --- OPTION B: LOCAL UPLOAD (Images + Videos) ---
startLocalBtn.addEventListener('click', () => {
    const files = localUploadInput.files;
    if (files.length < 3) {
        alert("Please select at least 3 photos/videos to play!");
        return;
    }

    deck = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let isVideo = file.type.startsWith('video');
        
        deck.push({
            url: URL.createObjectURL(file), // Creates a safe local link
            type: isVideo ? 'video' : 'image'
        });
    }

    shuffleDeck(deck); // Randomize the camera roll!
    startGame();
});

// --- RENDER CARD (Handles both Images & Videos) ---
function renderCard() {
    if (currentIndex >= deck.length) {
        alert(`Deck complete! You survived with ${score} points.`);
        location.reload();
        return;
    }

    let cardData = deck[currentIndex];

    // Clear the container
    mediaContainer.innerHTML = "";

    if (cardData.type === 'video') {
        mediaContainer.innerHTML = `<video src="${cardData.url}" autoplay loop muted playsinline style="width: 100%; height: 350px; object-fit: cover; border-radius: 12px; margin-bottom: 15px; background: #000;"></video>`;
    } else {
        mediaContainer.innerHTML = `<img src="${cardData.url}" style="width: 100%; height: 350px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;">`;
    }
}

// --- BUTTON MATH & GAME LOOP ---
document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let cost = parseInt(e.target.getAttribute('data-cost'));
        score += cost;
        scoreDisplay.innerText = score;
        
        if (score <= 0) {
            alert("Bankrupt! You hit zero.");
            location.reload();
            return;
        }
        
        currentIndex++;
        renderCard();
    });
});
