function isFormValid() {
  let valid = !getProfileError();

  forEachVisibleField(getFields(), field => {
    if (validateField(field)) {
      valid = false;
    }
  });

  return valid;
}

function focusProfileError() {
  if (ui.profileCard) {
    ui.profileCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const target = isEmptyValue(state.profile.name) ? ui.name : ui.group;
  target?.focus({ preventScroll: true });
}

function findFirstInvalidField() {
  let invalidField = null;

  forEachVisibleField(getFields(), field => {
    if (!invalidField && validateField(field)) {
      invalidField = field;
    }
  });

  return invalidField;
}

function scrollToFirstInvalidArea() {
  const profileError = getProfileError();
  if (profileError) {
    ui.submitStatus.textContent = text(state.uiConfig?.profileIncompleteStatusText || getDefaultUiConfig().profileIncompleteStatusText);
    focusProfileError();
    return true;
  }

  const invalidField = findFirstInvalidField();
  if (!invalidField) {
    return false;
  }

  ui.submitStatus.textContent = `Заполните обязательный пункт: ${text(invalidField.label || "без названия")}.`;

  const wrapper = document.getElementById(`form-field-${invalidField.id}`);
  wrapper?.classList.add("form-section-highlight");
  window.setTimeout(() => wrapper?.classList.remove("form-section-highlight"), 1600);
  wrapper?.scrollIntoView({ behavior: "smooth", block: "center" });

  const target = wrapper?.querySelector("input, textarea, select, button");
  target?.focus({ preventScroll: true });
  return true;
}

function getPopularityText(field, option) {
  if (state.uiConfig?.showOptionPopularity === false) {
    return "";
  }

  if (option.locked) {
    return "";
  }

  const count = state.stats.optionCounts?.[field.id]?.[option.value] || 0;
  const total = state.stats.responsesCount || 0;
  if (!total || !count) {
    return "";
  }

  const percent = Math.round((count / total) * 100);
  const template = text(state.uiConfig?.optionPopularityTemplate || getDefaultUiConfig().optionPopularityTemplate);
  return template.replace(/\{percent\}/g, String(percent));
}

function getFieldTheme(field, index) {
  const fieldId = String(field?.id || "").toLowerCase();

  if (fieldId.includes("location") || fieldId.includes("place") || fieldId.includes("venue")) {
    return "estate";
  }

  if (fieldId.includes("alcohol") || fieldId.includes("drinks") || fieldId.includes("bar")) {
    return "alcohol";
  }

  if (fieldId.includes("food") || fieldId.includes("banquet")) {
    return "feast";
  }

  if (fieldId.includes("entertainment") || fieldId.includes("music") || fieldId.includes("party")) {
    return "show";
  }

  return index % 2 === 0 ? "lime" : "graphite";
}

function buildOptionDetailsItems(option) {
  return String(option?.details || "")
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getOptionDetailsKey(fieldId, optionValue) {
  return `${fieldId}::${optionValue}`;
}

function createFieldAtmosphere(field, theme, index) {
  const banner = document.createElement("div");
  banner.className = `field-atmosphere field-atmosphere-${theme}`;

  const eyebrow = document.createElement("div");
  eyebrow.className = "field-atmosphere-eyebrow";

  const headline = document.createElement("div");
  headline.className = "field-atmosphere-headline";

  const subline = document.createElement("div");
  subline.className = "field-atmosphere-subline";

  if (field?.promoTag || field?.promoTitle) {
    eyebrow.textContent = text(field.promoTag || `Chapter ${index + 1}`);
    headline.textContent = text(field.promoTitle || field.label || "Секция формы");
    subline.textContent = text(field.promoSubtitle || "Настройте продающий подзаголовок для этого блока прямо в конструкторе.");
  } else if (theme === "estate") {
    eyebrow.textContent = "Cottage drop";
    headline.textContent = "Соберите уикенд, который продает атмосферу коттеджа с первого экрана.";
    subline.textContent = "Площадки, свет, банкет и воздух загородного вечера в одной воронке выбора.";
  } else if (theme === "alcohol") {
    eyebrow.textContent = "Afterparty mode";
    headline.textContent = "Барная подача, лед, бокалы и правильный вайб вечеринки.";
    subline.textContent = "Когда блок алкоголя появляется в зоне видимости, секция оживает как отдельный selling-момент.";
  } else if (theme === "feast") {
    eyebrow.textContent = "Taste direction";
    headline.textContent = "Еда должна ощущаться как часть программы, а не как техническая строка.";
    subline.textContent = "Соберите гастрономический сценарий под банкет, BBQ или неформальный фуршет.";
  } else if (theme === "show") {
    eyebrow.textContent = "Night rhythm";
    headline.textContent = "Развлекательный блок задает ритм вечера и продает эмоцию заранее.";
    subline.textContent = "Покажите гостям, что здесь будет не просто площадка, а полноценное событие.";
  } else {
    eyebrow.textContent = `Chapter ${index + 1}`;
    headline.textContent = "Секция настроена как часть живой лендинговой истории.";
    subline.textContent = "Текстуры, крупные акценты и разные ритмы помогают не уставать от длинной формы.";
  }

  banner.append(eyebrow, headline, subline);
  return banner;
}

function mountCarouselControls(track, previousBtn, nextBtn, fieldId) {
  const update = () => {
    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth - 4);
    previousBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= maxScrollLeft;
  };

  previousBtn.addEventListener("click", () => {
    track.scrollBy({ left: -Math.max(260, track.clientWidth * 0.8), behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: Math.max(260, track.clientWidth * 0.8), behavior: "smooth" });
  });

  track.addEventListener("scroll", () => {
    state.carouselScroll[fieldId] = track.scrollLeft;
    update();
  }, { passive: true });

  requestAnimationFrame(() => {
    if (typeof state.carouselScroll[fieldId] === "number") {
      track.scrollLeft = state.carouselScroll[fieldId];
    }
    update();
  });
}

function restoreCarouselScrollPositions() {
  const tracks = document.querySelectorAll(".option-carousel-track[data-field-id]");
  tracks.forEach(track => {
    const fieldId = track.dataset.fieldId || "";
    const savedPosition = state.carouselScroll[fieldId];
    if (typeof savedPosition !== "number") {
      return;
    }

    const restore = () => {
      track.scrollTo({ left: savedPosition, behavior: "auto" });
    };

    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
    window.setTimeout(restore, 60);
  });
}

function createOptionNode(field, option, people) {
  const shell = document.createElement("div");
  shell.className = "option-shell";

  const node = document.createElement("div");
  node.className = "option";
  node.setAttribute("role", isOptionLocked(option) ? "group" : "button");
  node.tabIndex = isOptionLocked(option) ? -1 : 0;

  if (field.appearance === "media-grid" || field.appearance === "media-carousel") {
    node.classList.add("option-media");
  }

  if (field.appearance === "media-carousel") {
    shell.classList.add("option-shell-carousel");
    node.classList.add("option-carousel-card");
  }

  if (isOptionSelected(field, option)) {
    node.classList.add("active");
    shell.classList.add("option-shell-active");
  }

  if (isOptionLocked(option)) {
    node.classList.add("option-locked");
    node.setAttribute("aria-disabled", "true");
    shell.classList.add("option-shell-locked");
  }

  const content = document.createElement("div");
  content.className = "option-content";

  const topRow = document.createElement("div");
  topRow.className = "option-top";

  const selector = document.createElement("span");
  selector.className = "option-selector";

  const control = document.createElement("span");
  control.className = `option-control ${field.type === "single" ? "option-radio" : "option-checkbox"}`;
  if (isOptionSelected(field, option)) {
    control.classList.add("checked");
  }

  const input = document.createElement("input");
  input.type = field.type === "single" ? "radio" : "checkbox";
  input.checked = isOptionSelected(field, option);
  input.disabled = true;
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  control.appendChild(input);

  const label = document.createElement("span");
  label.className = "option-title";
  label.textContent = text(option.label);
  selector.append(control, label);
  topRow.appendChild(selector);

  if (option.locked) {
    const lockedBadge = document.createElement("span");
    lockedBadge.className = `option-badge ${option.promoText ? "option-badge-promo" : "option-badge-locked"}`;
    lockedBadge.textContent = text(option.promoText || "Недоступно");
    topRow.appendChild(lockedBadge);
  }

  content.appendChild(topRow);

  if (option.description) {
    const description = document.createElement("span");
    description.className = "option-description";
    description.textContent = text(option.description);
    content.appendChild(description);
  }

  const price = document.createElement("span");
  price.className = "option-price";
  price.textContent = getOptionPriceLabel(option, people);
  content.appendChild(price);

  if (field.type === "multi" && option.allowQuantity && isOptionSelected(field, option) && !option.locked) {
    const quantityWrap = document.createElement("div");
    quantityWrap.className = "option-quantity";

    const quantityLabel = document.createElement("span");
    quantityLabel.className = "option-quantity-label";
    quantityLabel.textContent = "Количество";

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.value = String(getOptionQuantity(field.id, option.value));
    quantityInput.className = "option-quantity-input";
    quantityInput.dataset.fieldId = field.id;
    quantityInput.dataset.optionValue = option.value;
    quantityInput.addEventListener("click", event => {
      event.stopPropagation();
    });
    quantityInput.addEventListener("focus", event => {
      event.stopPropagation();
      window.setTimeout(() => {
        try {
          event.target.select();
        } catch {
          // noop
        }
      }, 0);
    });
    quantityInput.addEventListener("input", event => {
      event.stopPropagation();
      const rawValue = cleanString(event.target.value).replace(/[^\d]/g, "");
      event.target.value = rawValue;
      if (!rawValue) {
        return;
      }
      preserveQuantityInputState(field.id, option.value, () => {
        setOptionQuantity(field.id, option.value, rawValue);
        saveDraft();
        refreshUI(false);
      });
    });
    quantityInput.addEventListener("blur", event => {
      event.stopPropagation();
      const nextValue = parsePositiveCount(event.target.value, 1);
      preserveScrollPosition(() => {
        setOptionQuantity(field.id, option.value, nextValue);
        event.target.value = String(nextValue);
        saveDraft();
        refreshUI(false);
      });
    });

    quantityWrap.append(quantityLabel, quantityInput);
    content.appendChild(quantityWrap);
  }

  if (option.locked) {
    const lockNote = document.createElement("span");
    lockNote.className = "option-lock-note";
    lockNote.textContent = "Этот вариант сейчас заблокирован в конструкторе и недоступен для выбора.";
    content.appendChild(lockNote);
  }

  const popularity = getPopularityText(field, option);
  if (popularity) {
    const popularityNode = document.createElement("span");
    popularityNode.className = "option-popularity";
    popularityNode.textContent = popularity;
    content.appendChild(popularityNode);
  }

  if (field.appearance === "media-grid" || field.appearance === "media-carousel") {
    const media = document.createElement("div");
    media.className = "option-media-thumb";
    media.style.backgroundImage = option.image
      ? `linear-gradient(180deg, rgba(12, 26, 23, 0.08), rgba(12, 26, 23, 0.3)), url("${option.image}")`
      : "linear-gradient(135deg, #dbeafe, #bfdbfe)";
    node.append(media, content);
  } else {
    node.append(content);
  }

  const handleOptionSelect = () => {
    const carouselTrack = shell.closest(".option-carousel-track");
    if (carouselTrack) {
      state.carouselScroll[field.id] = carouselTrack.scrollLeft;
    }
    toggleOption(field, option.value);
    saveDraft();
    refreshUI(true);
  };

  if (!isOptionLocked(option)) {
    node.addEventListener("click", handleOptionSelect);
    node.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOptionSelect();
      }
    });
  }

  const utilityActions = document.createElement("div");
  utilityActions.className = "option-utility-actions";
  let hasUtilityActions = false;

  const detailsItems = buildOptionDetailsItems(option);
  if (detailsItems.length) {
    const detailsKey = getOptionDetailsKey(field.id, option.value);
    const isDetailsOpen = Boolean(state.optionDetailsOpen[detailsKey]);
    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.className = "option-details-trigger";
    detailsBtn.textContent = "Подробнее";
    detailsBtn.setAttribute("aria-expanded", isDetailsOpen ? "true" : "false");
    detailsBtn.classList.toggle("option-details-trigger-active", isDetailsOpen);

    const detailsPanel = document.createElement("div");
    detailsPanel.className = `option-details${isDetailsOpen ? " option-details-open" : " hidden-text"}`;

    const detailsList = document.createElement("ul");
    detailsList.className = "option-details-list";
    detailsItems.forEach(item => {
      const li = document.createElement("li");
      li.textContent = text(item);
      detailsList.appendChild(li);
    });
    detailsPanel.appendChild(detailsList);

    detailsBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      detailsPanel.classList.toggle("hidden-text");
      const isOpen = !detailsPanel.classList.contains("hidden-text");
      state.optionDetailsOpen[detailsKey] = isOpen;
      detailsPanel.classList.toggle("option-details-open", isOpen);
      detailsBtn.classList.toggle("option-details-trigger-active", isOpen);
      detailsBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    utilityActions.appendChild(detailsBtn);
    content.appendChild(detailsPanel);
    hasUtilityActions = true;
  }

  if (option.mapUrl) {
    const mapBtn = document.createElement("a");
    mapBtn.className = "option-map-link";
    mapBtn.href = isMobileDevice()
      ? buildMobileMapHref(option.mapUrl, option.label)
      : buildDesktopMapHref(option.mapUrl, option.label);
    mapBtn.target = isMobileDevice() ? "_self" : "_blank";
    mapBtn.rel = "noreferrer noopener";
    mapBtn.textContent = "Локация";
    mapBtn.addEventListener("click", event => {
      event.stopPropagation();
      if (isMobileDevice()) {
        const mobileHref = buildMobileMapHref(option.mapUrl, option.label);
        if (mobileHref) {
          mapBtn.href = mobileHref;
        }
      } else {
        const desktopHref = buildDesktopMapHref(option.mapUrl, option.label);
        if (desktopHref) {
          mapBtn.href = desktopHref;
        }
      }
    });
    utilityActions.appendChild(mapBtn);
    hasUtilityActions = true;
  }

  if (hasUtilityActions) {
    shell.classList.add("option-shell-with-actions");
    content.classList.add("option-content-with-actions");
    utilityActions.classList.add(
      field.appearance === "media-carousel"
        ? "option-utility-actions-card"
        : "option-utility-actions-inline"
    );
    content.appendChild(utilityActions);
  }

  shell.appendChild(node);

  return shell;
}

