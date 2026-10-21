let currentTab = "trending";
let trendingData = [];
let recommendedData = [];
let searchData = [];
let stockIndex = 0;
let stockData = [];




const stockEl = document.getElementById("stockBox"); 



// 🔐 LOAD APP
window.onload = async function () {
    const loggedIn = localStorage.getItem("loggedIn");


    if (loggedIn !== "true") {
        window.location.href = "login.html";
        return;
    }


    initializeNotifications();


    const user = localStorage.getItem("currentUser");
    document.getElementById("usernameDisplay").innerText = "Hi, " + user;
    


    // 🔥 LOAD NEWS
    trendingData = await fetchNews("");


       // Save current latest news
       await checkForBreakingNews();


       // Check every 1 minute
       setInterval(checkForBreakingNews, 60000);


    const topics = getSmartTopics();
    recommendedData = [];


    for (let topic of topics) {
        const data = await fetchNews(topic);
        recommendedData = recommendedData.concat(data);
    }


    recommendedData = shuffleArray(recommendedData);


   
    loadStocks();


    // ✅ EXTRA FEATURES
    startClock();
    getWeather();


    showTab("trending");



    // ✅ STOCK
    loadStocks();
} 


// 🔥 FETCH NEWS
async function fetchNews(query) {
    query = query ? query.trim() : "";


    try {
        const res = await fetch(`http://127.0.0.1:5000/news?q=${encodeURIComponent(query)}`);
        const data = await res.json();


        if (Array.isArray(data)) return data;
        if (data.articles) return data.articles;


        return [];
    } catch {
        return [];
    }
}


// 🔍 SEARCH
async function getNews() {


    console.log("✅ getNews called");


    const query = document.getElementById("search").value.trim();
    console.log("Query:", query);


    const container = document.getElementById("newsContainer");


    if (!query) {
        console.log("Query is empty");
        return;
    }


    container.innerHTML = "<h2>🔍 Searching...</h2>";


    try {
        const data = await fetchNews(query);
        console.log("Data received:", data);


        if (!data || data.length === 0) {
            container.innerHTML = "<p>No results found 😕</p>";
            return;
        }


        searchData = data;
        console.log("Calling showTab()");
        showTab("search");


    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error fetching news 😕</p>";
    }
}


// 🤖 AI LOGIC
function getSmartTopics() {
    let interests = JSON.parse(localStorage.getItem("interests")) || [];


    if (interests.length === 0) return ["technology", "india"];


    let count = {};
    interests.forEach(i => count[i] = (count[i] || 0) + 1);


    return Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 3);
}


// 🔀 SHUFFLE
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}


// 🎨 DISPLAY NEWS
function displayNews(data) {


    const container = document.getElementById("newsContainer");


    if (!data || data.length === 0) {
        container.innerHTML += "<p>No news 😕</p>";
        return;
    }


    // Save data globally
    allNewsData = data;


    let html = "";


    data.forEach((n, i) => {


        const fake = detectFakeNews(n);


        html += `
        <div class="card">


            ${n.image ? `<img src="${n.image}" alt="News Image">` : ""}


            <div class="content">


                <h3>${n.title}</h3>


                <p>${n.description || ""}</p>


                <small style="color:${fake.color};font-weight:bold;">
                    ${fake.label}
                </small>


                <div class="actions">


                    <button onclick="saveNews(getNewsItem(${i}))">❤️</button>


                    <button onclick="likeNews(this)">👍</button>


                    <button onclick="speakNews(${JSON.stringify(n.title)})">🔊</button>


                    ${
                        currentTab === "recommended"
                        ? `<button onclick="removeFromRecommended(${JSON.stringify(n.title)})">🚫</button>`
                        : ""
                    }


                    <a href="${n.url}" target="_blank">📖</a>


                </div>


            </div>


        </div>
        `;
    });


    container.innerHTML += html;
}



function removeFromRecommended(title) {
    let removed = JSON.parse(localStorage.getItem("removedNews")) || [];


    removed.push(title);
    localStorage.setItem("removedNews", JSON.stringify(removed));


    recommendedData = recommendedData.filter(n => n.title !== title);


    showTab("recommended");
}



// 🔥 TAB SWITCH
function showTab(tab, el) {
    currentTab = tab;


    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    if (el) el.classList.add("active");


    const c = document.getElementById("newsContainer");
    c.innerHTML = "";


    if (tab === "trending") {
        c.innerHTML = "<h2>🔥 Trending</h2>";
        displayNews(trendingData);
    }


    if (tab === "recommended") {
        c.innerHTML = "<h2>⭐ Recommended</h2>";
        displayNews(recommendedData);
    }


    if (tab === "search") {
        c.innerHTML = "<h2>🔍 Results</h2>";
        displayNews(searchData);
    }
}


// ⏰ TIME (REAL-TIME)
function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById("timeBox").innerText =
            "⏰ " + now.toLocaleTimeString();
    }, 1000);
}


