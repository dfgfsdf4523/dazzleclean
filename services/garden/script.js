document.addEventListener("DOMContentLoaded", function () {
    const BOT_TOKEN = "8409824309:AAHPmSGPDmXpqePtU_jtWoEQI7fOff38FV0";
    const CHAT_ID = "-1003618378525";

    // Цены для сада
    const PRICES = { baseOrder: 50, trashAdd: 15, subEcoAdd: 0 };

    const orderModal = document.getElementById("orderModal");
    const subscribeModal = document.getElementById("subscribeModal");

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
        const isTrash = document.getElementById("ecoOrder").checked;
        document.getElementById("orderTotalPrice").textContent = PRICES.baseOrder + (isTrash ? PRICES.trashAdd : 0);

        const selectedPlan = document.querySelector('input[name="plan"]:checked');
        const planPrice = parseInt(selectedPlan.dataset.price);
        document.getElementById("subTotalPrice").textContent = planPrice;
    }
    document.querySelectorAll('.price-recalc').forEach(el => el.onchange = updatePrices);

    // 3. Модалки
    const closeModal = () => { orderModal.classList.add("hidden"); subscribeModal.classList.add("hidden"); };
    document.getElementById("orderBtn").onclick = () => { orderModal.classList.remove("hidden"); updatePrices(); };
    document.getElementById("subscribeBtn").onclick = () => { subscribeModal.classList.remove("hidden"); updatePrices(); };
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = closeModal);

    // 4. Логика номера (без изменений)
    const phoneInputs = [document.getElementById("orderPhone"), document.getElementById("subPhone")];
    phoneInputs.forEach(input => {
        input.addEventListener("input", function() {
            let prefix = "+375 ";
            if (!this.value.startsWith(prefix)) this.value = prefix;
            let core = this.value.substring(prefix.length).replace(/\D/g, '');
            if (core.length > 9) core = core.substring(0, 9);
            this.value = prefix + core;
            const hint = this.nextElementSibling;
            if (core.length > 0) hint.classList.add("hidden"); else hint.classList.remove("hidden");
        });
    });

    function showStatus(text) {
        const old = document.querySelector(".status-msg"); if (old) old.remove();
        const msg = document.createElement("div"); msg.className = "status-msg";
        msg.textContent = text; document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3500);
    }

    // 5. Отправка в TG
    function sendToTelegram(text, modal) {
        closeModal();
        showStatus("Отправка заявки... ⏳");
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: "HTML" })
        }).then(() => {
            showStatus("Заявка принята! ✅");
        });
    }

    document.getElementById("sendOrder").onclick = () => {
        const name = document.getElementById("orderName").value;
        const phone = document.getElementById("orderPhone").value;
        const addr = document.getElementById("orderAddress").value;
        const trash = document.getElementById("ecoOrder").checked ? "Да" : "Нет";
        const price = document.getElementById("orderTotalPrice").textContent;
        const text = `🌳 <b>САД: ЗАКАЗ</b>\n👤 Имя: ${name}\n📞 Тел: ${phone}\n📍 Адрес: ${addr}\n🚛 Вывоз мусора: ${trash}\n💰 <b>Сумма: ${price} BYN</b>`;
        sendToTelegram(text, orderModal);
    };

    document.getElementById("sendSubscribe").onclick = () => {
        const name = document.getElementById("subName").value;
        const phone = document.getElementById("subPhone").value;
        const addr = document.getElementById("subAddress").value;
        const plan = document.querySelector('input[name="plan"]:checked').value;
        const price = document.getElementById("subTotalPrice").textContent;
        const text = `🌿 <b>САД: ПОДПИСКА</b>\n👤 Имя: ${name}\n📞 Тел: ${phone}\n📅 Тариф: ${plan}\n📍 Адрес: ${addr}\n💰 <b>Итого: ${price} BYN/мес</b>`;
        sendToTelegram(text, subscribeModal);
    };
});