function renderField(field, container, index) {
  const wrapper = document.createElement("div");
  const theme = getFieldTheme(field, index);
  wrapper.className = `card form-section form-section-${theme}`;
  wrapper.dataset.theme = theme;
  wrapper.dataset.fieldId = field.id;
  wrapper.id = `form-field-${field.id}`;

  const title = document.createElement("h3");
  title.textContent = text(field.label);

  if (field.required) {
    title.classList.add("required-title");
  }

  wrapper.appendChild(title);
  wrapper.appendChild(createFieldAtmosphere(field, theme, index));

  if (field.hint) {
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = text(field.hint);
    wrapper.appendChild(hint);
  }

  const error = validateField(field);
  if (error) {
    wrapper.classList.add("error");

    const errorNode = document.createElement("div");
    errorNode.className = "error-text";
    errorNode.textContent = error;
    wrapper.appendChild(errorNode);
  }

  if (field.type === "text") {
    const input = document.createElement("input");
    input.placeholder = field.label;
    input.value = state.values[field.id] || "";
    input.addEventListener("input", event => {
      state.values[field.id] = event.target.value;
      saveDraft();
      refreshUI(false);
    });
    wrapper.appendChild(input);
  }

  if (field.type === "date") {
    const dateWrap = document.createElement("div");
    dateWrap.className = "date-field-wrap";
    const selectedDateValue = state.values[field.id] || "";

    const input = document.createElement("input");
    const appleMobile = isAppleMobileDevice();
    input.type = appleMobile ? "text" : "date";
    input.className = "date-field-input";
    input.value = appleMobile ? formatFormDateValue(selectedDateValue) : selectedDateValue;
    if (appleMobile) {
      dateWrap.classList.add("date-field-wrap-ios");
      input.readOnly = true;
      input.placeholder = "ДД.ММ.ГГГГ";
    } else {
      input.addEventListener("change", event => {
        state.values[field.id] = event.target.value;
        saveDraft();
        refreshUI(true);
      });
    }
    input.addEventListener("click", () => {
      if (!appleMobile && typeof input.showPicker === "function") {
        input.showPicker();
      }
    });

    if (!appleMobile) {
      dateWrap.appendChild(input);
    }

    const popularityMeta = getFieldPopularityMeta(field, selectedDateValue);
    dateWrap.appendChild(createDateCalendar(field, selectedDateValue));

    if (appleMobile) {
      const selectedDateNote = document.createElement("div");
      selectedDateNote.className = "date-field-selected-note";
      selectedDateNote.textContent = selectedDateValue
        ? `Выбрано: ${formatFormDateValue(selectedDateValue)}`
        : "Выберите дату в календаре";
      dateWrap.appendChild(selectedDateNote);
    }

    if (selectedDateValue && popularityMeta.percent > 0) {
      dateWrap.dataset.popularity = getDatePopularityTone(popularityMeta.percent);
      const note = document.createElement("div");
      note.className = "date-field-popularity";
      note.textContent = `Эту дату выбрали ${popularityMeta.percent}% группы`;
      dateWrap.appendChild(note);
    }

    wrapper.appendChild(dateWrap);
  }

  const visibleOptions = Array.isArray(field.options) ? field.options.filter(isOptionVisible) : [];
  if (visibleOptions.length) {
    if (field.appearance === "media-carousel") {
      const carousel = document.createElement("div");
      carousel.className = "option-carousel";

      const previousBtn = document.createElement("button");
      previousBtn.type = "button";
      previousBtn.className = "option-carousel-nav option-carousel-prev";
      previousBtn.textContent = "<";

      const track = document.createElement("div");
      track.className = "option-carousel-track";
      track.dataset.fieldId = field.id;

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "option-carousel-nav option-carousel-next";
      nextBtn.textContent = ">";

      const mobileHint = document.createElement("div");
      mobileHint.className = "option-carousel-hint";
      mobileHint.textContent = "Листайте карточки или используйте стрелки";

      visibleOptions.forEach(option => {
        track.appendChild(createOptionNode(field, option, getPricingParticipantCount()));
      });

      carousel.append(previousBtn, track, nextBtn, mobileHint);
      mountCarouselControls(track, previousBtn, nextBtn, field.id);
      wrapper.appendChild(carousel);
    } else {
      visibleOptions.forEach(option => {
        wrapper.appendChild(createOptionNode(field, option, getPricingParticipantCount()));
      });
    }
  }

  if (theme === "alcohol") {
    const bottles = document.createElement("div");
    bottles.className = "section-bottles";
    bottles.innerHTML = "<span></span><span></span><span></span>";
    wrapper.appendChild(bottles);
  }

  container.appendChild(wrapper);
}

