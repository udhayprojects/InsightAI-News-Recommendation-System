
// Notification Permission

async function initializeNotifications() {

    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return;
    }

    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
    
     updateNotificationUI();
}


// Show Notification

function showNotification(title, body, image, url) {

    if (Notification.permission !== "granted") return;

    const notification = new Notification(title, {
        body: body,
        icon: image || "Insightlogo.png"
    });

    notification.onclick = () => {
        window.focus();

        if (url) {
            window.open(url, "_blank");
        }
    };

    animateBell();
}

// ==========================================
// Notification History
// ==========================================

let notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

function addNotification(news){

    notifications.unshift({

        title:news.title,
        image:news.image,
        url:news.url,
        time:new Date().toLocaleString(),
        read:false

    });

    if(notifications.length>20){
        notifications.pop();
    }

    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );

    animateBell();

    updateNotificationUI();

}


// ===============================
// Latest News Tracker
// ===============================

// Stored only while page is open
let latestTitle = "";

// Stored permanently (even after refresh)
let lastNotifiedTitle = localStorage.getItem("lastNotifiedTitle") || "";


// Check Latest Breaking News

async function checkForBreakingNews() {

    try {

        const data = await fetchNews("");

        if (!data || data.length === 0) return;

        const latestNews = data[0];

        // First page load
        async function updateBreakingNews() {

    const ribbon = document.getElementById("breakingNewsText");

    if (!ribbon) return;

    try {

        const news = await fetchNews("");

        if (!news || news.length === 0) {
            ribbon.innerHTML = "No Breaking News";
            return;
        }

        // Show first 10 latest headlines
        const headlines = news
            .slice(0, 10)
            .map(item => item.title)
            .join(" &nbsp;&nbsp;&nbsp; 🔴 &nbsp;&nbsp;&nbsp; ");

        // Duplicate text for smooth infinite scrolling
        ribbon.innerHTML = headlines + " &nbsp;&nbsp;&nbsp; 🔴 &nbsp;&nbsp;&nbsp; " + headlines;

    } catch (err) {
        console.log(err);
    }

}       

        // Has the latest article changed?
        if (latestTitle !== latestNews.title) {

            latestTitle = latestNews.title;

            await updateBreakingNews();   // Refresh ribbon with latest headlines

            // Prevent duplicate notification after refresh
            if (lastNotifiedTitle !== latestNews.title) {

                showNotification(
                    "📰 Breaking News",
                    latestNews.title,
                    latestNews.image,
                    latestNews.url
                );

                addNotification(latestNews);

                lastNotifiedTitle = latestNews.title;
                localStorage.setItem("lastNotifiedTitle", latestNews.title);

                console.log("Breaking news notification sent.");

                animateBell();

            } else {

                console.log("Already notified.");

            }

        } else {

            console.log("No new latest news.");

        }

    } catch (error) {

        console.error("Notification Error:", error);

    }
}

updateNotificationUI();

