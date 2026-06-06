// --- STATE VARIABLES ---
let score = 10;
let deck = []; 
let currentCardIndex = 0;

const choices = [
    { text: "Skip (0)", cost: 0 },
    { text: "It's okay (+1)", cost: 1 },
    { text: "I want this (-2)", cost: -2 },
    { text: "This is elite (-9)", cost: -9 },
    { text: "My absolute favorite (-25)", cost: -25 }
];

// --- HTML ELEMENTS ---
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");

// Buttons & Inputs
const startRedditBtn = document.getElementById("start-reddit-btn");
const subredditInput = document.getElementById("subreddit-input");
const startLocalBtn = document.getElementById("start-local-btn");
const localUploadInput = document.getElementById("local-upload");

const titleElement = document.getElementById("card-title");
const imageContainer = document.getElementById("card-image-placeholder");
const optionsContainer = document.getElementById("options-container");
const scoreSpan = document.getElementById("score-val"); 
const cardContainer = document.getElementById("card");

// --- INITIALIZE GAME ---
function startGame() {
    score = 10;
    scoreSpan.innerText = score;
    currentCardIndex = 0;
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    renderCard();
}

// --- OPTION A: FETCH REDDIT (Top of the Month) ---
async function fetchRedditTopMonth() {
    let sub = subredditInput.value.split(',')[0].trim() || "pics";
    startRedditBtn.innerText = "Fetching...";

    try {
        // Direct Reddit API fetch targeting the top 50 posts of the current month
        const response = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=month&limit=50`);
        const json = await response.json();
        
        if (!json.data || !json.data.children) {
            alert("Could not find that subreddit. Try another one!");
            startRedditBtn.innerText = "Fetch Reddit";
            return;
        }

        const posts = json.data.children;
        deck = []; 
        
        posts.forEach(post => {
            let url = post.data.url;
            // Filter strictly for images, ignoring text posts and videos
            if (url && (url.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
                deck.push({
                    title: post.data.title.substring(0, 50) + "...", 
                    image: url
                });
            }
        });

        if (deck.length === 0) {
            alert("No images found in that Subreddit this month! Try another one.");
            startRedditBtn.innerText = "Fetch Reddit";
            return;
        }

        startGame();

    } catch (error) {
        console.error("Reddit API Error:", error); 
        alert("Reddit blocked the request or the API is down. Try playing with Local Photos instead!");
        startRedditBtn.innerText = "Fetch Reddit";
    }
}

startRedditBtn.addEventListener("click", fetchRedditTopMonth);

// --- OPTION B: PLAY LOCAL CAMERA ROLL ---
startLocalBtn.addEventListener("click", () => {
    const files = localUploadInput.files;
    
    if (files.length < 5) {
        alert("Please select at least 5 photos from your device to play!");
        return;
    }

    deck = [];
    
    // Loop through the uploaded files and instantly turn them into playable game cards
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        deck.push({
            title: `Local Photo ${i + 1}`, // Generic title for local files
            image: URL.createObjectURL(file) // Magical JS function that creates a temporary instant image link
        });
    }

    startGame();
});

// --- CORE GAME LOOP ---
function handleChoice(cost) {
    score += cost;
    scoreSpan.innerText = score;

    if (score <= 0) {
        cardContainer.innerHTML = `<h2 style="color: red; text-align: center; padding: 20px;">BANKRUPT!</h2>
                                   <p style="text-align: center;">You hit zero points.</p>
                                   <button onclick="location.reload()" style="display:block; width:100%; padding:15px; background:#4a4e69; color:white; border-radius:8px; border:none; margin-top:20px; font-size: 18px; cursor:pointer;">Play Again</button>`;
        return;
    }

    currentCardIndex++;

    if (currentCardIndex >= deck.length) {
        cardContainer.innerHTML = `<h2 style="text-align: center; padding: 20px;">Deck Complete!</h2>
                                   <p style="text-align: center;">You survived with ${score} points.</p>
                                   <button onclick="location.reload()" style="display:block; width:100%; padding:15px; background:#4a4e69; color:white; border-radius:8px; border:none; margin-top:20px; font-size: 18px; cursor:pointer;">Play Again</button>`;
    } else {
        renderCard();
    }
}

// --- RENDER CARD ---
function renderCard() {
    if (!deck[currentCardIndex]) return; 

    let cardData = deck[currentCardIndex];
    titleElement.innerText = cardData.title;

    imageContainer.innerHTML = `<img src="${cardData.image}" style="width: 100%; max-width: 400px; height: 300px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">`;

    optionsContainer.innerHTML = ""; 

    choices.forEach(choice => {
        let btn = document.createElement("button");
        btn.innerText = choice.text;
        
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.maxWidth = "400px";
        btn.style.margin = "10px 0";
        btn.style.padding = "15px";
        btn.style.fontSize = "16px";
        btn.style.fontWeight = "bold";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "8px";
        btn.style.backgroundColor = choice.cost < 0 ? "#ffe3e3" : "#e3ffe6"; 
        if (choice.cost === 0) btn.style.backgroundColor = "#f0f0f0"; 
        btn.style.border = "1px solid #ccc";
        
        btn.addEventListener("click", () => {
            handleChoice(choice.cost);
        });

        optionsContainer.appendChild(btn);
    });
}
