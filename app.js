// --- STATE VARIABLES ---
let baseline = 10;
let trayPoints = 0;
let deck = []; 
let currentCardIndex = 0;
let currentSub = ""; // We need to remember the subreddit to fetch more later

// --- THE NEW CHOICES (Added Skip!) ---
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
const startBtn = document.getElementById("start-btn");
const subredditInput = document.getElementById("subreddit-input");

const titleElement = document.getElementById("card-title");
const imageContainer = document.getElementById("card-image-placeholder");
const optionsContainer = document.getElementById("options-container");
const baselineSpan = document.getElementById("baseline-val");
const traySpan = document.getElementById("tray-val");
const cardContainer = document.getElementById("card");

// --- API FETCH & ENDLESS LOOP ---

// We added an 'isAppending' flag. If true, it adds to the deck instead of starting over.
async function fetchRedditData(subredditQuery, isAppending = false) {
    if (!isAppending) {
        currentSub = subredditQuery.split(',')[0].trim();
        if (!currentSub) currentSub = "pics"; 
        startBtn.innerText = "Fetching Images...";
    }

    try {
        const response = await fetch(`https://meme-api.com/gimme/${currentSub}/30`);
        const json = await response.json();
        
        if (json.code && !isAppending) {
            alert(`Error: ${json.message}. Try another subreddit!`);
            startBtn.innerText = "Start Playing";
            return;
        }

        let newCards = [];
        if (json.memes) {
            json.memes.forEach(post => {
                newCards.push({
                    title: post.title.substring(0, 50) + "...", 
                    image: post.url
                });
            });
        }

        if (!isAppending) {
            // First time starting the game
            deck = newCards;
            currentCardIndex = 0;
            setupScreen.style.display = "none";
            gameScreen.style.display = "block";
            renderCard();
        } else {
            // Endless Mode: Stitch the new cards to the back of the deck
            deck = deck.concat(newCards);
            renderCard(); // Show the newly fetched card
        }

    } catch (error) {
        console.error("Fetch Error:", error); 
        if (!isAppending) {
            alert("Network error fetching images. Please try again.");
            startBtn.innerText = "Start Playing";
        }
    }
}

// 1. Start the Game
startBtn.addEventListener("click", () => {
    // Reset points in case they are playing again without refreshing
    baseline = 10;
    trayPoints = 0;
    baselineSpan.innerText = baseline;
    traySpan.innerText = trayPoints;
    
    let query = subredditInput.value;
    fetchRedditData(query, false);
});

// 2. Process a Button Click
function handleChoice(cost) {
    // Only alter points if they didn't pick "Skip (0)"
    if (cost !== 0) {
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
    }

    baselineSpan.innerText = baseline;
    traySpan.innerText = trayPoints;

    // Check for Bankruptcy
    if (baseline <= 0) {
        cardContainer.innerHTML = `<h2 style="color: red; text-align: center; padding: 20px;">BANKRUPT!</h2>
                                   <p style="text-align: center;">You spent more points than you had.</p>
                                   <button onclick="location.reload()" style="display:block; width:100%; padding:15px; background:#4a4e69; color:white; border-radius:8px; border:none; margin-top:20px;">Try Again</button>`;
        return;
    }

    currentCardIndex++;
    
    // THE ENDLESS LOOP TRIGGER
    if (currentCardIndex >= deck.length) {
        // We reached the end of the current images. 
        cardContainer.innerHTML = `<h2 style="text-align: center; padding: 20px;">Loading more...</h2>`;
        // Fetch more images and append them!
        fetchRedditData(currentSub, true); 
    } else {
        renderCard();
    }
}

// 3. Render the Card
function renderCard() {
    // Failsafe in case we try to render while waiting for the endless fetch
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