function renderAll() {
  ui.dynamic.innerHTML = "";
  let visibleIndex = 0;
  forEachVisibleField(getFields(), field => {
    renderField(field, ui.dynamic, visibleIndex);
    visibleIndex += 1;
  });
  setupScrollDecorations();
  restoreCarouselScrollPositions();
}

function preserveQuantityInputState(fieldId, optionValue, callback) {
  const activeElement = document.activeElement;
  const isTargetInput = activeElement
    && activeElement.classList?.contains("option-quantity-input")
    && activeElement.dataset.fieldId === fieldId
    && activeElement.dataset.optionValue === optionValue;

  if (!isTargetInput) {
    callback();
    return;
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const selectionStart = typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null;
  const selectionEnd = typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null;

  callback();

  window.requestAnimationFrame(() => {
    const nextInput = document.querySelector(`.option-quantity-input[data-field-id="${fieldId}"][data-option-value="${optionValue}"]`);
    if (!(nextInput instanceof HTMLInputElement)) {
      return;
    }

    nextInput.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) {
      try {
        nextInput.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        // noop
      }
    }
    window.scrollTo(scrollX, scrollY);
  });
}

function preserveScrollPosition(callback) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  callback();

  window.requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);
  });
}

function calculateTotal() {
  let total = 0;

  forEachSelectedOption(getFields(), (field, option) => {
    total += calcItem(option, getPricingParticipantCount(), getOptionQuantity(field.id, option.value));
  });

  const ticketLabel = text(state.uiConfig.ticketLabel || getDefaultUiConfig().ticketLabel);
  const hasNegotiable = hasSelectedPriceType("negotiable");
  let ticketValue = formatPerPerson(total, getPricingParticipantCount());
  if (hasNegotiable && total > 0) {
    ticketValue = `от ${ticketValue}`;
  } else if (hasNegotiable && total === 0) {
    ticketValue = "Договорная";
  }
  ui.perPerson.textContent = `${ticketLabel}: ${ticketValue}`;
  return total;
}

