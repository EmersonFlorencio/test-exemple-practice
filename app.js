(() => {
  const initialBalance = 2450;
  const contacts = {
    ana: { name: "Ana Oliveira", initials: "AO" },
    lucas: { name: "Lucas Mendes", initials: "LM" },
    bia: { name: "Beatriz Santos", initials: "BS" },
    rafa: { name: "Rafael Lima", initials: "RL" },
  };

  let balance = initialBalance;
  let activities = [
    { title: "Pix recebido", detail: "Hoje, 09:42 · Ana Oliveira", amount: 180, direction: "received" },
    { title: "Café da manhã", detail: "Ontem, 08:15 · Lucas Mendes", amount: -24.5, direction: "sent" },
    { title: "Divisão do jantar", detail: "10 jun, 20:31 · Beatriz Santos", amount: 65, direction: "received" },
  ];

  const form = document.querySelector("#transfer-form");
  const recipientInput = document.querySelector("#recipient");
  const amountInput = document.querySelector("#amount");
  const descriptionInput = document.querySelector("#description");
  const modal = document.querySelector("#confirmation-modal");
  const toast = document.querySelector("#toast");
  let toastTimer;
  let lastFocusedElement;

  const money = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2,
  }).format(value);

  function renderBalance() {
    const [whole, cents] = money(balance).replace("R$ ", "R$ ").split(",");
    document.querySelector("#balance-amount").innerHTML = `${whole}<span>,${cents}</span>`;
    document.querySelector("#available-amount").textContent = money(balance);
  }

  function renderActivities() {
    const list = document.querySelector("#activity-list");
    list.replaceChildren(...activities.slice(0, 4).map((item) => {
      const article = document.createElement("article");
      article.className = "activity-item";
      const icon = document.createElement("span");
      icon.className = `activity-icon ${item.direction}`;
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = item.direction === "received" ? "↓" : "↑";
      const copy = document.createElement("div");
      copy.className = "activity-copy";
      const title = document.createElement("strong");
      title.textContent = item.title;
      const detail = document.createElement("small");
      detail.textContent = item.detail;
      copy.append(title, detail);
      const value = document.createElement("span");
      value.className = `activity-value${item.direction === "received" ? " positive" : ""}`;
      value.textContent = `${item.amount > 0 ? "+" : "−"} ${money(Math.abs(item.amount))}`;
      article.append(icon, copy, value);
      return article;
    }));
    document.querySelector("#activity-count").textContent = String(activities.length);
  }

  function setError(field, message) {
    const group = field.closest(".field-group");
    const error = document.querySelector(`#${field.id}-error`);
    group.classList.toggle("invalid", Boolean(message));
    error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function validate() {
    let valid = true;
    const recipient = recipientInput.value;
    const rawAmount = amountInput.value.trim().replace(",", ".");
    const amount = Number(rawAmount);

    if (!recipient || !contacts[recipient]) {
      setError(recipientInput, "Escolha quem vai receber a transferência.");
      valid = false;
    } else setError(recipientInput, "");

    if (!rawAmount || !Number.isFinite(amount) || amount <= 0) {
      setError(amountInput, "Informe um valor maior que R$ 0,00.");
      valid = false;
    } else if (!Number.isSafeInteger(Math.round(amount * 100))) {
      setError(amountInput, "Confira o valor informado.");
      valid = false;
    } else if (Math.round(amount * 100) > Math.round(balance * 100)) {
      setError(amountInput, "Esse valor é maior que o saldo disponível.");
      valid = false;
    } else setError(amountInput, "");

    if (!valid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
    }
    return valid ? { recipient, amount: Math.round(amount * 100) / 100 } : null;
  }

  function showModal(data) {
    const contact = contacts[data.recipient];
    const description = descriptionInput.value.trim();
    document.querySelector("#receipt-recipient").textContent = contact.name;
    document.querySelector("#receipt-amount").textContent = money(data.amount);
    document.querySelector("#receipt-description").textContent = description;
    document.querySelector("#receipt-description-row").hidden = !description;
    document.querySelector("#receipt-date").textContent = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short", timeStyle: "short",
    }).format(new Date());
    document.querySelector("#receipt-id").textContent = `SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    document.querySelector("#confirmation-copy").textContent = `${money(data.amount)} enviados para ${contact.name}. (De mentirinha, claro.)`;
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.querySelector("#close-modal").focus();
  }

  function closeModal() {
    modal.hidden = true;
    lastFocusedElement?.focus();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const transfer = validate();
    if (!transfer) return;

    balance = Math.round((balance - transfer.amount) * 100) / 100;
    const contact = contacts[transfer.recipient];
    const note = descriptionInput.value.trim();
    const title = note || `Transferência para ${contact.name.split(" ")[0]}`;
    const now = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    activities.unshift({ title, detail: `Agora, ${now} · ${contact.name}`, amount: -transfer.amount, direction: "sent" });
    renderBalance();
    renderActivities();
    showModal(transfer);
    form.reset();
    document.querySelector("#description-count").textContent = "0/80";
    setError(recipientInput, "");
    setError(amountInput, "");
  });

  recipientInput.addEventListener("change", () => setError(recipientInput, ""));
  amountInput.addEventListener("input", () => setError(amountInput, ""));
  descriptionInput.addEventListener("input", () => {
    document.querySelector("#description-count").textContent = `${descriptionInput.value.length}/80`;
  });

  document.querySelectorAll(".contact-item").forEach((button) => {
    button.addEventListener("click", () => {
      recipientInput.value = button.dataset.recipient;
      setError(recipientInput, "");
      document.querySelector("#transferir").scrollIntoView({ behavior: "smooth", block: "start" });
      amountInput.focus({ preventScroll: true });
    });
  });

  document.querySelector("#reset-button").addEventListener("click", () => {
    balance = initialBalance;
    activities = [
      { title: "Pix recebido", detail: "Hoje, 09:42 · Ana Oliveira", amount: 180, direction: "received" },
      { title: "Café da manhã", detail: "Ontem, 08:15 · Lucas Mendes", amount: -24.5, direction: "sent" },
      { title: "Divisão do jantar", detail: "10 jun, 20:31 · Beatriz Santos", amount: 65, direction: "received" },
    ];
    form.reset();
    document.querySelector("#description-count").textContent = "0/80";
    setError(recipientInput, "");
    setError(amountInput, "");
    renderBalance();
    renderActivities();
    showToast("Simulação reiniciada. Seu saldo voltou ao início.");
  });

  document.querySelector("#show-all-contacts").addEventListener("click", () => {
    showToast("Estes são todos os contatos disponíveis na simulação.");
  });
  document.querySelector("#add-contact").addEventListener("click", () => {
    showToast("A lista de contatos é fixa nesta simulação.");
  });
  document.querySelector("#close-modal").addEventListener("click", closeModal);
  document.querySelector("#done-button").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
    if (event.key === "Tab" && !modal.hidden) {
      const focusable = [...modal.querySelectorAll("button:not([disabled])")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });

  renderBalance();
})();
