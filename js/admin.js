const adminId = localStorage.getItem("user_id");
if (!adminId) location.href = "login.html";

let editModal, createModal, deleteModal;
let userToDelete = null;

document.addEventListener("DOMContentLoaded", async () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));
    createModal = new bootstrap.Modal(document.getElementById("createModal"));
    deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

    const me = await apiRequest(`/user/get_user_by_id?user_id=${adminId}`);
    if (!me || me.role !== "admin") location.href = "error.html";

    // Добавляем обработчик кнопки открытия модального окна создания пользователя
    document.querySelector('button[onclick="createModal.show()"]').addEventListener("click", () => {
        document.getElementById("c_login").value = "";
        document.getElementById("c_password").value = "";
        document.getElementById("c_name").value = "";
        document.getElementById("c_surname").value = "";
        document.getElementById("c_patronymic").value = "";
        document.getElementById("c_phone").value = "";
        document.getElementById("c_year").value = "";
        document.getElementById("c_tariff").value = "standard";
        document.getElementById("c_role").value = "subscriber";
        createModal.show();
    });

    await loadUsers();
});


// ================= Load Users =================
async function loadUsers(filterYear = null) {
    const tbody = document.querySelector("#adminTable tbody");
    tbody.innerHTML = "";

    let users;
    if (filterYear) {
        const response = await apiRequest(`/user/filter_by_year?year=${filterYear}`);
        users = response.users ?? [];
        document.getElementById("yearCount").innerText = users.length;
    } else {
        users = await apiRequest("/user/get_all_users"); // GET запрос
        // При обычной загрузке показываем количество всех пользователей
        document.getElementById("yearCount").innerText = users.length;
    }

    if (!Array.isArray(users)) return;

    for (const u of users) {
        let s = {};
        try {
            const subs = await apiRequest(`/subscriber/get_all_subscribers?user_id=${u.id}`);
            if (subs?.length) s = subs[0];
        } catch {}

        tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${u.id}</td>
            <td>${u.login ?? "-"}</td>
            <td>${s.name ?? "-"}</td>
            <td>${s.surname ?? "-"}</td>
            <td>${s.patronymic ?? "-"}</td>
            <td>${s.phone ?? "-"}</td>
            <td>${s.year_connected ?? "-"}</td>
            <td>${s.tariff ?? "-"}</td>
            <td>
                <span class="badge bg-${u.role === "admin" ? "danger" : "secondary"}">${u.role}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick='openEdit(${u.id})'>✏️</button>
                <button class="btn btn-sm btn-outline-danger" onclick='confirmDelete(${u.id})'>🗑️</button>
            </td>
        </tr>
        `);
    }
}


// ================= Edit User =================
async function openEdit(userId) {
    const u = await apiRequest(`/user/get_user_by_id?user_id=${userId}`);
    const subs = await apiRequest(`/subscriber/get_all_subscribers?user_id=${userId}`);
    const s = subs?.[0] ?? {};

    document.getElementById("userId").value = u.id;
    document.getElementById("subId").value = s.id ?? "";
    document.getElementById("name").value = s.name ?? "";
    document.getElementById("surname").value = s.surname ?? "";
    document.getElementById("patronymic").value = s.patronymic ?? "";
    document.getElementById("phone").value = s.phone ?? "";
    document.getElementById("year").value = s.year_connected ?? "";
    document.getElementById("tariff").value = s.tariff ?? "standard";
    document.getElementById("role").value = u.role;
    document.getElementById("resetPassword").value = "";
    editModal.show();
}

// ================= Create User =================
async function createUser() {
    const login = document.getElementById("c_login").value.trim();
    const password = document.getElementById("c_password").value.trim();
    const name = document.getElementById("c_name").value.trim();
    const surname = document.getElementById("c_surname").value.trim();
    const phone = document.getElementById("c_phone").value.trim();
    const patronymic = document.getElementById("c_patronymic").value.trim();
    if (!login || !password || !name || !surname || !phone || !patronymic) {
        alert("Пожалуйста, заполните все обязательные поля: Login, Password, Name, Surname, Patronymic, Phone");
        return;
    }

    // Проверка сложности пароля
    if (!validatePassword(password)) return;

    const year = document.getElementById("c_year").value;

    await apiRequest("/user/sign_up", "POST", {
        login,
        password,
        role: document.getElementById("c_role").value,
        name,
        surname,
        patronymic: document.getElementById("c_patronymic").value.trim(),
        phone,
        tariff: document.getElementById("c_tariff").value,
        year_connected: year ? Number(year) : undefined
    });

    createModal.hide();
    await loadUsers();
}


// ================= Delete User =================
function confirmDelete(id) { userToDelete = id; deleteModal.show(); }
async function deleteUser() {
    if (!userToDelete) return;
    await apiRequest(`/user/delete_user?user_id=${userToDelete}`, "POST");
    deleteModal.hide();
    userToDelete = null;
    await loadUsers();
}

// ================= Filter & Reset =================
async function filterByYear() {
    const year = document.getElementById("filterYear").value;
    if (!year || year.length !== 4) return alert("Введите год в формате xxxx");
    await loadUsers(Number(year));
}

async function resetFilter() {
    document.getElementById("filterYear").value = "";
    // Подгружаем всех пользователей и автоматически обновляем счетчик
    await loadUsers();
}


// ================= Password Check =================
function validatePassword(password) {
    if (!password) return true;
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)
        || !/[0-9]/.test(password) || !/[!@#$%^&*()]/.test(password) || password.length>128) {
        alert("Пароль должен быть сложным: min 8 символов, загл., стр., цифра, спецсимвол");
        return false;
    }
    return true;
}

// ================= Save Changes =================
async function saveChanges() {
    const resetPassword = document.getElementById("resetPassword").value.trim();
    if (resetPassword && !validatePassword(resetPassword)) return;

    const subId = document.getElementById("subId").value;
    if (subId) {
        await apiRequest(`/subscriber/update_subscriber?sub_id=${subId}`, "POST", {
            name: document.getElementById("name").value,
            surname: document.getElementById("surname").value,
            patronymic: document.getElementById("patronymic").value,
            phone: document.getElementById("phone").value,
            year_connected: Number(document.getElementById("year").value) || undefined,
            tariff: document.getElementById("tariff").value
        });
    }

    await apiRequest(`/user/update_user?user_id=${document.getElementById("userId").value}`, "POST", {
        role: document.getElementById("role").value
    });

    if (resetPassword) {
        await apiRequest(`/user/reset_user_password?user_id=${document.getElementById("userId").value}`, "POST", {
            new_password: resetPassword
        });
    }

    editModal.hide();
    await loadUsers();
}

// ================= Logout =================
function logout() {
    localStorage.clear();
    location.href = "login.html";
}

// ================= Sort Table =================
function sortTable(col) {
    const table = document.getElementById("adminTable");
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);
    const asc = table.dataset.sort !== "asc";
    rows.sort((a,b)=>{
        let A=a.cells[col].innerText.trim(), B=b.cells[col].innerText.trim();
        let nA=Number(A), nB=Number(B);
        if(!isNaN(nA)&&!isNaN(nB)) return asc?nA-nB:nB-nA;
        return asc?A.localeCompare(B):B.localeCompare(A);
    });
    table.dataset.sort = asc?"asc":"desc";
    rows.forEach(r=>tbody.appendChild(r));
}
