const form = document.getElementById("footprint-form");
const steps = document.querySelectorAll(".step");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const submitBtn = document.getElementById("submit-button");

let currentStep = 0;

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, select").forEach(el => {
    const saved = localStorage.getItem(el.id);
    if (saved !== null) el.value = saved;
  });
});

["car-diesel", "car-petrol", "car-gas", "car-electric", "car-none"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("change", () => {
    if (id === "car-none" && el.checked) {
      ["car-diesel", "car-petrol", "car-gas", "car-electric"]
        .forEach(other => document.getElementById(other).checked = false);
    } else if (id !== "car-none" && el.checked) {
      document.getElementById("car-none").checked = false;
    }
    updateTransportVisibility();
  });
});

function updateTransportVisibility() {
  const diesel = document.getElementById("car-diesel").checked;
  const petrol = document.getElementById("car-petrol").checked;
  const gas = document.getElementById("car-gas").checked;
  const electric = document.getElementById("car-electric").checked;

  const fuelBlock = document.getElementById("fuel-block");
  if (fuelBlock) {
    fuelBlock.classList.toggle("hidden", !(diesel || petrol));
    fuelBlock.classList.toggle("show", (diesel || petrol));
  }

  const chargeBlock = document.getElementById("charge-electric-block");
  if (chargeBlock) {
    chargeBlock.classList.toggle("show", electric);
    chargeBlock.classList.toggle("hidden-block", !electric);
  }

  const gasAutoBlock = document.getElementById("gas-auto-block");
  if (gasAutoBlock) {
    gasAutoBlock.classList.toggle("show", gas);
    gasAutoBlock.classList.toggle("hidden-block", !gas);
  }

  const carKmBlock = document.getElementById("car-km-block");
  if (carKmBlock) {
    const anyCar = diesel || petrol || gas || electric;
    carKmBlock.classList.toggle("hidden", !anyCar);
    carKmBlock.classList.toggle("show", anyCar);
  }
}

const showIfYes = (selectId, blockId) => {
  const selectEl = document.getElementById(selectId);
  const block = document.getElementById(blockId);

  if (selectEl && block) {
    block.classList.add("animated-block", "hidden");

    const toggle = () => {
      const shouldShow = selectEl.value === "yes";
      block.classList.toggle("hidden", !shouldShow);
      block.classList.toggle("show", shouldShow);
    };

    selectEl.addEventListener("change", toggle);
    toggle();
  }
};

showIfYes("use-electric-cooking", "electric-cooking-block");
showIfYes("use-gas-cooking", "gas-cooking-block");
showIfYes("use-dishwasher", "dishwasher-frequency-block");

const backBtn = document.getElementById("back-button");
if (backBtn) {
  backBtn.addEventListener("click", hideInfo);
}

showStep(currentStep);

nextBtn.addEventListener("click", () => {
  const currentStepEl = steps[currentStep];
  const inputs = currentStepEl.querySelectorAll("input, select");
  let isValid = true;

  for (const input of inputs) {
    if (input.closest(".hidden") || input.closest(".hidden-block")) {
      continue;
    }

    if (!input.checkValidity()) {
      input.classList.add("invalid");
      input.reportValidity();
      input.focus();
      isValid = false;
      break;
    }
  }

  if (isValid && currentStep < steps.length - 1) {
    steps[currentStep].classList.remove("active");
    currentStep++;
    showStep(currentStep);
  }
});

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    steps[currentStep].classList.remove("active");
    currentStep--;
    showStep(currentStep);
  }
});