function updateNotificationUI() {

    document.getElementById("notificationCount").innerText =
        notifications.length;

    const list = document.getElementById("notificationList");

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="padding:20px;text-align:center;color:gray">
                🔔 No notifications
            </div>
        `;
        return;
    }

    list.innerHTML = "";

    notifications.forEach(n => {

        list.innerHTML += `

        <div class="notification-item"
             onclick="window.open('${n.url}','_blank')">

            <img src="${n.image || 'Insightlogo.png'}"
                 class="notification-image">

            <div class="notification-content">

                <strong>${n.title}</strong>

                <small>${n.time}</small>

                <span class="notification-status">
                    ● New
                </span>

            </div>

        </div>

        `;

    });

}

function toggleNotifications() {

    const panel = document.getElementById("notificationPanel");

    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    // Show panel
    panel.style.display = "block";

    // Check bell position
    const bellRect = bell.getBoundingClientRect();

    // Bell on left side
    if (bellRect.left < window.innerWidth / 2) {

        panel.style.left = "0";
        panel.style.right = "auto";

    }
    // Bell on right side
    else {

        panel.style.right = "0";
        panel.style.left = "auto";

    }

}

// ===============================
// Draggable Notification Bell
// ===============================

const bell = document.querySelector(".notification-container");

let isDragging = false;
let holdTimer;
let offsetX = 0;
let offsetY = 0;

// Restore saved position
const savedX = localStorage.getItem("bellLeft");
const savedY = localStorage.getItem("bellTop");

if (savedX && savedY) {
    bell.style.left = savedX;
    bell.style.top = savedY;
    bell.style.right = "auto";
}

// Long press starts dragging
bell.addEventListener("mousedown", (e) => {

    holdTimer = setTimeout(() => {

        isDragging = true;
        bell.classList.add("dragging");

        offsetX = e.clientX - bell.offsetLeft;
        offsetY = e.clientY - bell.offsetTop;

    }, 500); // Hold for 500ms

});

// Move
document.addEventListener("mousemove", (e) => {

    if (!isDragging) return;

    bell.style.left = (e.clientX - offsetX) + "px";
    bell.style.top = (e.clientY - offsetY) + "px";
    bell.style.right = "auto";

});

// Stop dragging
document.addEventListener("mouseup", () => {

    clearTimeout(holdTimer);

    if (!isDragging) return;

    isDragging = false;
    bell.classList.remove("dragging");

    const bellWidth = bell.offsetWidth;
    const screenWidth = window.innerWidth;

    let left = bell.offsetLeft;

    // Snap to nearest side
    if (left < screenWidth / 2) {
        left = 10;
    } else {
        left = screenWidth - bellWidth - 10;
    }

    bell.style.left = left + "px";
    bell.style.right = "auto";

    localStorage.setItem("bellLeft", bell.style.left);
    localStorage.setItem("bellTop", bell.style.top);
});

// ===============================
// Draggable Notification Bell for Touch Devices
// ===============================
bell.addEventListener("touchstart", (e) => {

    const touch = e.touches[0];

    holdTimer = setTimeout(() => {

        isDragging = true;
        bell.classList.add("dragging");

        offsetX = touch.clientX - bell.offsetLeft;
        offsetY = touch.clientY - bell.offsetTop;

    }, 500);

});

document.addEventListener("touchmove", (e) => {

    if (!isDragging) return;

    const touch = e.touches[0];

    bell.style.left = (touch.clientX - offsetX) + "px";
    bell.style.top = (touch.clientY - offsetY) + "px";
    bell.style.right = "auto";

});     

document.addEventListener("touchend", () => {

    clearTimeout(holdTimer);

    if (isDragging) {

        isDragging = false;
        bell.classList.remove("dragging");

        localStorage.setItem("bellLeft", bell.style.left);
        localStorage.setItem("bellTop", bell.style.top);

    }

});

function animateBell() {
    const bell = document.getElementById("notificationBell");

    bell.classList.add("bell-animation");

    setTimeout(() => {
        bell.classList.remove("bell-animation");
    }, 800);
}


function updateBreakingNews(newsList){

    const ribbon = document.getElementById("breakingNewsText");

    if(!ribbon) return;

    let text = "";

    newsList.slice(0,10).forEach(function(news){

        text += " 🔴 " + news.title + "     ";
    });

    ribbon.textContent = text;

}


async function updateBreakingNews() {

    const ribbon = document.getElementById("breakingNewsText");

    if (!ribbon) return;

    try {

        const news = await fetchNews("");

        if (!news || news.length === 0) {
            ribbon.innerHTML = "No Breaking News";
            return;
        }

        let html = "";

        news.slice(0, 10).forEach(item => {
            html += `
                <a href="${item.url}"
                   target="_blank"
                   class="breaking-link">
                    📰 ${item.title}
                </a>

                <span class="separator"> 🔴 </span>
            `;
        });

        // Duplicate for smooth infinite scrolling
        ribbon.innerHTML = html + html;

    } catch (err) {
        console.log(err);
    }
}   