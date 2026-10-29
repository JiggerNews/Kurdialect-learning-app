const dialects = [
  { key: "sorani", label: "سۆرانی", english: "Sorani", color: "sorani", locale: "ckb-IQ" },
  { key: "badini", label: "بادینی", english: "Badini", color: "badini", locale: "ku-TR" },
  { key: "hawrami", label: "هەورامی", english: "Hawrami", color: "hawrami", locale: "ckb-IQ" }
];

const categoryForIndex = (index) => {
  if (index < 15) return { key: "basics", label: "Everyday" };
  if (index < 26) return { key: "colors", label: "Colors" };
  return { key: "food", label: "Food & fruit" };
};

const wordAccents = new Map([
  ["سور", "#f47774"],
  ["زەرد", "#e7c36c"],
  ["شین", "#78a8df"],
  ["سەوز", "#83c487"],
  ["پرتەقاڵی", "#ed9a60"],
  ["سپی", "#d9d9cf"],
  ["ڕەش", "#b7a9a0"],
  ["رەساسی", "#adb9c6"],
  ["قاوەیی", "#c18e70"],
  ["پەمەیی", "#ec91b7"],
  ["مۆر", "#b595e4"],
  ["سێو", "#f47774"],
  ["پڕتەقاڵ", "#ed9a60"],
  ["شووتی", "#e9899d"],
  ["لالەنگی", "#e9a364"],
  ["گوێزەر", "#e99b67"],
  ["هەرمێ", "#a9c77d"],
  ["هەنار", "#f184a4"],
  ["هەنجیر", "#ab87cc"],
  ["شیلک", "#f07784"],
  ["توو", "#a87ab6"],
  ["خەیار", "#85b77d"],
  ["باینجان", "#a17fba"],
  ["کولەکە", "#9ab877"],
  ["ترۆزی", "#74aa84"],
  ["هەڵووژە", "#ad7998"]
]);

const accentForWord = (word, index) => {
  const knownAccent = wordAccents.get(normalize(word));
  if (knownAccent) return knownAccent;
  const accents = ["#9abf7d", "#8cb8c0", "#b294d5", "#d99977", "#85a7d6", "#d59aaf", "#c1ad70"];
  return accents[index % accents.length];
};

const normalize = (value) => value.normalize("NFC").toLocaleLowerCase();

const shuffle = (items) => {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
};