function generateDetails() {
  const rows = [];
  let total = 0;
  const showPerPersonColumn = isPerPersonSuffixEnabled();
  const showHoursColumn = isHoursFieldVisible() && hasSelectedPriceType("perHour");
  const hasNegotiable = hasSelectedPriceType("negotiable");

  forEachSelectedOption(getFields(), (field, option) => {
    const quantity = option.allowQuantity ? getOptionQuantity(field.id, option.value) : 1;
    const sum = calcItem(option, getPricingParticipantCount(), quantity);
    total += sum;
    const isPerHour = option.priceType === "perHour";
    const perHourRate = (Number(option.price) || 0)
      + Math.max(0, quantity - 1) * (option.nextPrice != null ? Number(option.nextPrice) : Number(option.price) || 0);

    if (showHoursColumn) {
      const cells = [
        `<td>${text(option.label)}</td>`,
        `<td>${isPerHour ? getHoursCount() : "—"}</td>`,
        `<td class="check-table-multiply">${isPerHour ? "×" : "—"}</td>`,
        `<td>${isPerHour ? formatTotal(perHourRate) : "—"}</td>`,
        `<td>${option.priceType === "negotiable" ? "Договорная" : formatTotal(sum)}</td>`
      ];

      if (showPerPersonColumn) {
        cells.push(`<td>${option.priceType === "negotiable" ? "—" : formatPerPerson(sum, getPricingParticipantCount())}</td>`);
      }

      rows.push(`<tr>${cells.join("")}</tr>`);
      return;
    }

    const cells = [
      `<td>${text(option.label)}</td>`,
      `<td>${option.priceType === "negotiable" ? "Договорная" : formatTotal(sum)}</td>`
    ];

    if (showPerPersonColumn) {
      cells.push(`<td>${option.priceType === "negotiable" ? "—" : formatPerPerson(sum, getPricingParticipantCount())}</td>`);
    }

    rows.push(`<tr>${cells.join("")}</tr>`);
  });

  if (showHoursColumn) {
    const totalCells = [
      `<td><b>Итого</b></td>`,
      "<td><b>—</b></td>",
      "<td class=\"check-table-multiply\"><b>—</b></td>",
      "<td><b>—</b></td>",
      `<td><b>${formatTotal(total)}</b></td>`
    ];
    if (showPerPersonColumn) {
      totalCells.push(`<td><b>${formatPerPerson(total, getPricingParticipantCount())}</b></td>`);
    }
    rows.push(`<tr class="check-table-total">${totalCells.join("")}</tr>`);
  } else {
    const totalCells = [
      `<td><b>Итого</b></td>`,
      `<td><b>${formatTotal(total)}</b></td>`
    ];
    if (showPerPersonColumn) {
      totalCells.push(`<td><b>${formatPerPerson(total, getPricingParticipantCount())}</b></td>`);
    }
    rows.push(`<tr class="check-table-total">${totalCells.join("")}</tr>`);
  }

  if (showHoursColumn) {
    const headCells = [
      "<th>Позиция</th>",
      "<th>Часы</th>",
      "<th class=\"check-table-multiply\">×</th>",
      "<th>Стоимость в час</th>",
      "<th>Общий чек</th>"
    ];
    if (showPerPersonColumn) {
      headCells.push("<th>На человека</th>");
    }
    const note = hasNegotiable
      ? `<p class="check-table-note">Позиции с типом «Договорная» не включены в авторасчет.</p>`
      : "";

    return `
      <div class="check-table-wrap">
        <table class="check-table">
          <thead>
            <tr>${headCells.join("")}</tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
      ${note}
    `;
  }

  const headCells = [
    "<th>Позиция</th>",
    "<th>Общий чек</th>"
  ];
  if (showPerPersonColumn) {
    headCells.push("<th>На человека</th>");
  }

  const note = hasNegotiable
    ? `<p class="check-table-note">Позиции с типом «Договорная» не включены в авторасчет.</p>`
    : "";

  return `
    <div class="check-table-wrap">
      <table class="check-table">
        <thead>
          <tr>${headCells.join("")}</tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
    ${note}
  `;
}

