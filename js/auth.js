// Сначала получаем все элементы
const loginInput = document.getElementById("login");
const passwordInput = document.getElementById("password");
const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const patronymicInput = document.getElementById("patronymic");
const phoneInput = document.getElementById("phone");
const tariffInput = document.getElementById("tariff");

// ===== REGISTER =====
document.getElementById("registerForm")?.addEventListener("submit", async e => {
    e.preventDefault(); // предотвращаем перезагрузку страницы

    const loginVal = loginInput.value.trim();
    const passwordVal = passwordInput.value.trim();
    const phoneVal = phoneInput.value.trim();
    const nameVal = nameInput.value.trim();
    const surnameVal = surnameInput.value.trim();
    const patronymicVal = patronymicInput.value.trim();
    const tariffVal = tariffInput.value;

    // Проверка обязательных полей
    if (!loginVal || !passwordVal || !phoneVal || !nameVal || !surnameVal || !patronymicVal) {
        return alert("Заполните все обязательные поля!");
    }

    // Проверка сложности пароля
    if (!validatePassword(passwordVal)) return;

    try {
        const res = await apiRequest("/user/sign_up", "POST", {
            login: loginVal,
            password: passwordVal,
            role: "subscriber",
            name: nameVal,
            surname: surnameVal,
            patronymic: patronymicVal,
            phone: phoneVal,
            tariff: tariffVal,
            year_connected: new Date().getFullYear()
        });

        // Сохраняем ID нового пользователя и переходим на user.html
        localStorage.setItem("user_id", res.user_create_id);
        location.href = "user.html";

    } catch (err) {
        console.error(err);
        alert("Пользователь с таким логином уже существует!");
    }
});

// ===== LOGIN =====
document.getElementById("loginForm")?.addEventListener("submit", async e => {
    e.preventDefault();

    const loginVal = loginInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    try {
        const result = await apiRequest("/user/sign_in", "POST", {
            login: loginVal,
            password: passwordVal
        });

        localStorage.setItem("user_id", result.created_id);

        const user = await apiRequest(`/user/get_user_by_id?user_id=${result.created_id}`);
        location.href = user.role === "admin" ? "admin.html" : "user.html";

    } catch (err) {
        console.error(err);
        alert("Ошибка входа. Проверьте логин и пароль.");
    }
});

// ===== Password Validation =====
function validatePassword(password) {
    if (password.length < 8) { alert("Пароль должен быть минимум 8 символов"); return false; }
    if (!/[A-Z]/.test(password)) { alert("Пароль должен содержать хотя бы одну заглавную букву"); return false; }
    if (!/[a-z]/.test(password)) { alert("Пароль должен содержать хотя бы одну строчную букву"); return false; }
    if (!/[0-9]/.test(password)) { alert("Пароль должен содержать хотя бы одну цифру"); return false; }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) { alert("Пароль должен содержать хотя бы один спецсимвол"); return false; }
    return true;
}