const normalizeAnswer = (value) => normalize(value.trim()).replace(/\s+/g, " ");

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("wordGrid");
  const searchInput = document.getElementById("searchInput");
  const resultCount = document.getElementById("resultCount");
  const categoryFilters = document.getElementById("categoryFilters");
  const savedToggle = document.getElementById("savedToggle");
  const savedCount = document.getElementById("savedCount");
  const savedToggleCount = document.getElementById("savedToggleCount");
  const practiceDialog = document.getElementById("practiceDialog");
  const practiceContent = document.getElementById("practiceContent");
  const practicedCount = document.getElementById("practicedCount");
  const toast = document.getElementById("toast");
  let words = [];
  let activeCategory = "all";
  let showingSaved = false;
  let toastTimer;
  let practiceQueue = [];
  let practiceIndex = 0;
  let practiceRevealed = false;
  let practiceMode = null;

  const readSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("kurdialect-saved") || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : []);
    } catch (error) {
      console.warn("Saved words could not be read.", error);
      return new Set();
    }
  };

  const readPracticeCount = () => {
    try {
      const count = Number.parseInt(localStorage.getItem("kurdialect-practiced") || "0", 10);
      return Number.isFinite(count) && count > 0 ? count : 0;
    } catch (error) {
      console.warn("Practice progress could not be read.", error);
      return 0;
    }
  };

  let savedWords = readSaved();
  let practicedTotal = readPracticeCount();
  practicedCount.textContent = String(practicedTotal);

  const updateSavedCounts = () => {
    savedCount.textContent = String(savedWords.size);
    savedToggleCount.textContent = String(savedWords.size);
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const makeIconButton = (label, className, svgMarkup) => {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = svgMarkup;
    return button;
  };

  const renderWords = () => {
    const term = normalize(searchInput.value.trim());
    const visibleWords = words.filter((word) => {
      const matchesTerm = !term || word.dialects.some((dialect) => normalize(dialect.value).includes(term));
      const matchesCategory = activeCategory === "all" || word.category.key === activeCategory;
      const matchesSaved = !showingSaved || savedWords.has(word.id);
      return matchesTerm && matchesCategory && matchesSaved;
    });

    grid.replaceChildren();
    grid.setAttribute("aria-busy", "false");
    resultCount.textContent = `${visibleWords.length} ${visibleWords.length === 1 ? "word" : "words"}`;

    if (!visibleWords.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const emptyIcon = document.createElement("span");
      emptyIcon.className = "empty-icon";
      emptyIcon.textContent = showingSaved ? "♡" : "⌕";
      const heading = document.createElement("h3");
      heading.textContent = showingSaved ? "Your word book is waiting." : "No words found just yet.";
      const message = document.createElement("p");
      message.textContent = showingSaved
        ? "Tap the bookmark on a word to keep it close."
        : "Try another search, or choose a different collection.";
      empty.append(emptyIcon, heading, message);
      if (searchInput.value || showingSaved || activeCategory !== "all") {
        const reset = document.createElement("button");
        reset.className = "text-button";
        reset.type = "button";
        reset.textContent = "Show all words";
        reset.addEventListener("click", () => {
          searchInput.value = "";
          activeCategory = "all";
          showingSaved = false;
          savedToggle.classList.remove("is-active");
          savedToggle.setAttribute("aria-pressed", "false");
          categoryFilters.querySelectorAll("[data-category]").forEach((chip) => {
            const active = chip.dataset.category === "all";
            chip.classList.toggle("is-active", active);
            chip.setAttribute("aria-pressed", String(active));
          });
          renderWords();
        });
        empty.append(reset);
      }
      grid.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleWords.forEach((word, position) => {
      const card = document.createElement("article");
      card.className = "word-card";
      card.style.setProperty("--card-index", String(Math.min(position, 12)));
      card.style.setProperty("--word-accent", word.accent);

      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";
      const category = document.createElement("span");
      category.className = `category-tag category-${word.category.key}`;
      category.textContent = word.category.label;
      const actions = document.createElement("div");
      actions.className = "card-actions";
      const copyButton = makeIconButton("Copy all translations", "card-action", '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="7" y="6" width="9" height="11" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M12.5 6V4.5A1.5 1.5 0 0 0 11 3H5.5A1.5 1.5 0 0 0 4 4.5V12a1.5 1.5 0 0 0 1.5 1.5H7" stroke="currentColor" stroke-width="1.4"/></svg>');
      copyButton.addEventListener("click", async () => {
        const text = word.dialects.map((dialect) => `${dialect.english}: ${dialect.value}`).join("\n");
        try {
          await navigator.clipboard.writeText(text);
          showToast("Translations copied");
        } catch (error) {
          console.error("Could not copy translations.", error);
          showToast("Copy isn't available in this browser");
        }
      });

      const isSaved = savedWords.has(word.id);
      const saveButton = makeIconButton(isSaved ? "Remove from saved words" : "Save word", `card-action save-action${isSaved ? " is-saved" : ""}`, '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5.5 3.5h9v13L10 13.2l-4.5 3.3v-13Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>');
      saveButton.setAttribute("aria-pressed", String(isSaved));
      saveButton.addEventListener("click", () => {
        if (savedWords.has(word.id)) {
          savedWords.delete(word.id);
          showToast("Removed from your word book");
        } else {
          savedWords.add(word.id);
          showToast("Saved for later");
        }
        try {
          localStorage.setItem("kurdialect-saved", JSON.stringify([...savedWords]));
        } catch (error) {
          console.error("Could not save your word book.", error);
          showToast("Your browser couldn't save this word");
        }
        updateSavedCounts();
        renderWords();
      });
      actions.append(copyButton, saveButton);
      cardHeader.append(category, actions);

      const primary = document.createElement("div");
      primary.className = "word-primary";
      const primaryDialect = word.dialects[0];
      const primaryLabel = document.createElement("span");
      primaryLabel.className = "word-primary-label";
      primaryLabel.textContent = primaryDialect.english;
      const primaryValue = document.createElement("strong");
      primaryValue.className = "word-primary-value";
      primaryValue.lang = "ckb";
      primaryValue.dir = "rtl";
      primaryValue.textContent = primaryDialect.value;
      const playPrimary = makeIconButton(`Play ${primaryDialect.english} pronunciation`, "sound-button", '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M13.5 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>');
      playPrimary.addEventListener("click", () => speak(primaryDialect));
      primary.append(primaryLabel, primaryValue, playPrimary);

      const translations = document.createElement("div");
      translations.className = "translation-list";
      word.dialects.slice(1).forEach((dialect) => {
        const row = document.createElement("div");
        row.className = "translation-row";
        const label = document.createElement("span");
        label.className = `dialect-label dialect-${dialect.color}`;
        label.textContent = dialect.label;
        label.lang = "ckb";
        const value = document.createElement("span");
        value.className = "translation-value";
        value.textContent = dialect.value;
        value.lang = "ckb";
        value.dir = "rtl";
        const play = makeIconButton(`Play ${dialect.english} pronunciation`, "sound-button small-sound", '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8H4Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M13.5 7a4 4 0 0 1 0 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>');
        play.addEventListener("click", () => speak(dialect));
        row.append(label, value, play);
        translations.append(row);
      });

      if (word.image && /^https:\/\//i.test(word.image)) {
        const image = document.createElement("img");
        image.className = "word-image";
        image.src = word.image;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => image.remove(), { once: true });
        card.append(image);
      }

      card.append(cardHeader, primary, translations);
      fragment.append(card);
    });
    grid.append(fragment);
  };

  let showedVoiceNotice = false;
  const speak = (dialect) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      showToast("Pronunciation playback isn't supported in this browser");
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      playWithVoice(dialect, voices);
      return;
    }

    let finished = false;
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (!availableVoices.length || finished) return;
      finished = true;
      window.clearTimeout(voiceTimeout);
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      playWithVoice(dialect, availableVoices);
    };
    const voiceTimeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length) {
        playWithVoice(dialect, availableVoices);
      } else {
        showToast("This browser doesn't have any speech voices available.");
      }
    }, 1500);
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
  };

  const playWithVoice = (dialect, voices) => {
    const dialectCode = dialect.key === "sorani" ? "ckb" : "ku";
    const voice = voices.find((candidate) => candidate.lang.toLowerCase().startsWith(dialectCode))
      || voices.find((candidate) => candidate.lang.toLowerCase().startsWith("ar"))
      || voices.find((candidate) => candidate.default);
    const utterance = new SpeechSynthesisUtterance(dialect.value);
    utterance.lang = voice ? voice.lang : dialect.locale;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.82;
    utterance.onerror = () => showToast("Pronunciation playback failed in this browser");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    if (!showedVoiceNotice && voice && !voice.lang.toLowerCase().startsWith(dialectCode)) {
      showedVoiceNotice = true;
      showToast("No Kurdish voice is installed; using your device's closest available voice.");
    }
  };

  const showPracticeModes = () => {
    practiceContent.replaceChildren();
    const title = document.createElement("h2");
    title.id = "practiceTitle";
    title.textContent = "How would you like to practice?";
    const description = document.createElement("p");
    description.className = "practice-mode-description";
    description.textContent = "Five words with a randomly chosen dialect for each prompt.";
    const modes = document.createElement("div");
    modes.className = "practice-mode-options";

    [
      { key: "type", title: "Type the answers", description: "Write both matching dialects." },
      { key: "choice", title: "Multiple choice", description: "Pick the right translation for each dialect." }
    ].forEach((mode) => {
      const option = document.createElement("button");
      option.className = "practice-mode-option";
      option.type = "button";
      const modeTitle = document.createElement("strong");
      modeTitle.textContent = mode.title;
      const modeDescription = document.createElement("span");
      modeDescription.textContent = mode.description;
      option.append(modeTitle, modeDescription);
      option.addEventListener("click", () => {
        practiceMode = mode.key;
        practiceQueue = shuffle(showingSaved ? words.filter((word) => savedWords.has(word.id)) : words)
          .slice(0, Math.min(5, showingSaved ? savedWords.size : words.length));
        practiceIndex = 0;
        setPracticeCard();
      });
      modes.append(option);
    });

    practiceContent.append(title, description, modes);
  };

  const setPracticeCard = () => {
    practiceRevealed = false;
    const word = practiceQueue[practiceIndex];
    const questionDialectIndex = Math.floor(Math.random() * word.dialects.length);
    const questionDialect = word.dialects[questionDialectIndex];
    const answerDialects = word.dialects.filter((dialect, index) => index !== questionDialectIndex);
    const answerRows = [];
    const selections = new Map();
    practiceContent.replaceChildren();

    const counter = document.createElement("p");
    counter.className = "practice-progress";
    counter.textContent = `WORD ${practiceIndex + 1} OF ${practiceQueue.length}`;
    const progressTrack = document.createElement("div");
    progressTrack.className = "practice-progress-track";
    const progressFill = document.createElement("span");
    progressFill.style.width = `${((practiceIndex + 1) / practiceQueue.length) * 100}%`;
    progressTrack.append(progressFill);
    const title = document.createElement("h2");
    title.id = "practiceTitle";
    title.textContent = practiceMode === "type" ? "Type the other dialects" : "Choose the matching words";
    const prompt = document.createElement("div");
    prompt.className = "practice-prompt";
    const promptDialect = document.createElement("span");
    promptDialect.className = `dialect-label dialect-${questionDialect.color}`;
    promptDialect.textContent = questionDialect.english;
    const promptWord = document.createElement("strong");
    promptWord.lang = "ckb";
    promptWord.dir = "rtl";
    promptWord.textContent = questionDialect.value;
    prompt.append(promptDialect, promptWord);
    const targets = document.createElement("div");
    targets.className = "practice-targets";
    answerDialects.forEach((dialect) => {
      const row = document.createElement("section");
      row.className = "practice-target";
      const label = document.createElement("h3");
      label.className = `dialect-label dialect-${dialect.color}`;
      label.textContent = `${dialect.label} ${dialect.english}`;
      label.lang = "ckb";
      row.append(label);
      const result = document.createElement("span");
      result.className = "practice-target-result";

      if (practiceMode === "type") {
        const input = document.createElement("input");
        input.className = "practice-answer-input";
        input.type = "text";
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;
        input.lang = "ckb";
        input.dir = "rtl";
        input.placeholder = "Type the word…";
        input.setAttribute("aria-label", `Type the ${dialect.english} translation`);
        row.append(input, result);
        answerRows.push({ dialect, row, result, input });
      } else {
        const choices = document.createElement("div");
        choices.className = "practice-choices";
        choices.setAttribute("role", "group");
        choices.setAttribute("aria-label", `Choose the ${dialect.english} translation`);
        const otherWords = words
          .map((candidate) => candidate.dialects.find((candidateDialect) => candidateDialect.key === dialect.key).value)
          .filter((value) => normalizeAnswer(value) !== normalizeAnswer(dialect.value));
        const choiceValues = shuffle([
          dialect.value,
          ...shuffle([...new Set(otherWords)]).slice(0, 3)
        ]);
        choiceValues.forEach((choice) => {
          const option = document.createElement("button");
          option.className = "practice-choice";
          option.type = "button";
          option.lang = "ckb";
          option.dir = "rtl";
          option.textContent = choice;
          option.addEventListener("click", () => {
            selections.set(dialect.key, choice);
            choices.querySelectorAll(".practice-choice").forEach((choiceButton) => {
              const selected = choiceButton === option;
              choiceButton.classList.toggle("is-selected", selected);
              choiceButton.setAttribute("aria-pressed", String(selected));
            });
          });
          choices.append(option);
        });
        row.append(choices, result);
        answerRows.push({ dialect, row, result, choices });
      }

      targets.append(row);
    });
    const controls = document.createElement("div");
    controls.className = "practice-controls";
    const check = document.createElement("button");
    check.className = "button-primary";
    check.type = "button";
    check.textContent = "Check answers";
    check.addEventListener("click", () => {
      const incomplete = answerRows.some(({ dialect, input }) => (
        practiceMode === "type"
          ? !input.value.trim()
          : !selections.has(dialect.key)
      ));
      if (incomplete) {
        showToast(practiceMode === "type" ? "Type both translations first" : "Choose an answer for both dialects first");
        return;
      }

      let correctCount = 0;
      answerRows.forEach(({ dialect, row, result, input, choices }) => {
        const answer = practiceMode === "type" ? input.value : selections.get(dialect.key);
        const isCorrect = normalizeAnswer(answer) === normalizeAnswer(dialect.value);
        if (isCorrect) correctCount += 1;
        row.classList.add(isCorrect ? "is-correct" : "is-incorrect");
        result.textContent = isCorrect ? "Correct" : `Answer: ${dialect.value}`;
        if (input) {
          input.disabled = true;
          input.classList.add(isCorrect ? "is-correct" : "is-incorrect");
        }
        if (choices) {
          choices.querySelectorAll(".practice-choice").forEach((option) => {
            option.disabled = true;
            if (normalizeAnswer(option.textContent) === normalizeAnswer(dialect.value)) {
              option.classList.add("is-correct");
            } else if (option.classList.contains("is-selected")) {
              option.classList.add("is-incorrect");
            }
          });
        }
      });
      const feedback = document.createElement("p");
      feedback.className = `practice-score${correctCount === answerRows.length ? " is-perfect" : ""}`;
      feedback.textContent = `${correctCount} of ${answerRows.length} correct`;
      controls.before(feedback);
      check.hidden = true;
      next.hidden = false;
      practiceRevealed = true;
    });
    const next = document.createElement("button");
    next.className = "button-secondary";
    next.type = "button";
    next.textContent = practiceIndex === practiceQueue.length - 1 ? "Finish practice" : "Next question";
    next.hidden = true;
    next.addEventListener("click", advancePractice);
    controls.append(check, next);
    practiceContent.append(counter, progressTrack, title, prompt, targets, controls);
  };

  const advancePractice = () => {
    if (practiceRevealed) {
      practiceIndex += 1;
    }
    if (practiceIndex >= practiceQueue.length) {
      practicedTotal += practiceQueue.length;
      practicedCount.textContent = String(practicedTotal);
      try {
        localStorage.setItem("kurdialect-practiced", String(practicedTotal));
      } catch (error) {
        console.warn("Practice progress could not be saved.", error);
      }
      practiceContent.replaceChildren();
      const done = document.createElement("div");
      done.className = "practice-complete";
      const icon = document.createElement("span");
      icon.textContent = "✳";
      const title = document.createElement("h2");
      title.id = "practiceTitle";
      title.textContent = "A lovely little session.";
      const message = document.createElement("p");
      message.textContent = `You explored ${practiceQueue.length} words across Kurdish dialects. Keep going at your own pace.`;
      const close = document.createElement("button");
      close.className = "button-primary";
      close.type = "button";
      close.textContent = "Back to my words";
      close.addEventListener("click", () => practiceDialog.close());
      done.append(icon, title, message, close);
      practiceContent.append(done);
      return;
    }
    setPracticeCard();
  };

  const startPractice = () => {
    const sourceWords = showingSaved ? words.filter((word) => savedWords.has(word.id)) : words;
    if (!sourceWords.length) {
      showToast("Save a few words first to practice them");
      return;
    }
    practiceMode = null;
    practiceQueue = sourceWords;
    practiceIndex = 0;
    showPracticeModes();
    practiceDialog.showModal();
  };

  categoryFilters.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
      const active = button === chip;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderWords();
  });

  searchInput.addEventListener("input", renderWords);
  savedToggle.addEventListener("click", () => {
    showingSaved = !showingSaved;
    savedToggle.classList.toggle("is-active", showingSaved);
    savedToggle.setAttribute("aria-pressed", String(showingSaved));
    renderWords();
  });
  document.getElementById("startPractice").addEventListener("click", startPractice);
  document.getElementById("closePractice").addEventListener("click", () => practiceDialog.close());
  practiceDialog.addEventListener("click", (event) => {
    if (event.target === practiceDialog) practiceDialog.close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && practiceDialog.open) practiceDialog.close();
  });

  const installButton = document.getElementById("installButton");
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    showToast("Kurdialect is ready whenever you are");
  });

  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Vocabulary request failed (${response.status})`);
      return response.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.values) || data.values.length < 2) {
        throw new Error("The vocabulary file has an unexpected format.");
      }
      words = data.values.slice(1).filter((row) => Array.isArray(row) && row.length >= 3).map((row, id) => ({
        id,
        dialects: dialects.map((dialect, index) => ({
          ...dialect,
          value: String(row[index] || "").trim()
        })),
        image: typeof row[3] === "string" ? row[3] : "",
        category: categoryForIndex(id),
        accent: accentForWord(String(row[0] || ""), id)
      })).filter((word) => word.dialects.every((dialect) => dialect.value));
      document.getElementById("wordCount").textContent = String(words.length);
      updateSavedCounts();
      renderWords();
    })
    .catch((error) => {
      console.error("Could not load Kurdish vocabulary.", error);
      grid.setAttribute("aria-busy", "false");
      grid.replaceChildren();
      const message = document.createElement("div");
      message.className = "empty-state error-state";
      const heading = document.createElement("h3");
      heading.textContent = "Your word book couldn't load.";
      const detail = document.createElement("p");
      detail.textContent = "Check your connection and refresh to try again.";
      const retry = document.createElement("button");
      retry.className = "text-button";
      retry.type = "button";
      retry.textContent = "Try again";
      retry.addEventListener("click", () => window.location.reload());
      message.append(heading, detail, retry);
      grid.append(message);
    });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.error("Offline support could not be enabled.", error);
      });
    });
  }
});