function showStep(index) {
  const progressInner = document.getElementById("progress-inner");
  if (progressInner) {
    const percent = ((index + 1) / steps.length) * 100;
    progressInner.style.width = percent + "%";
  }
  steps.forEach((stepEl, i) => {
    stepEl.classList.toggle("active", i === index);
  });
  prevBtn.style.display = index === 0 ? "none" : "inline-block";
  nextBtn.style.display = index === steps.length - 1 ? "none" : "inline-block";
  submitBtn.style.display = index === steps.length - 1 ? "inline-block" : "none";
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  let hasError = false;
  let firstInvalidInput = null;

  steps.forEach((stepEl, index) => {
    const inputs = stepEl.querySelectorAll("input, select");
    inputs.forEach(input => {
      if (input.closest(".hidden") || input.closest(".hidden-block")) {
        return;
      }
      if (input.hasAttribute("required") && !input.value.trim()) {
        input.classList.add("invalid");
        if (!firstInvalidInput) {
          firstInvalidInput = input;
          currentStep = index;
        }
        hasError = true;
      } else {
        input.classList.remove("invalid");
      }
    });
  });

  if (hasError && firstInvalidInput) {
    steps.forEach(el => el.classList.remove("active"));
    showStep(currentStep);
    setTimeout(() => {
      firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidInput.focus();
    }, 100);
    return;
  }

  showResult();
});

