// --- STATE VARIABLES ---
let baseline = 10;
let trayPoints = 0;
let deck = []; // This will now hold real Reddit posts!
let currentCardIndex = 0;

// Universal choices for every card
const choices = [
    { text: "It's okay (+1)", cost: 1 },
    { text: "I want this (-2)", cost: -2 },
    { text: "This is elite (-9)", cost: -9 },
    { text: "My absolute favorite (-25)", cost: -25 }
];

// --- HTML ELEMENTS ---
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const subredditInput = document.getElementById("subreddit-input");

const titleElement = document.getElementById("card-title");
const imageContainer = document.getElementById("card-image-placeholder");
const optionsContainer = document.getElementById("options-container");
const baselineSpan = document.getElementById("baseline-val");
const traySpan = document.getElementById("tray-val");
const cardContainer = document.getElementById("card");

// --- REDDIT API LOGIC ---

async function fetchRedditData(subredditQuery) {
    let sub = subredditQuery.split(',')[0].trim();
    if (!sub) sub = "pics"; 
    
    startBtn.innerText = "Fetching...";

    try {
        // The Alternative Proxy Fix
const targetUrl = encodeURIComponent(`https://www.reddit.com/r/${sub}/hot.json?limit=50`);
const proxyUrl = `https://corsproxy.io/?${targetUrl}`;
        
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        
        // The proxy returns the Reddit data inside a string, so we parse it
        const json = JSON.parse(proxyData.contents);
        const posts = json.data.children;
        
        deck = []; 
        
        posts.forEach(post => {
            let url = post.data.url;
            // Grab jpgs, pngs, and gifs!
            if (url && (url.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
                deck.push({
                    title: post.data.title.substring(0, 50) + "...", 
                    image: url
                });
            }
        });

        if (deck.length === 0) {
            alert("No images found! Try 'luxurycars' or 'movieposters'.");
            startBtn.innerText = "Start Playing";
            return;
        }

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        renderCard();

    } catch (error) {
        console.error(error); // This prints the exact error to your developer console
        alert("Still having trouble reaching the API. Try refreshing.");
        startBtn.innerText = "Start Playing";
    }
}

// 1. Start the Game (Now hooked up to your input box!)
startBtn.addEventListener("click", () => {
    let query = subredditInput.value;
    fetchRedditData(query);
});

// 2. Process a Button Click (With fixed Game Over logic)
function handleChoice(cost) {
    if (cost > 0) {
        trayPoints += cost; 
    } else {
        let absoluteCost = Math.abs(cost);
        if (trayPoints >= absoluteCost) {
            trayPoints -= absoluteCost; 
        } else {
            let remainder = absoluteCost - trayPoints;
            trayPoints = 0; 
            baseline -= remainder; 
        }
    }

    // Update numbers
    baselineSpan.innerText = baseline;
    traySpan.innerText = trayPoints;

    // The True Bankruptcy Fix
    if (baseline <= 0) {
        // Instead of reloading, we freeze the game and show a message
        cardContainer.innerHTML = `<h2 style="color: red; text-align: center; padding: 20px;">BANKRUPT!</h2>
                                   <p style="text-align: center;">You spent more points than you had.</p>
                                   <button onclick="location.reload()" style="display:block; width:100%; padding:15px; background:#4a4e69; color:white; border-radius:8px; border:none; margin-top:20px;">Try Again</button>`;
        return;
    }

    // Move to next card
    currentCardIndex++;
    if (currentCardIndex < deck.length) {
        renderCard();
    } else {
        cardContainer.innerHTML = `<h2>Deck Complete!</h2><p>You survived with ${baseline + trayPoints} total points.</p>`;
    }
}

// 3. Render the Card
function renderCard() {
    let cardData = deck[currentCardIndex];
    titleElement.innerText = cardData.title;

    // Render the real Reddit image
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
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "8px";
        btn.style.backgroundColor = "#f0f0f0";
        btn.style.border = "1px solid #ccc";
        
        btn.addEventListener("click", () => {
            handleChoice(choice.cost);
        });

        optionsContainer.appendChild(btn);
    });
}