// 🌦️ WEATHER (NO API KEY)
async function getWeather() {
    const el = document.getElementById("weatherBox");


    if (!navigator.geolocation) {
        el.innerText = "🌤️ Location not supported";
        return;
    }


    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;


            // 🌦️ WEATHER
            const w = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            const wd = await w.json();


            const temp = wd?.current_weather?.temperature ?? "--";
            const code = wd?.current_weather?.weathercode;


            // 🎯 ICON LOGIC
            let icon = "🌤️";


            if (code === 0) icon = "☀️"; // clear
            else if ([1, 2, 3].includes(code)) icon = "⛅"; // partly cloudy
            else if ([45, 48].includes(code)) icon = "🌫️"; // fog
            else if ([51, 53, 55].includes(code)) icon = "🌦️"; // drizzle
            else if ([61, 63, 65].includes(code)) icon = "🌧️"; // rain
            else if ([71, 73, 75].includes(code)) icon = "❄️"; // snow
            else if ([95, 96, 99].includes(code)) icon = "⛈️"; // thunder


            // 📍 LOCATION
            const l = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const ld = await l.json();


            const city =
                ld.address.city ||
                ld.address.town ||
                ld.address.village ||
                ld.address.state ||
                "Your Location";


            // ✅ FINAL OUTPUT
            el.innerText = `${icon} ${temp}°C • ${city}`;


        } catch (err) {
            console.log(err);
            el.innerText = "🌤️ Error";
        }
    }, () => {
        el.innerText = "🌤️ Allow location";
    });
}


// 📈 STOCK
async function loadStocks() {
    try {
        const res = await fetch("stocks.json");
        stockData = await res.json();


        updateStock();
        setInterval(updateStock, 3000);


    } catch (err) {
        console.log(err);
        if (stockEl) stockEl.innerText = "📈 Stock error";
    }
}


function updateStock() {
    if (!stockEl || stockData.length === 0) return;


    const s = stockData[stockIndex];


    let color = s.change >= 0 ? "green" : "red";
    let symbol = s.change >= 0 ? "🟢" : "🔴";


    stockEl.innerHTML = `
        📈 ${s.name}: ₹${s.price} 
        <span style="color:${color}; font-weight:bold;">
            ${symbol} ${s.change > 0 ? "+" : ""}${s.change}
        </span>
    `;


    stockIndex = (stockIndex + 1) % stockData.length;
}



// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}


async function loadCategory(topic) {
    const c = document.getElementById("newsContainer");


    c.innerHTML = `<h2>🔎 ${topic}</h2>`;


    const data = await fetchNews(topic);


    displayNews(data);
}



// ❤️ SAVE
function saveNews(news) {
    let saved = JSON.parse(localStorage.getItem("savedNews")) || [];


    // ❌ avoid duplicates
    if (saved.some(n => n.title === news.title)) {
        alert("Already saved!");
        return;
    }


    // 🎯 SMART CATEGORY DETECTION
    let text = (news.title + " " + (news.description || "")).toLowerCase();


    let category = "General";


    if (text.includes("ai") || text.includes("technology")) {
        category = "AI";
    } else if (text.includes("cricket")) {
        category = "Cricket";
    } else if (text.includes("stock") || text.includes("market")) {
        category = "Stocks";
    } else if (currentTab === "recommended") {
        category = "Recommended";
    }


    news.category = category;


    localStorage.setItem("savedNews", JSON.stringify(saved));


    alert("Saved ❤️");
}


// 👍 LIKE
function likeNews(btn) {
    btn.innerText = "👍 Liked";
}


// 🎤 SPEAK
function speakNews(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speechSynthesis.speak(speech);
}


// dark mode toggle
function toggleTheme() {
    document.body.classList.toggle("dark-mode");


    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}


const savedTheme = localStorage.getItem("theme");


if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}



// 🔥 FAKE NEWS DETECTION (VERY BASIC)
function detectFakeNews(news) {
    const text = (news.title + " " + (news.description || "")).toLowerCase();


    let score = 0;


    // 🚨 strong fake signals
    const strong = [
        "100% true", "guaranteed", "miracle", "shocking",
        "you won't believe", "viral claim", "breaking!!!"
    ];


    // ⚠️ medium signals
    const medium = [
        "rumor", "unverified", "sources say", "allegedly"
    ];


    // ✅ good signals (trusted tone)
    const legit = [
        "official", "report", "confirmed", "government", "study"
    ];


    strong.forEach(w => { if (text.includes(w)) score += 3; });
    medium.forEach(w => { if (text.includes(w)) score += 2; });
    legit.forEach(w => { if (text.includes(w)) score -= 2; });


    // 🎯 FINAL RESULT
    if (score >= 4) return { label: "⚠️ Likely Fake", color: "red" };
    if (score >= 2) return { label: "🟡 Suspicious", color: "orange" };
    return { label: "✅ Likely Real", color: "green" };
}



// 🎤 VOICE SEARCH
function startVoiceSearch() {


    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;


    if (!SpeechRecognition) {
        alert("Voice Search is not supported.");
        return;
    }


    const recognition = new SpeechRecognition();


    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;


    recognition.onstart = function () {
        console.log("🎤 Listening...");
    };


    recognition.onresult = function (event) {
        const text = event.results[0][0].transcript;


        console.log("You said:", text);


        document.getElementById("search").value = text;


        getNews();
    };


    recognition.onerror = function (event) {
        console.log(event.error);
        alert("Error: " + event.error);
    };


    recognition.onend = function () {
        console.log("Recognition ended.");
    };


    recognition.start();
}    

setInterval(checkForBreakingNews, 30000);