function showResult() {
  form.style.display = "none";
  document.getElementById("final-result").style.display = "block";

  const get = id => parseFloat(document.getElementById(id).value) || 0;
  const val = id => document.getElementById(id).value;

  // ==== Транспорт ====
  let carKm = get("car-km");
  let transport = 0;
  if (document.getElementById("car-diesel").checked) {
  transport += carKm * 0.21 * 1.15;
  }
  if (document.getElementById("car-petrol").checked) {
    transport += carKm * 0.21 * 1.0;
  }
  if (document.getElementById("car-gas").checked) {
    transport += get("gas-auto-m3") * 2.02;
  }
  if (document.getElementById("car-electric").checked) {
    transport += carKm * 0.21 * 0.3; 
    transport += get("electric-car-kwh") * 0.09; 
  }
  transport += get("public-transport") * 0.105;
  transport -= get("bike-days") * 0.05;

  // ==== Електрика ====
  let electric = get("electricity") * 0.5 / 4;
  electric += get("electric-cooking") * 0.25;
  electric += get("computer-hours") * 0.2;
  if (val("electric-heating") === "yes") electric *= 1.5;
  electric *= 1 - (get("led-lamps") / 100 * 0.3);
  const electricCooking = val("use-electric-cooking") === "yes" ? get("electric-cooking") * 0.25 : 0;

  // ==== Газ ====
  const gasM3 = get("gas-m3");
  let gas = 0;
  if (val("gas-use-heat") === "yes") {
  gas += gasM3 * 2.02 * 0.6;
  }
  if (val("gas-use-water") === "yes") {
  gas += gasM3 * 2.02 * 0.2;
  }
  if (val("use-gas-cooking") === "yes") {
  gas += get("gas-cooking-hours") * 0.2;
  }
  if (gas === 0 && gasM3 > 0) {
  gas = gasM3 * 2.02;
  }

  // ==== Їжа ====
  const food = get("meat") * 27 +
               get("dairy") * 6 +
               get("eggs") * 0.5 +
               get("vegetables") * 2 +
               get("food-delivery") * 5;

  // ==== Вода ====
  let water = get("shower-minutes") * get("shower-frequency") * 0.05 +
              get("washing-machine") * 0.3 +
              get("dishwasher-uses") * 1.5;
  if (val("water-saving") === "yes") water *= 0.8;

  // ==== Покупки ====
  let shopping = (get("clothes") * 25 + get("shoes") * 30 + get("gadgets") * 200) / 52 +
                 get("plastic-bags") * 0.1;
  const secondhand = val("secondhand");
  if (secondhand === "often") shopping *= 0.6;
  else if (secondhand === "sometimes") shopping *= 0.8;

  // ==== Відходи ====
  let waste = get("waste") * (val("recycling") === "yes" ? 0.3 : 0.6);
  waste -= get("bottles") * 0.05;
  waste *= 1 - (get("trash-percent") / 100);
  if (val("organic-compost") === "yes") waste *= 0.9;

  // ==== Побут ====
  let habits = get("tv-hours") * 0.2 +
               Math.max(0, get("heating-temp") - 21) * 2 +
               get("ac-use") * 0.8;
  const lights = val("lights-off");
  if (lights === "always") habits *= 0.9;
  else if (lights === "sometimes") habits *= 0.95;
  const insulation = val("home-insulation");
  if (insulation === "yes") habits *= 0.8;
  else if (insulation === "partial") habits *= 0.9;

  // ==== Итоги ====
  const values = [transport, electric, gas, food, water, shopping, waste, habits];
  const total = values.reduce((a, b) => a + b, 0);
  const labels = ["Авто", "Електрика", "Газ", "Їжа", "Вода", "Покупки", "Відходи", "Побут"];
  const colors = ["#FFCBA4", "#CAB8FF", "#FFEBB4", "#C1FBA4", "#A0E7E5", "#FFB5C2", "#B2C9A0", "#fffd9e"];

  // === Сортуємо від більшого до меншого ===
  const dataset = labels.map((label, i) => ({
  label,
  value: values[i],
  color: colors[i],
  originalIndex: i
    }));
  dataset.sort((a, b) => b.value - a.value);

  // Перезаписуємо labels, values, colors у новому порядку
  const sortedLabels = dataset.map(item => item.label);
  const sortedValues = dataset.map(item => item.value);
  const sortedColors = dataset.map(item => item.color);
  const sortedOriginalIndices = dataset.map(item => item.originalIndex);

  // === Вивід результатів ===
  const resultBlock = document.getElementById("result");
  resultBlock.innerText = `Ваш орієнтовний екологічний слід: ${total.toFixed(2)} кг CO₂`;

  const adviceBox = document.getElementById("advice-box");
  const maxIndex = values.indexOf(Math.max(...values));
  const advices = [
  // 0 — Транспорт
  "🚗 Спробуйте хоча б один день на тиждень залишити авто вдома спробуйте поїхати велосипедом, пішки або громадським транспортом. Це корисно і для планети, і для здоров’я!",

  // 1 — Електрика
  "⚡ Замініть старі лампи на LED — це не тільки зменшить рахунок, а й продовжить життя вашої електропроводки. І не забувайте вимикати техніку з розетки!",

  // 2 — Газ
  "🔥 Якщо у вас газова плита чи котел — утепліть вікна та двері, готуйте з кришкою та використовуйте менші конфорки. Це реально зменшує витрати й викиди CO₂.",

  // 3 — Їжа
  "🥦 Замініть одне м’ясне блюдо на овочеве — наприклад, тушковані овочі з квасолею або сочевичний суп. Це смачно, поживно й екологічно!",

  // 4 — Вода
  "🚿 Встановіть аератор на кран або душ. Ви не відчуєте різницю у потоці, але зекономите до 50% води. І нагадайте сусідам 😉",

  // 5 — Покупки
  "🛍️ Наступного разу, коли захочеться купити ще одну кофту — зробіть паузу. Чи точно вона вам потрібна? Можливо, варто обрати щось із секонду або взагалі утриматись 😌",

  // 6 — Відходи
  "♻️ Почніть з малого — купуйте без упаковки, беріть торбинки на ринок і здавайте скляні пляшки. Сортування — не складно, якщо зробити з цього звичку!",

  // 7 — Побут
  "🏠 Вимикайте світло навіть коли виходите «ненадовго», а взимку встановіть термоголовки на батареї. Кожен градус — це CO₂ і гроші!"
  ];
  adviceBox.innerHTML = `<strong>Порада:</strong> ${advices[maxIndex]}`;
  adviceBox.classList.add("show");
  adviceBox.style.display = "block";

  // === Графік ===
  const chartSection = document.getElementById("chart-section");
  chartSection.style.display = "flex";
  chartSection.style.opacity = "0";
  chartSection.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    chartSection.style.opacity = "1";
    if (window.myChart) window.myChart.destroy();
    const ctx = document.getElementById("chart").getContext("2d");
    window.myChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: sortedLabels,
        datasets: [{ data: sortedValues, backgroundColor: sortedColors }]
      },
      options: {
        responsive: false,
        events: [],
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
          delay: 400
        },
        rotation: -Math.PI / 2,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 14 },
            formatter: function(value, context) {
              const ds = context.chart.data.datasets[0].data;
              const tot = ds.reduce((a, b) => a + b, 0);
              return `${((value / tot) * 100).toFixed(1)}%`;
            }
          }
        }
      }
    });

const legendBox = document.querySelector(".legend-box");
legendBox.innerHTML = "";

