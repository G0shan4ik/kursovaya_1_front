const userId = localStorage.getItem("user_id");
if (!userId) location.href = "login.html";

let editModal, passwordModal;
let subscriber = null;
let userData = null;

document.addEventListener("DOMContentLoaded", async () => {
    editModal = new bootstrap.Modal(editModalEl = document.getElementById("editModal"));
    passwordModal = new bootstrap.Modal(passwordModalEl = document.getElementById("passwordModal"));

    await loadUser();
    await loadSubscriber();
});

// ================= LOAD USER =================
async function loadUser() {
    userData = await apiRequest(`/user/get_user_by_id?user_id=${userId}`);
    if (!userData) return;

    u_login.innerText = userData.login;
    u_role.innerText = userData.role;
    u_created.innerText = userData.created_at;
}

// ================= LOAD SUB =================
async function loadSubscriber() {
    const subs = await apiRequest(`/subscriber/get_all_subscribers?user_id=${userId}`);
    if (!subs?.length) return;

    subscriber = subs[0];

    s_name.innerText = subscriber.name;
    s_surname.innerText = subscriber.surname;
    s_patronymic.innerText = subscriber.patronymic;
    s_phone.innerText = subscriber.phone;
    s_year.innerText = subscriber.year_connected;
    s_tariff.innerText = subscriber.tariff;
}

// ================= EDIT =================
function openEdit() {
    subId.value = subscriber.id;

    editLogin.value = "";
    editName.value = "";
    editSurname.value = "";
    editPatronymic.value = "";
    editPhone.value = "";
    editYear.value = "";
    editTariff.value = subscriber.tariff;

    editModal.show();
}

async function saveAll() {
    // update user
    if (editLogin.value) {
        await apiRequest(`/user/update_user?user_id=${userId}`, "POST", {
            login: editLogin.value
        });
    }

    // update subscriber
    await apiRequest(`/subscriber/update_subscriber?sub_id=${subId.value}`, "POST", {
        name: editName.value || undefined,
        surname: editSurname.value || undefined,
        patronymic: editPatronymic.value || undefined,
        phone: editPhone.value || undefined,
        year_connected: editYear.value ? Number(editYear.value) : undefined,
        tariff: editTariff.value
    });

    editModal.hide();
    await loadUser();
    await loadSubscriber();
}

// ================= PASSWORD =================
function validatePassword(password) {
    if (password.length < 9) {
        return "Пароль должен быть длиннее 8 символов";
    }
    if (!/[A-Z]/.test(password)) {
        return "Пароль должен содержать хотя бы одну заглавную букву";
    }
    if (!/[a-z]/.test(password)) {
        return "Пароль должен содержать хотя бы одну строчную букву";
    }
    if (!/[0-9]/.test(password)) {
        return "Пароль должен содержать хотя бы одну цифру";
    }
    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|]/.test(password)) {
        return "Пароль должен содержать хотя бы один специальный символ";
    }
    return null;
}


function openPasswordModal() {
    oldPassword.value = "";
    newPassword.value = "";
    passwordModal.show();
}

async function changePassword() {
    const oldPass = oldPassword.value.trim();
    const newPass = newPassword.value.trim();

    if (!oldPass || !newPass) {
        alert("Заполните оба поля");
        return;
    }

    const validationError = validatePassword(newPass);
    if (validationError) {
        alert(validationError);
        return;
    }

    try {
        await apiRequest(`/user/change_password?user_id=${userId}`, "POST", {
            old_password: oldPass,
            new_password: newPass
        });

        alert("Пароль успешно изменён");
        passwordModal.hide();

        oldPassword.value = "";
        newPassword.value = "";

    } catch (e) {
        alert("Старый пароль неверный");
    }
}


// ================= DELETE =================
async function deleteAccount() {
    if (!confirm("Вы уверены, что хотите удалить аккаунт?")) return;

    await apiRequest(`/user/delete_user?user_id=${userId}`, "POST");
    logout();
}

// ================= LOGOUT =================
function logout() {
    localStorage.clear();
    location.href = "login.html";
}
