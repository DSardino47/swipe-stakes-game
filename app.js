// --- STATE VARIABLES ---
let score = 10;
let deck = []; 
let currentCardIndex = 0;
let currentSub = ""; 
let isFetching = false; // Prevents the game from spamming the API

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
const scoreSpan = document.getElementById("score-val"); // Merged to a single counter
const cardContainer = document.getElementById("card");

// --- API FETCH & PRE-FETCH LOGIC ---
async function fetchImages(isAppending = false) {
    isFetching = true;
    
    if (!isAppending) {
        currentSub = subredditInput.value.split(',')[0].trim() || "pics";
        startBtn.innerText = "Fetching Images...";
    }

    try {
        const response = await fetch(`https://meme-api.com/gimme/${currentSub}/30`);
        const json = await response.json();
        
        if (json.code && !isAppending) {
            alert(`Error: ${json.message}. Try another subreddit!`);
            startBtn.innerText = "Start Playing";
            isFetching = false;
            return;
        }

        // Clean map the JSON data
        let newCards = (json.memes || []).map(post => ({
            title: post.title.substring(0, 50) + "...", 
            image: post.url
        }));

        if (!isAppending) {
            // First load
            deck = newCards;
            currentCardIndex = 0;
            setupScreen.style.display = "none";
            gameScreen.style.display = "block";
            renderCard();
        } else {
            // Endless Pre-fetching: quietly add them to the back of the deck
            deck = deck.concat(newCards);
            
            // Failsafe: If the player swiped so fast they actually hit the loading screen, render now
            if (currentCardIndex >= deck.length - newCards.length) {
                renderCard();
            }
        }

    } catch (error) {
        console.error("Fetch Error:", error); 
        if (!isAppending) {
            alert("Network error fetching images. Please try again.");
            startBtn.innerText = "Start Playing";
        }
    }
    
    isFetching = false; // Unlocks the fetcher for the next time we run low
}

// 1. Start the Game
startBtn.addEventListener("click", () => {
    score = 10;
    scoreSpan.innerText = score;
    fetchImages(false);
});

// 2. Process a Button Click (Rapid Fire Math)
function handleChoice(cost) {
    // Add the cost (negative costs will naturally subtract from the score)
    score += cost;
    scoreSpan.innerText = score;

    // Check for Bankruptcy immediately
    if (score <= 0) {
        cardContainer.innerHTML = `<h2 style="color: red; text-align: center; padding: 20px;">BANKRUPT!</h2>
                                   <p style="text-align: center;">You chased the high life and hit zero.</p>
                                   <button onclick="location.reload()" style="display:block; width:100%; padding:15px; background:#4a4e69; color:white; border-radius:8px; border:none; margin-top:20px; font-size: 18px; cursor:pointer;">Play Again</button>`;
        return;
    }

    currentCardIndex++;

    // THE MAGIC TRICK: Pre-fetch more images when we only have 5 left!
    if (deck.length - currentCardIndex < 5 && !isFetching) {
        fetchImages(true); 
    }

    // Render the next card (or a failsafe loading text if they swiped faster than the API)
    if (currentCardIndex >= deck.length) {
        cardContainer.innerHTML = `<h2 style="text-align: center; padding: 20px;">Loading more...</h2>`;
    } else {
        renderCard();
    }
}

// 3. Render the Card
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
        btn.style.backgroundColor = choice.cost < 0 ? "#ffe3e3" : "#e3ffe6"; // Light red for costs, green for gains
        if (choice.cost === 0) btn.style.backgroundColor = "#f0f0f0"; // Grey for skip
        btn.style.border = "1px solid #ccc";
        
        btn.addEventListener("click", () => {
            handleChoice(choice.cost);
        });

        optionsContainer.appendChild(btn);
    });
}
