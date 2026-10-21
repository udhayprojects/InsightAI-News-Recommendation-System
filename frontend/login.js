

async function signup() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    document.getElementById("msg").innerText = data.message;
}

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.message === "Login successful") {
        localStorage.setItem("currentUser", username);
        localStorage.setItem("loggedIn", "true");   // 🔥 THIS WAS MISSING

        window.location.href = "index.html";        // 🔥 redirect
    } else {
        document.getElementById("msg").innerText = data.message;
    }
}

function togglePassword() {
    const pass = document.getElementById("password");

    if (pass.type === "password") {
        pass.type = "text";
    } else {
        pass.type = "password";
    }
}

const video = document.getElementById("bg-video");
video.playbackRate = 0.75;   // 🔥 slower (0.5 = half speed)

window.onload = function () {
    const video = document.getElementById("bg-video");
    if (video) {
        video.playbackRate = 0.75;
    }
};