function updateResponsesCounter() {
  ui.responsesCount.textContent = state.stats.responsesCount || 0;
}

function applyUiConfig() {
  const cfg = {
    ...getDefaultUiConfig(),
    ...(state.uiConfig || {})
  };

  if (ui.pageTitle) {
    ui.pageTitle.textContent = text(state.formMeta.title || "Командообразование ЦРС");
  }

  if (ui.heroRibbonTop) {
    ui.heroRibbonTop.textContent = text(cfg.heroRibbonTopText);
  }

  if (ui.heroKicker) {
    ui.heroKicker.textContent = text(cfg.heroKicker);
  }

  if (ui.heroHeadline) {
    ui.heroHeadline.textContent = text(cfg.heroHeadline);
  }

  if (ui.heroSubline) {
    ui.heroSubline.textContent = text(cfg.heroSubline);
  }

  if (ui.heroBadge) {
    ui.heroBadge.textContent = text(cfg.heroBadge);
  }

  if (ui.heroNote) {
    ui.heroNote.textContent = text(cfg.heroNote);
  }

  if (ui.heroRibbonBottom) {
    ui.heroRibbonBottom.textContent = text(cfg.heroRibbonText);
  }

  if (ui.adminEntryLink) {
    ui.adminEntryLink.textContent = "Войти";
    ui.adminEntryLink.href = getBuilderEntryHref();
  }

  if (ui.userSectionTitle) {
    ui.userSectionTitle.textContent = text(cfg.userSectionTitle);
  }

  if (ui.userSectionHint) {
    ui.userSectionHint.textContent = text(cfg.userSectionHint);
  }

  if (ui.name) {
    ui.name.placeholder = text(cfg.namePlaceholder);
  }

  if (ui.group) {
    ui.group.placeholder = text(cfg.groupPlaceholder);
  }

  if (ui.participantsStatLabel) {
    ui.participantsStatLabel.textContent = text(cfg.participantsStatLabel);
  }

  if (ui.participantsCount) {
    ui.participantsCount.textContent = getDisplayParticipantCount();
  }

  if (ui.participantsStatCard) {
    ui.participantsStatCard.style.display = isParticipantsStatVisible() ? "" : "none";
  }

  if (ui.responsesStatLabel) {
    ui.responsesStatLabel.textContent = text(cfg.responsesStatLabel);
  }

  if (ui.responsesStatCard) {
    ui.responsesStatCard.style.display = isResponsesStatVisible() ? "" : "none";
  }

  if (ui.statsGrid) {
    ui.statsGrid.style.display = isParticipantsStatVisible() || isResponsesStatVisible() ? "" : "none";
  }

  if (ui.hoursFieldWrap) {
    ui.hoursFieldWrap.classList.toggle("hidden-text", !isHoursFieldVisible());
    ui.hoursFieldWrap.style.display = isHoursFieldVisible() ? "" : "none";
    const titleNode = ui.hoursFieldWrap.querySelector(".hours-card-title");
    if (titleNode) {
      titleNode.textContent = text(cfg.hoursSectionTitle);
    }
    const hintNode = ui.hoursFieldWrap.querySelector(".field-hint");
    if (hintNode) {
      hintNode.textContent = text(cfg.hoursSectionHint);
    }
    const labelNode = ui.hoursFieldWrap.querySelector(".field-label");
    if (labelNode) {
      labelNode.textContent = text(cfg.hoursFieldLabel);
    }
    const metaNode = ui.hoursFieldWrap.querySelector(".hours-field-meta");
    if (metaNode) {
      metaNode.textContent = text(cfg.hoursFieldMeta);
    }
  }

  if (ui.hours) {
    ui.hours.placeholder = text(cfg.hoursFieldLabel);
    ui.hours.setAttribute("aria-label", text(cfg.hoursFieldLabel));
  }

  if (ui.detailsBtn && !state.isSubmitting) {
    ui.detailsBtn.textContent = text(cfg.detailsButtonLabel);
  }

  if (ui.clearSelectionBtn) {
    ui.clearSelectionBtn.textContent = text(cfg.clearButtonLabel);
  }

  document.documentElement.style.setProperty("--button-primary-start", cfg.buttonPrimaryStart || getDefaultUiConfig().buttonPrimaryStart);
  document.documentElement.style.setProperty("--button-primary-end", cfg.buttonPrimaryEnd || getDefaultUiConfig().buttonPrimaryEnd);
  document.documentElement.style.setProperty("--button-details-start", cfg.buttonDetailsStart || getDefaultUiConfig().buttonDetailsStart);
  document.documentElement.style.setProperty("--button-details-end", cfg.buttonDetailsEnd || getDefaultUiConfig().buttonDetailsEnd);
  document.documentElement.style.setProperty("--button-secondary-bg", cfg.buttonSecondaryBg || getDefaultUiConfig().buttonSecondaryBg);
  document.documentElement.style.setProperty("--button-secondary-text", cfg.buttonSecondaryText || getDefaultUiConfig().buttonSecondaryText);
  document.documentElement.style.setProperty("--page-glow-primary", cfg.pageGlowPrimary || "#ddff00");
  document.documentElement.style.setProperty("--page-glow-secondary", cfg.pageGlowSecondary || "#ff3a3a");
  document.documentElement.style.setProperty("--page-bg-start", cfg.pageBgStart || "#0f1013");
  document.documentElement.style.setProperty("--page-bg-mid", cfg.pageBgMid || "#262b34");
  document.documentElement.style.setProperty("--page-bg-end", cfg.pageBgEnd || "#121519");
  document.documentElement.style.setProperty("--hero-accent", cfg.heroAccent || "#d9ff3f");
  document.documentElement.style.setProperty("--hero-surface-start", cfg.heroSurfaceStart || "#0b0c10");
  document.documentElement.style.setProperty("--hero-surface-end", cfg.heroSurfaceEnd || "#111217");
  document.documentElement.style.setProperty("--surface-start", cfg.surfaceStart || "#121318");
  document.documentElement.style.setProperty("--surface-end", cfg.surfaceEnd || "#1a1c22");
  document.documentElement.style.setProperty("--surface-text", cfg.surfaceText || "#f6f8f1");
  document.documentElement.style.setProperty("--surface-border", cfg.surfaceBorder || "rgba(255, 255, 255, 0.12)");
  document.documentElement.style.setProperty("--check-table-start", cfg.checkTableStart || "#161920");
  document.documentElement.style.setProperty("--check-table-end", cfg.checkTableEnd || "#0f1218");
  document.documentElement.style.setProperty("--option-highlight-color", cfg.optionHighlightColor || cfg.heroAccent || "#d9ff3f");
  document.documentElement.style.setProperty("--option-selected-bg", cfg.optionSelectedBg || "color-mix(in srgb, var(--option-highlight-color) 18%, rgba(255,255,255,0.03))");
}

