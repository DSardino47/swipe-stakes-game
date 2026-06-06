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
    // Clean up the input
    let sub = subredditQuery.split(',')[0].trim();
    if (!sub) sub = "pics"; 
    
    startBtn.innerText = "Fetching Images...";

    try {
        // THE FIX: Using a dedicated Reddit Image API to bypass CORS entirely
        const response = await fetch(`https://meme-api.com/gimme/${sub}/30`);
        const json = await response.json();
        
        // If the API returns an error (like a misspelled subreddit)
        if (json.code) {
            alert(`Error: ${json.message}. Try another subreddit!`);
            startBtn.innerText = "Start Playing";
            return;
        }

        deck = []; 
        
        // This API already filters for pure images! We just loop and push.
        json.memes.forEach(post => {
            deck.push({
                title: post.title.substring(0, 50) + "...", 
                image: post.url
            });
        });

        // Hide setup and start the game
        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        renderCard();

    } catch (error) {
        console.error("Fetch Error:", error); 
        alert("Network error fetching images. Please try again.");
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
