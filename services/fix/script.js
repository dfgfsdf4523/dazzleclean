document.addEventListener("DOMContentLoaded", function () {
    const BOT_TOKEN = "8409824309:AAHPmSGPDmXpqePtU_jtWoEQI7fOff38FV0";
    const CHAT_ID = "-1003618378525";

    // Укажи здесь базовую цену для конкретного сайта
    const BASE_PRICE = 50; 
    const URGENT_ADD = 15;
    const SERVICE_NAME = document.getElementById("serviceTitle").textContent;

    const orderModal = document.getElementById("orderModal");

    // 1. Аккордеон
    document.querySelectorAll('.acc-header').forEach(header => {
        header.onclick = () => {
            const item = header.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.acc-item').forEach(el => el.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        };
    });

    // 2. Расчет цены
    function updatePrices() {
        const isUrgent = document.getElementById("urgentOrder").checked;
        document.getElementById("orderTotalPrice").textContent = BASE_PRICE + (isUrgent ? URGENT_ADD : 0);
    }
    document.getElementById("urgentOrder").onchange = updatePrices;

    // 3. Модалки
    const closeModal = () => { orderModal.classList.add("hidden"); };
    document.getElementById("orderBtn").onclick = () => { orderModal.classList.remove("hidden"); updatePrices(); };
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = closeModal);

    // 4. Логика номера
    const phoneInput = document.getElementById("orderPhone");
    phoneInput.addEventListener("input", function() {
        let prefix = "+375 ";
        if (!this.value.startsWith(prefix)) this.value = prefix;
        let core = this.value.substring(prefix.length).replace(/\D/g, '');
        if (core.length > 9) core = core.substring(0, 9);
        this.value = prefix + core;
        const hint = document.getElementById("orderHint");
        if (core.length > 0) hint.classList.add("hidden"); else hint.classList.remove("hidden");
    });

    function showStatus(text) {
        const old = document.querySelector(".status-msg"); if (old) old.remove();
        const msg = document.createElement("div"); msg.className = "status-msg";
        msg.textContent = text; document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3500);
    }

    // 5. Отправка
    document.getElementById("sendOrder").onclick = () => {
        const name = document.getElementById("orderName").value.trim();
        const phone = document.getElementById("orderPhone").value.trim();
        const addr = document.getElementById("orderAddress").value.trim();
        const urgent = document.getElementById("urgentOrder").checked ? "Да" : "Нет";
        const price = document.getElementById("orderTotalPrice").textContent;

        if (name.length < 2 || phone.length < 14 || addr.length < 5) {
            showStatus("Заполните все данные корректно! 📋");
            return;
        }

        showStatus("Отправка... ⏳");
        const text = `🛠 <b>${SERVICE_NAME}</b>\n👤 Имя: ${name}\n📞 Тел: ${phone}\n📍 Адрес: ${addr}\n🚀 Срочно: ${urgent}\n💰 <b>Сумма: ${price} BYN</b>`;

        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: "HTML" })
        }).then(() => {
            showStatus("Заявка принята! ✅");
            closeModal();
        });
    };
});