function updateSubmitUi() {
  applyUiConfig();
  const profileError = getProfileError();
  ui.profileError.textContent = profileError;
  ui.profileError.classList.toggle("hidden-text", !profileError);
  ui.name.classList.toggle("input-error", isEmptyValue(state.profile.name));
  ui.group.classList.toggle("input-error", isEmptyValue(state.profile.group));
  ui.detailsBtn.disabled = false;
  ui.saveBtn.disabled = state.isSubmitting;
  if (ui.clearSelectionBtn) {
    ui.clearSelectionBtn.disabled = state.isSubmitting;
  }
  ui.saveBtn.textContent = state.isSubmitting ? "Отправка..." : state.meta.hasSubmitted ? text(state.uiConfig.resubmitButtonLabel || getDefaultUiConfig().resubmitButtonLabel) : text(state.uiConfig.saveButtonLabel || getDefaultUiConfig().saveButtonLabel);
  if (state.meta.hasSubmitted && state.meta.lastSubmittedAt && !state.isSubmitting) {
    ui.submitStatus.textContent = `Форма уже отправлена. Вы можете изменить выбор и отправить обновленную версию. Последнее обновление: ${new Date(state.meta.lastSubmittedAt).toLocaleString("ru-RU")}`;
  } else if (!state.isSubmitting && !state.meta.hasSubmitted && !profileError) {
    ui.submitStatus.textContent = CONFIG.api.baseUrl ? text(state.uiConfig.draftStatusText || getDefaultUiConfig().draftStatusText) : "После отправки выбор сохранится локально. Для синхронизации с базой подключите backend и укажите CONFIG.api.baseUrl.";
  }
}

function refreshUI(shouldRender) {
  const syncedDependentSelections = syncDependentOptionSelections();
  const syncedLinkedQuantities = syncLinkedOptionQuantities();
  if (syncedDependentSelections || syncedLinkedQuantities) {
    saveDraft();
  }

  if (shouldRender || syncedDependentSelections || syncedLinkedQuantities) {
    renderAll();
  }

  updateResponsesCounter();
  updateSubmitUi();
  calculateTotal();
}

function openDetails() {
  if (!isFormValid()) {
    updateSubmitUi();
    scrollToFirstInvalidArea();
    return;
  }

  ui.detailsContent.innerHTML = generateDetails();
  ui.detailsModal.classList.remove("hidden");
}

function closeDetails() {
  ui.detailsModal.classList.add("hidden");
}

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(getScopedStorageKey(CONFIG.storage.draftKey)) || "null");
  } catch {
    return null;
  }
}

function saveDraft() {
  const draft = {
    values: state.values,
    optionQuantities: state.optionQuantities,
    profile: state.profile,
    meta: state.meta
  };

  localStorage.setItem(getScopedStorageKey(CONFIG.storage.draftKey), JSON.stringify(draft));
}

function hydrateDraft() {
  const draft = readDraft();
  if (!draft) {
    state.meta.submissionId = generateSubmissionId();
    return;
  }

  if (draft.values && typeof draft.values === "object") {
    state.values = draft.values;
  }

  if (draft.profile && typeof draft.profile === "object") {
    state.profile = {
      name: draft.profile.name || "",
      group: draft.profile.group || "",
      hours: parsePositiveCount(draft.profile.hours, 1)
    };
  }

  if (draft.optionQuantities && typeof draft.optionQuantities === "object") {
    state.optionQuantities = { ...draft.optionQuantities };
  }

  if (draft.meta && typeof draft.meta === "object") {
    state.meta = {
      submissionId: draft.meta.submissionId || generateSubmissionId(),
      hasSubmitted: Boolean(draft.meta.hasSubmitted),
      lastSubmittedAt: draft.meta.lastSubmittedAt || ""
    };
  } else {
    state.meta.submissionId = generateSubmissionId();
  }
}

function readSchema() {
  try {
    return JSON.parse(localStorage.getItem(getScopedStorageKey(CONFIG.storage.schemaKey)) || "null");
  } catch {
    return null;
  }
}