dataset.forEach((item, idx) => {
  const percent = ((item.value / total) * 100).toFixed(1);

  const div = document.createElement("div");
  div.style.opacity = "0";
  div.style.animation = `legend-fade-in 0.5s ease forwards`;
  div.style.animationDelay = `${idx * 0.2}s`;

  div.innerHTML = `
    <span class="legend-color" style="background:${item.color}"></span>
    ${item.label} — ${item.value.toFixed(1)} кг (${percent}%)
  `;

  legendBox.appendChild(div);
});

    const editButtonContainer = document.getElementById("edit-button-container");
    if (editButtonContainer) {
      editButtonContainer.style.display = "flex";
      editButtonContainer.style.opacity = "0";
      editButtonContainer.style.transform = "scale(0.8)";
      editButtonContainer.style.transition = "all 0.5s ease";
      setTimeout(() => {
        editButtonContainer.style.opacity = "1";
        editButtonContainer.style.transform = "scale(1)";
      }, 500);
    }
  }, 100);
}

function showInfo(type) {
  document.getElementById("footprint-form").style.display = "none";
  document.getElementById("progress-bar").style.display = "none";
  document.getElementById("final-result").style.display  = "none";
  document.querySelector(".site-footer").style.display    = "none";

  const adviceBox    = document.getElementById("advice-box");
  adviceBox.classList.remove("show");

  const chartSection = document.getElementById("chart-section");
  chartSection.style.display = "none";

  const infoBlock        = document.getElementById("info-block");
  const backBtnContainer = document.getElementById("back-button-container");

  infoBlock.classList.remove("hidden");
  infoBlock.classList.add("visible");
  backBtnContainer.classList.remove("hidden");

  let html = "";
  if (type === "author-ref") {
  html = `
    <h2>Авторська довідка 📘</h2>
    <p>Цей вебзастосунок розроблено у межах дипломного проєкту з комп’ютерної інженерії. Основна мета — створити зручний та інтуїтивний інструмент для приблизної оцінки екологічного сліду людини 🌍.</p>

    <p>Ідея виникла під час вивчення теми впливу побутової діяльності на довкілля. Багато сервісів, присвячених цьому, або надто складні, або орієнтовані на іноземного користувача. Хотілося зробити щось просте, зрозуміле й адаптоване під повсякденне життя в Україні 🇺🇦.</p>

    <p>Калькулятор охоплює декілька ключових напрямків: транспорт, електроенергія, газ, їжа, вода, покупки, відходи та побутові звички. Для кожної сфери користувач заповнює невелику форму, після чого система обраховує приблизний обсяг викидів CO₂.</p>

    <p>Після розрахунку користувач бачить не лише підсумковий результат, а й діаграму розподілу по категоріях 📊, а також пораду 💡 — яка допоможе зрозуміти, з чого найкраще почати зміни.</p>

    <p>Робота виконувалась поетапно: від структурування логіки до оформлення інтерфейсу. Усе зроблено вручну 🛠️ — без генераторів чи шаблонів.</p>

    <p><strong>Що зроблено власноруч:</strong></p>
    <ul>
      <li>📌 Збір і аналіз даних по викидах CO₂</li>
      <li>🎨 UI/UX-дизайн калькулятора</li>
      <li>💻 Реалізація всієї логіки на JavaScript</li>
      <li>📈 Створення діаграми, порад та графіки</li>
    </ul>

    <p>Калькулятор повністю працює в браузері, не вимагає реєстрації і не зберігає особистих даних 🔒. Враховано адаптивність для мобільних пристроїв 📱 та зручність навігації.</p>

    <p>Якщо калькулятор стане для когось зручним способом подивитися на свій побут з іншого боку — він уже виконав свою задачу ✅</p>
  `;
  } else if (type === "tech-doc") {
    html = `
    <h2>Технічна документація ⚙️</h2>
    <p>Цей вебкалькулятор створено для приблизної оцінки викидів CO₂ внаслідок повсякденного способу життя користувача. Всі розрахунки проводяться на основі введених даних у різних сферах: транспорт, електроенергія, газ, їжа, вода, покупки, відходи та побутові звички.</p>

    <p>🧮 <strong>Розрахунки:</strong><br>
    Кожна категорія має свій коефіцієнт впливу на викиди CO₂. Наприклад, для авто враховується тип двигуна та кілометраж, для електроенергії — обсяг споживання та використання LED-ламп, а для їжі — частота споживання м’яса, молочних продуктів тощо. Формули побудовані на основі загальнодоступних екологічних досліджень та адаптовані під локальний контекст України 🇺🇦.</p>

    <p>💡 <strong>Технологічне виконання:</strong><br>
    Усі розрахунки виконуються на клієнтській стороні за допомогою JavaScript. Дані не зберігаються та не передаються на сервер 🌐, що забезпечує конфіденційність користувача. Інтерфейс реалізований із використанням HTML/CSS/JS без сторонніх бібліотек чи фреймворків.</p>

    <p>📊 <strong>Візуалізація:</strong><br>
    Після проходження усіх етапів калькулятор виводить діаграму розподілу викидів за категоріями (діаграма типу "pie") з підписами та кольоровою легендою. Також відображається індивідуальна порада, що базується на найбільш впливовій сфері.</p>

    <p>🔁 <strong>Адаптивність:</strong><br>
    Дизайн оптимізовано під різні розміри екранів: від смартфонів до ноутбуків. Упроваджені базові анімації, покрокова навігація, прогрес-бар та блоки з інформацією, які можна переглянути окремо.</p>
  `;
 } else if (type === "resources") {
  html = `
    <h2>Ресурсні матеріали 📚</h2>
    <p><strong>🌍 Що таке екологічний слід?</strong><br>
    Це умовна «відмітка» викидів CO₂, які ми залишаємо внаслідок щоденних дій: пересування, споживання енергії, вибору їжі, покупок, поводження з відходами.</p>

    <p><strong>🔄 На що він впливає?</strong><br>
    Високий екослід означає більше навантаження на природу: вичерпування ресурсів, забруднення атмосфери, прискорення змін клімату. Те, як ми їздимо, що купуємо, скільки споживаємо — усе має значення.</p>

    <p><strong>💚 Що можна зробити вже сьогодні?</strong></p>
    <ul>
      <li>🚲 Обрати велосипед чи громадський транспорт замість авто</li>
      <li>💧 Використовувати водозберігаючі насадки та коротший душ</li>
      <li>🛒 Зменшити кількість непотрібних покупок</li>
      <li>♻️ Сортувати сміття та здавати вторсировину</li>
      <li>🥦 Урізноманітнити раціон — додати більше рослинної їжі</li>
    </ul>

    <p>Маленькі зміни можуть давати великий ефект, якщо їх роблять багато людей. Цей калькулятор — лише перший крок до того, щоб побачити картину загалом 👣</p>
  `;
}
  infoBlock.innerHTML = `<div class="info-inner">${html}</div>`;
}

