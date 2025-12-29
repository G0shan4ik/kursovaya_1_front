const API_URL = "http://localhost:8000";

async function apiRequest(url, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(API_URL + url, options);

    if (!response.ok) {
        window.location.href = "error.html";
        throw new Error("API error");
    }

    return response.json();
}