function readUiConfig() {
  try {
    return JSON.parse(localStorage.getItem(getScopedStorageKey(CONFIG.storage.uiConfigKey)) || "null");
  } catch {
    return null;
  }
}

function saveSchema() {
  localStorage.setItem(getScopedStorageKey(CONFIG.storage.schemaKey), JSON.stringify(state.schema));
}

function saveUiConfig() {
  localStorage.setItem(getScopedStorageKey(CONFIG.storage.uiConfigKey), JSON.stringify(state.uiConfig));
}

function hydrateSchema() {
  const localSchema = readSchema();
  state.schema = Array.isArray(localSchema)
    ? normalizeSchema(localSchema)
    : getDefaultSchema();

  const localUiConfig = readUiConfig();
  state.uiConfig = {
    ...getDefaultUiConfig(),
    ...normalizeUiConfig(localUiConfig && typeof localUiConfig === "object" ? localUiConfig : {})
  };
}

async function loadRemoteSchema() {
  return runWithLoading(isBuilderPage() ? "Загружаем форму..." : "Готовим форму...", async () => {
    if (isBuilderPage() && !hasSelectedBuilderForm()) {
      return;
    }

    if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.fetchSchema !== "function") {
      return;
    }

    const remoteSchema = await FormApi.fetchSchema(CONFIG);
    const remoteFields = Array.isArray(remoteSchema?.schema) ? remoteSchema.schema : Array.isArray(remoteSchema) ? remoteSchema : [];
    const remoteUiConfig = remoteSchema && typeof remoteSchema === "object" && !Array.isArray(remoteSchema)
      ? remoteSchema.uiConfig
      : null;
    const remoteTitle = remoteSchema && typeof remoteSchema === "object" && !Array.isArray(remoteSchema)
      ? cleanString(remoteSchema.title || "")
      : "";
    const remoteSlug = remoteSchema && typeof remoteSchema === "object" && !Array.isArray(remoteSchema)
      ? cleanString(remoteSchema.slug || "")
      : "";

    if (Array.isArray(remoteFields)) {
      state.schema = normalizeSchema(remoteFields);
      saveSchema();
    }

    if (remoteUiConfig && typeof remoteUiConfig === "object") {
      state.uiConfig = {
        ...getDefaultUiConfig(),
        ...normalizeUiConfig(remoteUiConfig)
      };
      saveUiConfig();
    }

    if (!isBuilderPage()) {
      state.formMeta.title = remoteTitle;
      state.formMeta.slug = remoteSlug;
    }
  });
}

function getScopedStorageKey(baseKey) {
  const slug = cleanString(CONFIG.form?.slug || "").trim();
  return slug ? `${baseKey}:${slug}` : baseKey;
}

function buildAnswersForSubmission(fields = getFields()) {
  const answers = {};
  const optionQuantities = {};

  forEachVisibleField(fields, field => {
    const value = state.values[field.id];

    if (field.type === "multi") {
      const selectedValues = Array.isArray(value) ? value : [];
      const filteredValues = selectedValues.filter(optionValue => {
        const option = findOption(field, optionValue);
        return option && isOptionVisible(option) && !option.locked;
      });

      if (filteredValues.length) {
        answers[field.id] = filteredValues;
        filteredValues.forEach(optionValue => {
          const option = findOption(field, optionValue);
          const quantityKey = getOptionQuantityKey(field.id, optionValue);
          if (option || Object.prototype.hasOwnProperty.call(state.optionQuantities || {}, quantityKey)) {
            optionQuantities[quantityKey] = getOptionQuantity(field.id, optionValue);
          }
        });
      }
    } else if (field.type === "single") {
      const option = findOption(field, value);
      if (option && isOptionVisible(option) && !option.locked) {
        answers[field.id] = value;
      }
    } else if ((field.type === "text" || field.type === "date") && !isEmptyValue(value)) {
      answers[field.id] = value;
    }
  });

  if (Object.keys(optionQuantities).length) {
    answers.__optionQuantities = optionQuantities;
  }

  return answers;
}

function buildSelectedSummary() {
  const summary = [];

  forEachSelectedOption(getFields(), (field, option) => {
    if (option.locked) {
      return;
    }

    summary.push({
      fieldId: field.id,
      value: option.value,
      label: getOptionQuantity(field.id, option.value) > 1 ? `${option.label} x${getOptionQuantity(field.id, option.value)}` : option.label
    });
  });

  return summary;
}

function buildSubmissionPayload() {
  syncDependentOptionSelections();
  syncLinkedOptionQuantities();
  const total = calculateTotal();

  return {
    submissionId: state.meta.submissionId,
    name: state.profile.name,
    group: state.profile.group,
    participants: getPricingParticipantCount(),
    pricingParticipants: getPricingParticipantCount(),
    displayParticipants: getDisplayParticipantCount(),
    hours: getHoursCount(),
    schema: getFields(),
    answers: buildAnswersForSubmission(),
    summary: buildSelectedSummary(),
    total,
    perPerson: Math.round(total / getPricingParticipantCount()),
    updatedAt: new Date().toISOString()
  };
}

async function loadStats() {
  const result = await FormApi.fetchStats(CONFIG);
  state.stats = {
    responsesCount: result.responsesCount || 0,
    optionCounts: result.optionCounts || {}
  };
}

async function submitForm() {
  if (!isFormValid()) {
    updateSubmitUi();
    scrollToFirstInvalidArea();
    return;
  }

  openConfirmModal("submit");
}