function hideInfo() {
  document.getElementById("footprint-form").style.display = "block";
  document.querySelector(".progress-bar").style.display = "block";
  document.getElementById("final-result").style.display = "none";
  document.querySelector(".site-footer").style.display = "block";

  const infoBlock = document.getElementById("info-block");
  const backBtnContainer = document.getElementById("back-button-container");
  infoBlock.classList.remove("visible");
  infoBlock.classList.add("hidden");
  backBtnContainer.classList.add("hidden");
  infoBlock.innerHTML = "";
}

document.getElementById("edit-button").addEventListener("click", () => {
  document.getElementById("final-result").style.display = "none";
  document.getElementById("footprint-form").style.display = "block";
  document.getElementById("progress-bar").style.display = "block";
  document.querySelector(".site-footer").style.display = "block";

  const adviceBox = document.getElementById("advice-box");
  adviceBox.classList.remove("show");
  adviceBox.style.display = "none";

  const editButtonContainer = document.getElementById("edit-button-container");
  if (editButtonContainer) editButtonContainer.style.display = "none";

  steps.forEach(step => step.classList.remove("active"));
  currentStep = 0;
  showStep(currentStep);
});

// Снимаем красную рамку при вводе
document.querySelectorAll("input, select").forEach(input => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
  });
});