document.addEventListener("DOMContentLoaded", function () {
    // СЕКРЕТНЫЕ ДАННЫЕ УДАЛЕНЫ (Они теперь в настройках Netlify)

    const PRICES = { baseOrder: 45, ecoOrderAdd: 10, ecoSubAdd: 25 };

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
        const isOrderEco = document.getElementById("ecoOrder").checked;
        document.getElementById("orderTotalPrice").textContent = PRICES.baseOrder + (isOrderEco ? PRICES.ecoOrderAdd : 0);

        const selectedPlan = document.querySelector('input[name="plan"]:checked');
        const planPrice = parseInt(selectedPlan.dataset.price);
        const isSubEco = document.getElementById("ecoSubscribe").checked;
        document.getElementById("subTotalPrice").textContent = planPrice + (isSubEco ? PRICES.ecoSubAdd : 0);
    }
    document.querySelectorAll('.price-recalc').forEach(el => el.onchange = updatePrices);

    // 3. Модалки
    const closeModal = () => { orderModal.classList.add("hidden"); subscribeModal.classList.add("hidden"); };
    document.getElementById("orderBtn").onclick = () => { orderModal.classList.remove("hidden"); updatePrices(); };
    document.getElementById("subscribeBtn").onclick = () => { subscribeModal.classList.remove("hidden"); updatePrices(); };
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = closeModal);

    // 4. Логика номера
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

    function formatPhoneForTg(val) {
        let d = val.replace(/\D/g, '');
        if (d.length < 12) return val;
        return `+${d.substring(0,3)} (${d.substring(3,5)}) ${d.substring(5,8)}-${d.substring(8,10)}-${d.substring(10,12)}`;
    }

    // 5. Умная валидация
    function showStatus(text) {
        const old = document.querySelector(".status-msg"); if (old) old.remove();
        const msg = document.createElement("div"); msg.className = "status-msg";
        msg.textContent = text; document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3500);
    }

    function validateAll(name, phone, addr) {
        const isNameEmpty = name.length < 2;
        const isPhoneIncomplete = phone.replace(/\D/g, '').length < 12;
        const isAddrEmpty = addr.length === 0;

        if (isNameEmpty && isPhoneIncomplete && isAddrEmpty) { showStatus("Заполните имя, номер и адрес! 📋"); return false; }
        if (isNameEmpty && isPhoneIncomplete) { showStatus("Введите имя и номер! 👤📞"); return false; }
        if (isNameEmpty && isAddrEmpty) { showStatus("Введите имя и адрес! 👤🏠"); return false; }
        if (isPhoneIncomplete && isAddrEmpty) { showStatus("Введите номер и адрес! 📞🏠"); return false; }
        
        if (isNameEmpty) { showStatus("Пожалуйста, введите имя! 👤"); return false; }
        if (isPhoneIncomplete) { showStatus("Введите корректный номер! 📞"); return false; }
        if (isAddrEmpty) { showStatus("Пожалуйста, укажите адрес! 🏠"); return false; }
        return true;
    }

    // ИЗМЕНЕННАЯ ФУНКЦИЯ ОТПРАВКИ
    function sendToTelegram(text, modal) {
        closeModal();
        showStatus("Отправка заявки... ⏳");

        fetch('/.netlify/functions/send-message', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text }) // Отправляем только текст
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                showStatus("Заявка принята! ✅");
                modal.querySelectorAll("input").forEach(i => {
                    if(i.type === 'checkbox') i.checked = false;
                    else if(i.id.includes('Phone')) i.value = "+375 ";
                    else if(i.type !== 'radio') i.value = "";
                });
                document.querySelectorAll(".phone-hint").forEach(h => h.classList.remove("hidden"));
            } else {
                showStatus("Ошибка отправки ❌");
            }
        })
        .catch(err => {
            console.error("Ошибка:", err);
            showStatus("Ошибка сети ❌");
        });
    }

    // 6. Обработка кнопок
    document.getElementById("sendOrder").onclick = () => {
        const name = document.getElementById("orderName").value.trim();
        const phone = document.getElementById("orderPhone").value.trim();
        const addr = document.getElementById("orderAddress").value.trim();
        const eco = document.getElementById("ecoOrder").checked ? "Да" : "Нет";
        const price = document.getElementById("orderTotalPrice").textContent;
        if (!validateAll(name, phone, addr)) return;
        sendToTelegram(`🧹 <b>ЗАКАЗ</b>\n👤 Имя: ${name}\n📞 Тел: ${formatPhoneForTg(phone)}\n📍 Адрес: ${addr}\n🌿 Эко: ${eco}\n💰 <b>Сумма: ${price} BYN</b>`, orderModal);
    };

    document.getElementById("sendSubscribe").onclick = () => {
        const name = document.getElementById("subName").value.trim();
        const phone = document.getElementById("subPhone").value.trim();
        const addr = document.getElementById("subAddress").value.trim();
        const plan = document.querySelector('input[name="plan"]:checked').value;
        const eco = document.getElementById("ecoSubscribe").checked ? "Да" : "Нет";
        const price = document.getElementById("subTotalPrice").textContent;
        if (!validateAll(name, phone, addr)) return;
        sendToTelegram(`📦 <b>ПОДПИСКА</b>\n👤 Имя: ${name}\n📞 Тел: ${formatPhoneForTg(phone)}\n📅 Тариф: ${plan}\n📍 Адрес: ${addr}\n🌿 Эко: ${eco}\n💰 <b>Итого: ${price} BYN/мес</b>`, subscribeModal);
    };
});