function openConfirmModal(action) {
  state.pendingConfirmAction = action;

  if (action === "reset-schema") {
    ui.confirmTitle.textContent = "Сбросить схему формы?";
    ui.confirmText.textContent = "Мы заменим текущую схему вопросами и настройками из config.js.";
    ui.confirmSubmitBtn.textContent = "Да, сбросить";
  } else if (action === "reset-all-data") {
    ui.confirmTitle.textContent = "Удалить все ответы пользователей?";
    ui.confirmText.textContent = "Все пользовательские ответы для текущей формы будут удалены без возможности восстановления.";
    ui.confirmSubmitBtn.textContent = "Да, удалить";
  } else {
    ui.confirmTitle.textContent = state.meta.hasSubmitted ? "Обновить отправленную форму?" : "Подтвердить отправку?";
    ui.confirmText.textContent = state.meta.hasSubmitted ? "Мы перезапишем ваш предыдущий ответ и обновим выбранные параметры формы." : "После отправки выбор сохранится, и его можно будет изменить позже.";
    ui.confirmSubmitBtn.textContent = "Да, отправить";
  }

  ui.confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  state.pendingConfirmAction = null;
  ui.confirmModal.classList.add("hidden");
}

async function confirmModalAction() {
  const action = state.pendingConfirmAction;
  closeConfirmModal();

  if (action === "reset-schema") {
    localStorage.removeItem(getScopedStorageKey(CONFIG.storage.schemaKey));
    state.schema = getDefaultSchema();
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    saveDraft();
    ui.submitStatus.textContent = "Схема формы сброшена. Вернули вопросы и настройки из config.js.";
    return;
  }

  if (action === "reset-all-data") {
    ui.submitStatus.textContent = "Удаляем все ответы...";
    try {
      await FormApi.resetAllData(CONFIG, getBuilderBearerToken());
      localStorage.removeItem(getScopedStorageKey(CONFIG.storage.draftKey));
      localStorage.removeItem(getScopedStorageKey(CONFIG.storage.statsKey));
      resetFormState();
      state.stats = { responsesCount: 0, optionCounts: {} };
      if (ui.name) ui.name.value = "";
      if (ui.group) ui.group.value = "";
      if (ui.dynamic) { renderAll(); refreshUI(false); } else { renderBuilder(); }
      saveDraft();
      ui.submitStatus.textContent = "Все пользовательские ответы удалены.";
    } catch (error) {
      console.error(error);
      ui.submitStatus.textContent = "Не удалось удалить пользовательские ответы. Проверьте авторизацию и попробуйте еще раз.";
    }
    return;
  }

  state.isSubmitting = true;
  ui.submitStatus.textContent = "Отправляем форму...";
  updateSubmitUi();

  try {
    const payload = buildSubmissionPayload();
    const result = await FormApi.submit(CONFIG, payload);
    state.meta.hasSubmitted = true;
    state.meta.lastSubmittedAt = payload.updatedAt;
    saveDraft();
    await loadStats();
    refreshUI(true);
    ui.submitStatus.textContent = result.source === "remote" ? "Форма отправлена и сохранена в базе. Вы сможете обновить ее позже." : "Форма отправлена только локально.";
  } catch (error) {
    console.error(error);
    ui.submitStatus.textContent = "Не удалось отправить форму. Проверьте подключение и попробуйте еще раз.";
  } finally {
    state.isSubmitting = false;
    updateSubmitUi();
  }
}

function clearCurrentSelection() {
  state.values = {};
  initializeDefaults(getFields());
  state.profile.hours = 1;
  state.meta.hasSubmitted = false;
  state.meta.lastSubmittedAt = "";
  saveDraft();
  refreshUI(true);
  ui.submitStatus.textContent = "Выбор очищен.";
}

function bindProfileInputs() {
  ui.name.value = state.profile.name;
  ui.group.value = state.profile.group;
  if (ui.hours) {
    ui.hours.value = getHoursCount();
    ui.hours.previousElementSibling && (ui.hours.previousElementSibling.textContent = text(state.uiConfig.hoursFieldLabel || getDefaultUiConfig().hoursFieldLabel));
  }

  ui.name.addEventListener("input", event => {
    state.profile.name = event.target.value;
    saveDraft();
    refreshUI(false);
  });

  ui.group.addEventListener("input", event => {
    state.profile.group = event.target.value;
    saveDraft();
    refreshUI(false);
  });

  if (ui.hours) {
    const commitHoursValue = () => {
      const rawValue = cleanString(ui.hours.value).replace(/[^\d]/g, "");
      const nextValue = parsePositiveCount(rawValue, 1);
      state.profile.hours = nextValue;
      ui.hours.value = String(nextValue);
      saveDraft();
      refreshUI(false);
    };

    ui.hours.addEventListener("focus", () => {
      window.setTimeout(() => {
        try {
          ui.hours.select();
        } catch {
          // noop
        }
      }, 0);
    });

    ui.hours.addEventListener("input", event => {
      const digitsOnly = cleanString(event.target.value).replace(/[^\d]/g, "");
      event.target.value = digitsOnly;
      if (!digitsOnly) {
        return;
      }
      state.profile.hours = parsePositiveCount(digitsOnly, 1);
      saveDraft();
      refreshUI(false);
    });

    ui.hours.addEventListener("blur", commitHoursValue);
    ui.hours.addEventListener("change", commitHoursValue);
  }
}

async function initializeFormPage() {
  try {
    await runWithLoading("Готовим форму...", async () => {
      ui.participantsCount.textContent = getDisplayParticipantCount();
      hydrateDraft();
      initializeDefaults(getFields());
      bindProfileInputs();

      try {
        await loadStats();
      } catch (error) {
        console.error(error);
      }

      renderAll();
      refreshUI(false);

      ui.detailsBtn.addEventListener("click", openDetails);
      ui.saveBtn.addEventListener("click", submitForm);
      ui.clearSelectionBtn?.addEventListener("click", clearCurrentSelection);
      ui.closeModal.addEventListener("click", closeDetails);
      ui.confirmCancelBtn.addEventListener("click", closeConfirmModal);
      ui.confirmSubmitBtn.addEventListener("click", confirmModalAction);
      ui.detailsModal.addEventListener("click", event => {
        if (event.target === ui.detailsModal) {
          closeDetails();
        }
      });
      ui.confirmModal.addEventListener("click", event => {
        if (event.target === ui.confirmModal) {
          closeConfirmModal();
        }
      });
      ui.scrollTopBtn?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
      updateScrollTopVisibility();
      saveDraft();
    });
  } finally {
    resetLoadingOverlay();
  }
}
