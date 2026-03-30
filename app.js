const state = {
  values: {},
  schema: [],
  uiConfig: {},
  profile: {
    name: "",
    group: ""
  },
  meta: {
    submissionId: "",
    hasSubmitted: false,
    lastSubmittedAt: ""
  },
  stats: {
    responsesCount: 0,
    optionCounts: {}
  },
  optionDetailsOpen: {},
  schemaSync: {
    timerId: 0,
    isSaving: false
  },
  carouselScroll: {},
  isSubmitting: false,
  pendingConfirmAction: null,
  sectionObserver: null,
  builder: {
    drag: null,
    dragArmed: null,
    activeTab: "constructor",
    collapsedDependencies: {},
    responses: {
      loading: false,
      rows: [],
      headers: []
    }
  }
};

const ui = {
  pageMode: "form",
  dynamic: null,
  perPerson: null,
  participantsCount: null,
  responsesCount: null,
  detailsBtn: null,
  saveBtn: null,
  submitStatus: null,
  detailsModal: null,
  detailsContent: null,
  closeModal: null,
  confirmModal: null,
  confirmTitle: null,
  confirmText: null,
  confirmCancelBtn: null,
  confirmSubmitBtn: null,
  builderContent: null,
  builderActions: null,
  builderSidebar: null,
  builderLayout: null,
  closeBuilderBtn: null,
  saveSchemaBtn: null,
  addFieldFromSidebarBtn: null,
  addTopFieldBtn: null,
  resetSchemaBtn: null,
  resetAllDataBtn: null,
  builderGate: null,
  builderWorkspace: null,
  builderPasscode: null,
  unlockBuilderBtn: null,
  builderAuthError: null,
  builderTabs: [],
  builderOutline: null,
  pageTitle: null,
  heroKicker: null,
  heroHeadline: null,
  heroSubline: null,
  heroBadge: null,
  heroNote: null,
  userSectionTitle: null,
  userSectionHint: null,
  participantsStatLabel: null,
  responsesStatLabel: null,
  name: null,
  group: null,
  profileError: null,
  profileCard: null,
  scrollTopBtn: null
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function cleanString(value) {
  return typeof value === "string" ? text(value) : value;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}

function isAppleMobileDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function extractCoordinatesFromMapUrl(rawUrl) {
  const source = cleanString(rawUrl || "").trim();
  if (!source) {
    return null;
  }

  const pairMatch = source.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (pairMatch) {
    return {
      lat: Number(pairMatch[1]),
      lng: Number(pairMatch[2])
    };
  }

  try {
    const parsedUrl = new URL(source);
    const ll = parsedUrl.searchParams.get("ll");
    if (ll && ll.includes(",")) {
      const [lng, lat] = ll.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    const queryCoords = parsedUrl.searchParams.get("q") || parsedUrl.searchParams.get("query");
    if (queryCoords && /-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(queryCoords)) {
      const [lat, lng] = queryCoords.split(",").map(part => Number(part.trim()));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    const atMatch = parsedUrl.pathname.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
    if (atMatch) {
      return {
        lat: Number(atMatch[1]),
        lng: Number(atMatch[2])
      };
    }
  } catch {
    return null;
  }

  return null;
}

function extractMapQuery(rawUrl) {
  const source = cleanString(rawUrl || "").trim();
  if (!source) {
    return "";
  }

  try {
    const parsedUrl = new URL(source);
    return cleanString(
      parsedUrl.searchParams.get("q")
      || parsedUrl.searchParams.get("query")
      || parsedUrl.searchParams.get("text")
      || parsedUrl.searchParams.get("destination")
      || ""
    ).trim();
  } catch {
    return "";
  }
}

function buildMobileMapHref(rawUrl, fallbackLabel) {
  const source = cleanString(rawUrl || "").trim();
  if (!source) {
    return "";
  }

  if (/^(geo:|maps:|comgooglemaps:|yandexmaps:|dgis:)/i.test(source)) {
    return source;
  }

  const coordinates = extractCoordinatesFromMapUrl(source);
  const query = extractMapQuery(source) || cleanString(fallbackLabel || "").trim();

  if (isAppleMobileDevice()) {
    if (coordinates) {
      const labelQuery = query ? `&q=${encodeURIComponent(query)}` : "";
      return `https://maps.apple.com/?ll=${coordinates.lat},${coordinates.lng}${labelQuery}`;
    }

    if (query) {
      return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
    }

    return source;
  }

  if (isAndroidDevice()) {
    if (coordinates) {
      return `geo:${coordinates.lat},${coordinates.lng}`;
    }

    if (query) {
      return `geo:0,0?q=${encodeURIComponent(query)}`;
    }

    return source;
  }

  return source;
}

function buildDesktopMapHref(rawUrl, fallbackLabel) {
  const source = cleanString(rawUrl || "").trim();
  if (!source) {
    return "";
  }

  if (/^(https?:|geo:|maps:|comgooglemaps:|yandexmaps:|dgis:)/i.test(source)) {
    return source;
  }

  const coordinates = extractCoordinatesFromMapUrl(source);
  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
  }

  const query = extractMapQuery(source) || cleanString(fallbackLabel || "").trim();
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return source;
}

function isBuilderPage() {
  return ui.pageMode === "builder";
}

function getAdminToken() {
  return localStorage.getItem(CONFIG.storage.adminTokenKey) || "";
}

function isAdminUnlocked() {
  return Boolean(getAdminToken());
}

function setAdminToken(token) {
  if (token) {
    localStorage.setItem(CONFIG.storage.adminTokenKey, token);
    return;
  }

  localStorage.removeItem(CONFIG.storage.adminTokenKey);
}

function getFields() {
  return state.schema;
}

function getDefaultUiConfig() {
  return normalizeUiConfig(deepClone(CONFIG.ui || {}));
}

function getDefaultSchema() {
  return normalizeSchema(deepClone(CONFIG.fields || []));
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
}

function hasStoredValue(fieldId) {
  return Object.prototype.hasOwnProperty.call(state.values, fieldId);
}

function isEmptyValue(value) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function getProfileError() {
  if (isEmptyValue(state.profile.name) && isEmptyValue(state.profile.group)) {
    return "Заполните ФИО и учебную группу";
  }

  if (isEmptyValue(state.profile.name)) {
    return "Поле ФИО обязательно";
  }

  if (isEmptyValue(state.profile.group)) {
    return "Поле Учебная группа обязательно";
  }

  return "";
}

function formatPerPerson(amount, people) {
  return `${Math.round(amount / people)} ₽/чел`;
}

function formatTotal(amount) {
  return `${amount} ₽`;
}

function generateSubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultValue(field) {
  if (field.type === "multi") {
    return field.options?.filter(option => option.defaultSelected).map(option => option.value) || [];
  }

  if (field.type === "single") {
    return field.options?.find(option => option.defaultSelected)?.value || null;
  }

  if (field.type === "text") {
    return "";
  }

  return null;
}

function getParticipantCount() {
  const rawValue = state.uiConfig?.participantsCount ?? CONFIG.participants;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : CONFIG.participants;
}

function normalizeUiConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  return {
    ...source,
    pageTitle: cleanString(source.pageTitle || ""),
    heroKicker: cleanString(source.heroKicker || "Private estate edition"),
    heroHeadline: cleanString(source.heroHeadline || "Выберите площадку, бар и программу так, будто уже продаете сам вечер."),
    heroSubline: cleanString(source.heroSubline || "Форма собрана как афиша события: крупные ticket-style акценты, рваные неоновые плашки и понятный маршрут от площадки до afterparty."),
    heroBadge: cleanString(source.heroBadge || "Sale focus"),
    heroNote: cleanString(source.heroNote || "Лучше всего работает как презентация коттеджа, загородной площадки и полного сценария вечера."),
    userSectionTitle: cleanString(source.userSectionTitle || ""),
    userSectionHint: cleanString(source.userSectionHint || ""),
    namePlaceholder: cleanString(source.namePlaceholder || ""),
    groupPlaceholder: cleanString(source.groupPlaceholder || ""),
    participantsStatLabel: cleanString(source.participantsStatLabel || ""),
    responsesStatLabel: cleanString(source.responsesStatLabel || ""),
    ticketLabel: cleanString(source.ticketLabel || ""),
    detailsButtonLabel: cleanString(source.detailsButtonLabel || ""),
    saveButtonLabel: cleanString(source.saveButtonLabel || ""),
    resubmitButtonLabel: cleanString(source.resubmitButtonLabel || ""),
    draftStatusText: cleanString(source.draftStatusText || ""),
    buttonPrimaryStart: source.buttonPrimaryStart || "",
    buttonPrimaryEnd: source.buttonPrimaryEnd || "",
    buttonDetailsStart: source.buttonDetailsStart || "",
    buttonDetailsEnd: source.buttonDetailsEnd || "",
    buttonSecondaryBg: source.buttonSecondaryBg || "",
    buttonSecondaryText: source.buttonSecondaryText || "",
    pageGlowPrimary: source.pageGlowPrimary || "",
    pageGlowSecondary: source.pageGlowSecondary || "",
    pageBgStart: source.pageBgStart || "",
    pageBgMid: source.pageBgMid || "",
    pageBgEnd: source.pageBgEnd || "",
    heroAccent: source.heroAccent || "",
    heroSurfaceStart: source.heroSurfaceStart || "",
    heroSurfaceEnd: source.heroSurfaceEnd || "",
    surfaceStart: source.surfaceStart || "",
    surfaceEnd: source.surfaceEnd || "",
    surfaceText: source.surfaceText || "",
    surfaceBorder: source.surfaceBorder || "",
    checkTableStart: source.checkTableStart || "",
    checkTableEnd: source.checkTableEnd || "",
    participantsCount: Number(source.participantsCount) || CONFIG.participants
  };
}

function normalizeDependency(rule) {
  return {
    id: rule?.id || generateId("dep"),
    fieldId: rule?.fieldId || "",
    operator: rule?.operator || "equals",
    value: rule?.value ?? ""
  };
}

function normalizeDependencyGroup(group) {
  return {
    id: group?.id || generateId("dep_group"),
    joiner: group?.joiner === "or" ? "or" : "and",
    rules: Array.isArray(group?.rules) ? group.rules.map(normalizeDependency) : []
  };
}

function normalizeDependencies(dependsOn) {
  if (Array.isArray(dependsOn)) {
    return {
      joiner: "and",
      groups: dependsOn.length ? [normalizeDependencyGroup({ joiner: "and", rules: dependsOn })] : []
    };
  }

  if (dependsOn && typeof dependsOn === "object") {
    return {
      joiner: dependsOn.joiner === "or" ? "or" : "and",
      groups: Array.isArray(dependsOn.groups) ? dependsOn.groups.map(normalizeDependencyGroup) : []
    };
  }

  return {
    joiner: "and",
    groups: []
  };
}

function appendDependencyRule(dependsOn, rule) {
  const normalized = normalizeDependencies(dependsOn);
  if (!normalized.groups.length) {
    normalized.groups.push(normalizeDependencyGroup({ joiner: "and", rules: [] }));
  }
  normalized.groups[0].rules.push(normalizeDependency(rule));
  return normalized;
}

function normalizeOption(option) {
  return {
    value: cleanString(option?.value) || generateId("option"),
    label: cleanString(option?.label) || "Новый вариант",
    description: cleanString(option?.description) || "",
    details: cleanString(option?.details) || "",
    mapUrl: cleanString(option?.mapUrl) || "",
    image: cleanString(option?.image) || "",
    price: Number(option?.price) || 0,
    priceType: option?.priceType || "fixed",
    promoText: cleanString(option?.promoText) || "",
    defaultSelected: Boolean(option?.defaultSelected),
    locked: Boolean(option?.locked)
  };
}

function normalizeField(field) {
  const normalized = {
    id: cleanString(field?.id) || generateId("field"),
    label: cleanString(field?.label) || "Новое поле",
    hint: cleanString(field?.hint) || "",
    promoTag: cleanString(field?.promoTag) || "",
    promoTitle: cleanString(field?.promoTitle) || "",
    promoSubtitle: cleanString(field?.promoSubtitle) || "",
    type: field?.type || "single",
    required: Boolean(field?.required),
    appearance: field?.appearance || undefined,
    dependsOn: normalizeDependencies(field?.dependsOn)
  };

  if (normalized.type !== "text") {
    normalized.options = Array.isArray(field?.options) && field.options.length
      ? field.options.map(normalizeOption)
      : [createOptionTemplate()];
  }

  return normalized;
}

function flattenLegacyChildren(field, collector) {
  const normalized = normalizeField(field);
  collector.push(normalized);

  (field?.options || []).forEach(option => {
    if (!Array.isArray(option?.children)) {
      return;
    }

    option.children.forEach(child => {
      const childWithDependency = {
        ...deepClone(child),
        dependsOn: appendDependencyRule(child?.dependsOn, {
          fieldId: normalized.id,
          operator: normalized.type === "multi" ? "includes" : "equals",
          value: option.value
        })
      };
      flattenLegacyChildren(childWithDependency, collector);
    });
  });
}

function normalizeSchema(fields) {
  const flat = [];
  (fields || []).forEach(field => flattenLegacyChildren(field, flat));

  const seen = new Set();
  return flat.filter(field => {
    if (seen.has(field.id)) {
      return false;
    }

    seen.add(field.id);
    return true;
  });
}

function calcItem(option, people) {
  if (!option || !option.price) {
    return 0;
  }

  if (option.priceType === "fixed") {
    return option.price;
  }

  if (option.priceType === "perPerson") {
    return option.price * people;
  }

  return 0;
}

function getOptionPriceLabel(option, people) {
  if (option.locked && option.promoText) {
    return option.promoText;
  }

  if (!option.price) {
    return "Бесплатно";
  }

  if (option.priceType === "fixed") {
    return `${Math.round(option.price / people)} ₽/чел`;
  }

  return `${option.price} ₽/чел`;
}

function isOptionSelected(field, option) {
  const value = state.values[field.id];

  if (field.type === "multi") {
    return Array.isArray(value) && value.includes(option.value);
  }

  return value === option.value;
}

function isOptionLocked(option) {
  return Boolean(option.locked);
}

function toggleOption(field, optionValue) {
  const option = field.options?.find(item => item.value === optionValue);
  if (option?.locked) {
    return;
  }

  if (field.type === "multi") {
    const current = Array.isArray(state.values[field.id]) ? [...state.values[field.id]] : [];

    if (current.includes(optionValue)) {
      state.values[field.id] = current.filter(value => value !== optionValue);
    } else {
      current.push(optionValue);
      state.values[field.id] = current;
    }

    return;
  }

  state.values[field.id] = state.values[field.id] === optionValue ? null : optionValue;
}

function initializeDefaults(fields) {
  fields.forEach(field => {
    if (!hasStoredValue(field.id)) {
      state.values[field.id] = getDefaultValue(field);
    } else if (field.type === "multi") {
      const lockedDefaults = field.options?.filter(option => option.defaultSelected).map(option => option.value) || [];
      const currentValues = Array.isArray(state.values[field.id]) ? state.values[field.id] : [];
      state.values[field.id] = [...new Set([...currentValues, ...lockedDefaults])];
    } else if (field.type === "single") {
      const defaultOption = field.options?.find(option => option.defaultSelected);
      if (defaultOption && isEmptyValue(state.values[field.id])) {
        state.values[field.id] = defaultOption.value;
      }
    }
  });
}

function resetFormState() {
  state.values = {};
  state.profile = {
    name: "",
    group: ""
  };
  state.meta = {
    submissionId: generateSubmissionId(),
    hasSubmitted: false,
    lastSubmittedAt: ""
  };

  initializeDefaults(getFields());
}

function rebuildValuesForCurrentSchema() {
  state.values = {};
  initializeDefaults(getFields());
}

function findOption(field, optionValue) {
  return field.options?.find(option => option.value === optionValue) || null;
}

function matchesDependency(rule) {
  if (!rule?.fieldId) {
    return true;
  }

  const currentValue = state.values[rule.fieldId];
  const expectedValue = rule.value;

  switch (rule.operator) {
    case "notEquals":
      return currentValue !== expectedValue;
    case "includes":
      return Array.isArray(currentValue) ? currentValue.includes(expectedValue) : currentValue === expectedValue;
    case "notIncludes":
      return Array.isArray(currentValue) ? !currentValue.includes(expectedValue) : currentValue !== expectedValue;
    case "equals":
    default:
      return currentValue === expectedValue;
  }
}

function evaluateDependencyGroup(group) {
  if (!group?.rules?.length) {
    return true;
  }

  return group.joiner === "or"
    ? group.rules.some(matchesDependency)
    : group.rules.every(matchesDependency);
}

function isFieldVisible(field) {
  const visibility = normalizeDependencies(field.dependsOn);
  if (!visibility.groups.length) {
    return true;
  }

  return visibility.joiner === "or"
    ? visibility.groups.some(evaluateDependencyGroup)
    : visibility.groups.every(evaluateDependencyGroup);
}

function forEachVisibleField(fields, visitor) {
  fields.forEach(field => {
    if (isFieldVisible(field)) {
      visitor(field);
    }
  });
}

function forEachSelectedOption(fields, visitor) {
  forEachVisibleField(fields, field => {
    field.options?.forEach(option => {
      if (!isOptionSelected(field, option)) {
        return;
      }

      visitor(field, option);
    });
  });
}

function validateField(field) {
  if (!field.required) {
    return "";
  }

  const value = state.values[field.id];
  if (isEmptyValue(value)) {
    return Array.isArray(value)
      ? "Выберите хотя бы один вариант"
      : "Обязательное поле";
  }

  return "";
}

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
    ui.submitStatus.textContent = "Сначала заполните блок с именем и группой.";
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
  if (option.locked) {
    return "";
  }

  const count = state.stats.optionCounts?.[field.id]?.[option.value] || 0;
  const total = state.stats.responsesCount || 0;
  if (!total || !count) {
    return "";
  }

  const percent = Math.round((count / total) * 100);
  return `Этот вариант выбрали ${percent}% группы`;
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
  selector.className = `option-selector`;

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

  if (option.locked && option.promoText) {
    const promoBadge = document.createElement("span");
    promoBadge.className = "option-badge option-badge-promo";
    promoBadge.textContent = text(option.promoText);
    topRow.appendChild(promoBadge);
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

  if (Array.isArray(field.options) && field.options.length) {
    if (field.appearance === "media-carousel") {
      const carousel = document.createElement("div");
      carousel.className = "option-carousel";

      const previousBtn = document.createElement("button");
      previousBtn.type = "button";
      previousBtn.className = "option-carousel-nav option-carousel-prev";
      previousBtn.textContent = "←";

      const track = document.createElement("div");
      track.className = "option-carousel-track";
      track.dataset.fieldId = field.id;

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "option-carousel-nav option-carousel-next";
      nextBtn.textContent = "→";

      const mobileHint = document.createElement("div");
      mobileHint.className = "option-carousel-hint";
      mobileHint.textContent = "Листайте карточки или используйте стрелки";

      field.options.forEach(option => {
        track.appendChild(createOptionNode(field, option, getParticipantCount()));
      });

      carousel.append(previousBtn, track, nextBtn, mobileHint);
      mountCarouselControls(track, previousBtn, nextBtn, field.id);
      wrapper.appendChild(carousel);
    } else {
      field.options.forEach(option => {
        wrapper.appendChild(createOptionNode(field, option, getParticipantCount()));
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

function calculateTotal() {
  let total = 0;

  forEachSelectedOption(getFields(), (_, option) => {
    total += calcItem(option, getParticipantCount());
  });

  const ticketLabel = text(state.uiConfig.ticketLabel || getDefaultUiConfig().ticketLabel);
  ui.perPerson.textContent = `${ticketLabel}: ${formatPerPerson(total, getParticipantCount())}`;
  return total;
}

function generateDetails() {
  const rows = [];
  let total = 0;

  forEachSelectedOption(getFields(), (_, option) => {
    const sum = calcItem(option, getParticipantCount());
    total += sum;

    rows.push(`
      <tr>
        <td>${option.label}</td>
        <td>${formatTotal(sum)}</td>
        <td>${formatPerPerson(sum, getParticipantCount())}</td>
      </tr>
    `);
  });

  rows.push(`
    <tr class="check-table-total">
      <td><b>Итого</b></td>
      <td><b>${formatTotal(total)}</b></td>
      <td><b>${formatPerPerson(total, getParticipantCount())}</b></td>
    </tr>
  `);

  return `
    <div class="check-table-wrap">
      <table class="check-table">
        <thead>
          <tr>
            <th>Позиция</th>
            <th>Общий чек</th>
            <th>На человека</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
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
    ui.pageTitle.textContent = text(cfg.pageTitle);
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
    ui.participantsCount.textContent = getParticipantCount();
  }

  if (ui.responsesStatLabel) {
    ui.responsesStatLabel.textContent = text(cfg.responsesStatLabel);
  }

  if (ui.detailsBtn && !state.isSubmitting) {
    ui.detailsBtn.textContent = text(cfg.detailsButtonLabel);
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
  ui.saveBtn.textContent = state.isSubmitting
    ? "Отправка..."
    : state.meta.hasSubmitted
      ? text(state.uiConfig.resubmitButtonLabel || getDefaultUiConfig().resubmitButtonLabel)
      : text(state.uiConfig.saveButtonLabel || getDefaultUiConfig().saveButtonLabel);

  if (state.meta.hasSubmitted && state.meta.lastSubmittedAt && !state.isSubmitting) {
    ui.submitStatus.textContent = `Ответ сохранён. Вы можете изменить форму и отправить обновлённый вариант. Последнее обновление: ${new Date(state.meta.lastSubmittedAt).toLocaleString("ru-RU")}`;
  } else if (!state.isSubmitting && !state.meta.hasSubmitted && !profileError) {
    ui.submitStatus.textContent = CONFIG.api.baseUrl
      ? text(state.uiConfig.draftStatusText || getDefaultUiConfig().draftStatusText)
      : "Сейчас включён только локальный режим. Чтобы записи попадали в базу данных, запустите backend и проверьте CONFIG.api.baseUrl.";
  }
}

function refreshUI(shouldRender) {
  if (shouldRender) {
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
    return JSON.parse(localStorage.getItem(CONFIG.storage.draftKey) || "null");
  } catch {
    return null;
  }
}

function saveDraft() {
  const draft = {
    values: state.values,
    profile: state.profile,
    meta: state.meta
  };

  localStorage.setItem(CONFIG.storage.draftKey, JSON.stringify(draft));
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
      group: draft.profile.group || ""
    };
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
    return JSON.parse(localStorage.getItem(CONFIG.storage.schemaKey) || "null");
  } catch {
    return null;
  }
}

function readUiConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storage.uiConfigKey) || "null");
  } catch {
    return null;
  }
}

function saveSchema() {
  localStorage.setItem(CONFIG.storage.schemaKey, JSON.stringify(state.schema));
}

function saveUiConfig() {
  localStorage.setItem(CONFIG.storage.uiConfigKey, JSON.stringify(state.uiConfig));
}

function hydrateSchema() {
  const localSchema = readSchema();
  state.schema = Array.isArray(localSchema) && localSchema.length
    ? normalizeSchema(localSchema)
    : getDefaultSchema();

  const localUiConfig = readUiConfig();
  state.uiConfig = {
    ...getDefaultUiConfig(),
    ...normalizeUiConfig(localUiConfig && typeof localUiConfig === "object" ? localUiConfig : {})
  };
}

async function loadRemoteSchema() {
  if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.fetchSchema !== "function") {
    return;
  }

  const remoteSchema = await FormApi.fetchSchema(CONFIG);
  const remoteFields = Array.isArray(remoteSchema?.schema) ? remoteSchema.schema : Array.isArray(remoteSchema) ? remoteSchema : [];
  const remoteUiConfig = remoteSchema && typeof remoteSchema === "object" && !Array.isArray(remoteSchema)
    ? remoteSchema.uiConfig
    : null;

  if (Array.isArray(remoteFields) && remoteFields.length) {
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

  if ((state.schema.length || Object.keys(state.uiConfig).length) && typeof FormApi.saveSchema === "function" && getAdminToken()) {
    await FormApi.saveSchema(CONFIG, state.schema, state.uiConfig, getAdminToken());
  }
}

function queueSchemaSync() {
  if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.saveSchema !== "function") {
    return;
  }

  if (state.schemaSync.timerId) {
    clearTimeout(state.schemaSync.timerId);
  }

  state.schemaSync.timerId = window.setTimeout(async () => {
    state.schemaSync.timerId = 0;
    state.schemaSync.isSaving = true;

    try {
      await FormApi.saveSchema(CONFIG, state.schema, state.uiConfig, getAdminToken());
      if (isBuilderPage() && ui.submitStatus) {
        ui.submitStatus.textContent = "Изменения схемы сохранены и синхронизированы с базой данных.";
      }
    } catch (error) {
      console.error(error);
      if (String(error.message || "").toLowerCase().includes("admin")) {
        setAdminToken("");
      }
      if (!state.isSubmitting) {
        ui.submitStatus.textContent = "Не удалось синхронизировать изменения конструктора с базой данных. Локальная схема сохранена.";
      }
    } finally {
      state.schemaSync.isSaving = false;
    }
  }, 350);
}

async function saveSchemaNow() {
  saveSchema();
  saveUiConfig();

  if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.saveSchema !== "function") {
    ui.submitStatus.textContent = "Схема сохранена локально. Для синхронизации укажите URL backend API.";
    return;
  }

  try {
    ui.submitStatus.textContent = "Сохраняем изменения...";
    await FormApi.saveSchema(CONFIG, state.schema, state.uiConfig, getAdminToken());
    ui.submitStatus.textContent = "Изменения сохранены и синхронизированы с базой данных.";
  } catch (error) {
    console.error(error);
    if (String(error.message || "").toLowerCase().includes("admin")) {
      setAdminToken("");
      ui.submitStatus.textContent = "Сессия администратора истекла. Войдите в конструктор заново и повторите сохранение.";
      return;
    }
    ui.submitStatus.textContent = `Не удалось сохранить схему в базе данных: ${error.message || "неизвестная ошибка"}. Локальная версия сохранена.`;
  }
}

async function loadResponsesPreview() {
  if (!window.FormApi || typeof FormApi.fetchResponses !== "function") {
    return;
  }

  state.builder.responses.loading = true;
  try {
    const result = await FormApi.fetchResponses(CONFIG, getAdminToken());
    state.builder.responses.headers = Array.isArray(result.headers) ? result.headers : [];
    state.builder.responses.rows = Array.isArray(result.rows) ? result.rows : [];
  } catch (error) {
    console.error(error);
    state.builder.responses.headers = [];
    state.builder.responses.rows = [];
    ui.submitStatus.textContent = `Не удалось загрузить ответы: ${error.message || "ошибка"}`;
  } finally {
    state.builder.responses.loading = false;
  }
}

function buildAnswersForSubmission(fields = getFields()) {
  const answers = {};

  forEachVisibleField(fields, field => {
    const value = state.values[field.id];

    if (field.type === "multi") {
      const selectedValues = Array.isArray(value) ? value : [];
      const filteredValues = selectedValues.filter(optionValue => {
        const option = findOption(field, optionValue);
        return option && !option.locked;
      });

      if (filteredValues.length) {
        answers[field.id] = filteredValues;
      }
    } else if (field.type === "single") {
      const option = findOption(field, value);
      if (option && !option.locked) {
        answers[field.id] = value;
      }
    } else if (field.type === "text" && !isEmptyValue(value)) {
      answers[field.id] = value;
    }

  });

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
      label: option.label
    });
  });

  return summary;
}

function buildSubmissionPayload() {
  const total = calculateTotal();

  return {
    submissionId: state.meta.submissionId,
    name: state.profile.name,
    group: state.profile.group,
    participants: getParticipantCount(),
    schema: getFields(),
    answers: buildAnswersForSubmission(),
    summary: buildSelectedSummary(),
    total,
    perPerson: Math.round(total / getParticipantCount()),
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
    ui.confirmTitle.textContent = "Вернуть исходную форму?";
    ui.confirmText.textContent = "Мы удалим локально сохранённую схему конструктора и восстановим исходную структуру формы из config.js.";
    ui.confirmSubmitBtn.textContent = "Да, восстановить";
  } else if (action === "reset-all-data") {
    ui.confirmTitle.textContent = "Полностью удалить данные пользователей?";
    ui.confirmText.textContent = "Мы очистим все ответы пользователей локально и удалим их из базы данных. Схема формы останется, но ответы, статистика и черновики будут удалены.";
    ui.confirmSubmitBtn.textContent = "Да, удалить всё";
  } else {
    ui.confirmTitle.textContent = state.meta.hasSubmitted
      ? "Обновить отправленный ответ?"
      : "Отправить форму?";
    ui.confirmText.textContent = state.meta.hasSubmitted
      ? "Мы сохраним ваши изменения и обновим существующую запись, а не создадим нового пользователя."
      : "Ответ будет сохранён и привязан к этому устройству, поэтому позже его можно изменить и отправить заново.";
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
    localStorage.removeItem(CONFIG.storage.schemaKey);
    state.schema = getDefaultSchema();
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    saveDraft();
    ui.submitStatus.textContent = "Конструктор сброшен. Исходная форма восстановлена.";
    return;
  }

  if (action === "reset-all-data") {
    ui.submitStatus.textContent = "Удаляем ответы пользователей...";

    try {
      await FormApi.resetAllData(CONFIG, getAdminToken());
      localStorage.removeItem(CONFIG.storage.draftKey);
      localStorage.removeItem(CONFIG.storage.statsKey);
      resetFormState();
      state.stats = {
        responsesCount: 0,
        optionCounts: {}
      };

      if (ui.name) {
        ui.name.value = "";
      }

      if (ui.group) {
        ui.group.value = "";
      }

      if (ui.dynamic) {
        renderAll();
        refreshUI(false);
      } else {
        renderBuilder();
      }
      saveDraft();
      ui.submitStatus.textContent = "Все пользовательские ответы удалены локально и из базы данных.";
    } catch (error) {
      console.error(error);
      ui.submitStatus.textContent = "Не удалось полностью удалить пользовательские данные. Проверьте авторизацию администратора.";
    }

    return;
  }

  state.isSubmitting = true;
  ui.submitStatus.textContent = "Отправляем ответ...";
  updateSubmitUi();

  try {
    const payload = buildSubmissionPayload();
    const result = await FormApi.submit(CONFIG, payload);

    state.meta.hasSubmitted = true;
    state.meta.lastSubmittedAt = payload.updatedAt;
    saveDraft();

    await loadStats();
    refreshUI(true);

    ui.submitStatus.textContent = result.source === "remote"
      ? "Форма сохранена в базу данных. Вы можете изменить ответ и отправить его повторно."
      : "Форма сохранена только локально.";
  } catch (error) {
    console.error(error);
    ui.submitStatus.textContent = "Не удалось отправить форму. Данные черновика сохранены, можно попробовать ещё раз.";
  } finally {
    state.isSubmitting = false;
    updateSubmitUi();
  }
}

function bindProfileInputs() {
  ui.name.value = state.profile.name;
  ui.group.value = state.profile.group;

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
}

function applySchemaChanges({ resetValues = false, rerenderBuilder = false } = {}) {
  if (resetValues || rerenderBuilder) {
    state.schema = normalizeSchema(state.schema);
  }

  if (resetValues) {
    rebuildValuesForCurrentSchema();
  } else {
    initializeDefaults(getFields());
  }

  saveSchema();
  saveUiConfig();
  queueSchemaSync();
  if (!isBuilderPage()) {
    renderAll();
    refreshUI(false);
  } else {
    applyUiConfig();
  }
  saveDraft();

  if (rerenderBuilder) {
    renderBuilder();
  }
}

function createFieldTemplate() {
  return {
    id: generateId("field"),
    label: "Новое поле",
    hint: "",
    type: "single",
    required: false,
    dependsOn: [],
    options: [
      createOptionTemplate()
    ]
  };
}

function insertFieldAt(index) {
  const safeIndex = Math.max(0, Math.min(index, state.schema.length));
  state.schema.splice(safeIndex, 0, createFieldTemplate());
  applySchemaChanges({ resetValues: true, rerenderBuilder: true });
}

function removeFieldAt(index) {
  if (index < 0 || index >= state.schema.length) {
    return;
  }
  state.schema.splice(index, 1);
  applySchemaChanges({ resetValues: true, rerenderBuilder: true });
}

function createOptionTemplate() {
  return {
    value: generateId("option"),
    label: "Новый вариант",
    description: "",
    image: "",
    price: 0,
    priceType: "fixed",
    promoText: "",
    defaultSelected: false,
    locked: false
  };
}

function moveItem(items, fromIndex, toIndex) {
  if (!Array.isArray(items) || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return false;
  }

  const [item] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, item);
  return true;
}

function createBuilderField(labelText, inputNode) {
  const wrapper = document.createElement("div");
  wrapper.className = "builder-group";

  const label = document.createElement("label");
  label.textContent = text(labelText);

  wrapper.append(label, inputNode);
  return wrapper;
}

function createBuilderPanelSection(titleText, noteText, ...contentNodes) {
  const section = document.createElement("section");
  section.className = "builder-panel-section";

  const header = document.createElement("div");
  header.className = "builder-panel-section-header";

  const title = document.createElement("h5");
  title.className = "builder-panel-section-title";
  title.textContent = text(titleText);
  header.appendChild(title);

  if (noteText) {
    const note = document.createElement("p");
    note.className = "builder-panel-section-note";
    note.textContent = text(noteText);
    header.appendChild(note);
  }

  section.appendChild(header);
  contentNodes.filter(Boolean).forEach(node => section.appendChild(node));
  return section;
}

function createTextInput(value, handler, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.addEventListener("input", event => {
    handler(event.target.value);
  });
  return input;
}

function createCommittedTextInput(value, onInput, onCommit, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";

  input.addEventListener("input", event => {
    onInput(event.target.value);
  });

  const commit = event => {
    onCommit(event.target.value);
  };

  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
  return input;
}

function createTextarea(value, handler) {
  const textarea = document.createElement("textarea");
  textarea.rows = 2;
  textarea.value = value ?? "";
  textarea.addEventListener("input", event => {
    handler(event.target.value);
  });
  return textarea;
}

function createColorInput(value, handler) {
  const wrapper = document.createElement("div");
  wrapper.className = "builder-color-input";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = value || "#0f766e";

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = value || "#0f766e";
  textInput.placeholder = "#0f766e";

  colorInput.addEventListener("input", event => {
    textInput.value = event.target.value;
    handler(event.target.value);
  });

  textInput.addEventListener("input", event => {
    const nextValue = event.target.value.trim();
    handler(nextValue);
    if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
      colorInput.value = nextValue;
    }
  });

  wrapper.append(colorInput, textInput);
  return wrapper;
}

function getThemeColorValue(config, key, cssVarName, fallback) {
  const configured = cleanString(config?.[key] || "");
  if (configured) {
    return configured;
  }

  const cssValue = window.getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  if (cssValue) {
    return cssValue;
  }

  return fallback;
}

function createSelectInput(value, options, handler) {
  const select = document.createElement("select");
  options.forEach(option => {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = text(option.label);
    if (value === option.value) {
      node.selected = true;
    }
    select.appendChild(node);
  });
  select.addEventListener("change", event => {
    handler(event.target.value);
  });
  return select;
}

function createCheckbox(labelText, checked, handler) {
  const wrapper = document.createElement("label");
  wrapper.className = "builder-switch";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", event => {
    handler(event.target.checked);
  });

  const text = document.createElement("span");
  text.textContent = labelText;

  wrapper.append(input, text);
  return wrapper;
}

function setupScrollDecorations() {
  const sections = Array.from(document.querySelectorAll(".form-section"));
  if (!sections.length || typeof IntersectionObserver !== "function") {
    sections.forEach(section => section.classList.add("form-section-visible"));
    return;
  }

  if (state.sectionObserver) {
    state.sectionObserver.disconnect();
  }

  state.sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("form-section-visible", entry.isIntersecting);
    });
  }, {
    threshold: 0.35
  });

  sections.forEach(section => state.sectionObserver.observe(section));
}

function updateScrollTopVisibility() {
  if (!ui.scrollTopBtn) {
    return;
  }

  ui.scrollTopBtn.classList.toggle("hidden-text", window.scrollY < 420);
}

function getFieldDisplayName(field) {
  return text(field.label || "Без названия");
}

function getOperatorChoices() {
  return [
    { value: "equals", label: "равно" },
    { value: "notEquals", label: "не равно" },
    { value: "includes", label: "содержит" },
    { value: "notIncludes", label: "не содержит" }
  ];
}

function getDependencyTargets(currentFieldId) {
  return getFields()
    .filter(field => field.id !== currentFieldId)
    .map(field => ({
      value: field.id,
      label: `${getFieldDisplayName(field)} (${field.id})`
    }));
}

function createDragHandle(title) {
  const handle = document.createElement("div");
  handle.className = "builder-drag-handle";
  handle.title = title;
  handle.setAttribute("aria-label", title);
  handle.setAttribute("role", "button");
  handle.tabIndex = 0;
  handle.innerHTML = "<span></span><span></span><span></span><span></span><span></span><span></span>";
  return handle;
}

function attachSortable(card, handle, items, index, type, parentFieldId = "") {
  card.draggable = true;

  handle.addEventListener("pointerdown", () => {
    state.builder.dragArmed = { type, index, parentFieldId };
  });

  card.addEventListener("dragstart", event => {
    const armed = state.builder.dragArmed;
    if (!armed || armed.type !== type || armed.index !== index || armed.parentFieldId !== parentFieldId) {
      event.preventDefault();
      return;
    }

    state.builder.drag = { type, index, parentFieldId };
    card.classList.add("builder-item-dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("builder-item-dragging");
    state.builder.drag = null;
    state.builder.dragArmed = null;
  });

  card.addEventListener("dragover", event => {
    if (!state.builder.drag || state.builder.drag.type !== type || state.builder.drag.parentFieldId !== parentFieldId) {
      return;
    }
    event.preventDefault();
    card.classList.add("builder-item-drop-target");
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("builder-item-drop-target");
  });

  card.addEventListener("drop", event => {
    card.classList.remove("builder-item-drop-target");
    if (!state.builder.drag || state.builder.drag.type !== type || state.builder.drag.parentFieldId !== parentFieldId) {
      return;
    }
    event.preventDefault();
    if (moveItem(items, state.builder.drag.index, index)) {
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }
  });
}

function createBuilderHeader(titleText, metaText, dragTitle) {
  const header = document.createElement("div");
  header.className = "builder-item-header";

  const info = document.createElement("div");
  info.className = "builder-heading";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = text(titleText);

  const meta = document.createElement("div");
  meta.className = "builder-meta";
  meta.textContent = text(metaText);

  info.append(title, meta);

  const handle = createDragHandle(dragTitle);
  const actions = document.createElement("div");
  actions.className = "builder-header-actions";
  actions.appendChild(handle);

  header.append(info, actions);
  return { header, handle, info, actions, title, meta };
}

function renderDependencyValueInput(currentField, rule) {
  const targetField = getFields().find(field => field.id === rule.fieldId);
  if (!targetField) {
    return createTextInput(rule.value || "", value => {
      rule.value = value;
      applySchemaChanges();
    });
  }

  if (targetField.type === "text") {
    return createTextInput(rule.value || "", value => {
      rule.value = value;
      applySchemaChanges();
    });
  }

  return createSelectInput(rule.value || "", (targetField.options || []).map(option => ({
    value: option.value,
    label: option.label
  })), value => {
    rule.value = value;
    applySchemaChanges();
  });
}

function getDependencyRuleCount(field) {
  const visibility = normalizeDependencies(field.dependsOn);
  return visibility.groups.reduce((sum, group) => sum + (group.rules?.length || 0), 0);
}

function isDependenciesCollapsed(fieldId) {
  if (!Object.prototype.hasOwnProperty.call(state.builder.collapsedDependencies, fieldId)) {
    return true;
  }

  return Boolean(state.builder.collapsedDependencies[fieldId]);
}

function toggleDependenciesSection(fieldId) {
  state.builder.collapsedDependencies[fieldId] = !isDependenciesCollapsed(fieldId);
  renderBuilder();
}

function createDependencyRule(field, targetField) {
  return {
    id: generateId("dep"),
    fieldId: targetField.id,
    operator: targetField.type === "multi" ? "includes" : "equals",
    value: targetField.type === "text" ? "" : (targetField.options?.[0]?.value || "")
  };
}

function createDependencyGroup(field) {
  const firstTarget = getFields().find(item => item.id !== field.id);
  return normalizeDependencyGroup({
    joiner: "and",
    rules: firstTarget ? [createDependencyRule(field, firstTarget)] : []
  });
}

function renderDependencyGroupEditor(field, visibility, group, groupIndex) {
  const groupCard = document.createElement("div");
  groupCard.className = "builder-item builder-item-compact dependency-group-card";

  const row = document.createElement("div");
  row.className = "builder-row builder-row-4";
  row.append(
    createBuilderField("Условия внутри блока", createSelectInput(group.joiner || "and", [
      { value: "and", label: "И" },
      { value: "or", label: "ИЛИ" }
    ], value => {
      group.joiner = value;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }))
  );

  const removeGroupBtn = document.createElement("button");
  removeGroupBtn.type = "button";
  removeGroupBtn.className = "button-secondary";
  removeGroupBtn.textContent = "Удалить блок";
  removeGroupBtn.addEventListener("click", () => {
    visibility.groups.splice(groupIndex, 1);
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });
  row.append(removeGroupBtn);
  groupCard.appendChild(row);

  const rulesList = document.createElement("div");
  rulesList.className = "builder-list";

  group.rules.forEach((rule, ruleIndex) => {
    const ruleCard = document.createElement("div");
    ruleCard.className = "builder-item builder-item-compact dependency-rule-card";

    if (ruleIndex > 0) {
      const joinerBadge = document.createElement("div");
      joinerBadge.className = "dependency-joiner";
      joinerBadge.textContent = group.joiner === "or" ? "ИЛИ" : "И";
      ruleCard.appendChild(joinerBadge);
    }

    const ruleRow = document.createElement("div");
    ruleRow.className = "builder-row builder-row-4";
    ruleRow.append(
      createBuilderField("Вопрос", createSelectInput(rule.fieldId || "", getDependencyTargets(field.id), value => {
        rule.fieldId = value;
        const target = getFields().find(item => item.id === value);
        rule.operator = target?.type === "multi" ? "includes" : "equals";
        rule.value = target?.type === "text" ? "" : (target?.options?.[0]?.value || "");
        applySchemaChanges({ resetValues: true, rerenderBuilder: true });
      })),
      createBuilderField("Условие", createSelectInput(rule.operator || "equals", getOperatorChoices(), value => {
        rule.operator = value;
        applySchemaChanges({ resetValues: true });
      })),
      createBuilderField("Значение", renderDependencyValueInput(field, rule))
    );

    const removeRuleBtn = document.createElement("button");
    removeRuleBtn.type = "button";
    removeRuleBtn.className = "button-secondary";
    removeRuleBtn.textContent = "Удалить";
    removeRuleBtn.addEventListener("click", () => {
      group.rules.splice(ruleIndex, 1);
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    });
    ruleRow.append(removeRuleBtn);
    ruleCard.appendChild(ruleRow);
    rulesList.appendChild(ruleCard);
  });

  groupCard.appendChild(rulesList);

  const addRuleBtn = document.createElement("button");
  addRuleBtn.type = "button";
  addRuleBtn.textContent = "Добавить условие";
  addRuleBtn.disabled = getDependencyTargets(field.id).length === 0;
  addRuleBtn.addEventListener("click", () => {
    const firstTarget = getFields().find(item => item.id !== field.id);
    if (!firstTarget) {
      return;
    }

    group.rules.push(createDependencyRule(field, firstTarget));
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });
  groupCard.appendChild(addRuleBtn);

  return groupCard;
}

function renderDependenciesSection(field) {
  const section = document.createElement("div");
  section.className = "builder-dependencies";

  const title = document.createElement("div");
  title.className = "builder-section-title";
  title.textContent = "Условия показа вопроса";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "Настройте, когда этот вопрос должен показываться. Можно ссылаться на любой другой вопрос и комбинировать условия через И / ИЛИ.";
  section.appendChild(note);

  field.dependsOn = normalizeDependencies(field.dependsOn);
  const visibility = field.dependsOn;

  const topRow = document.createElement("div");
  topRow.className = "builder-row builder-row-4";
  topRow.append(
    createBuilderField("Связь между блоками", createSelectInput(visibility.joiner || "and", [
      { value: "and", label: "И" },
      { value: "or", label: "ИЛИ" }
    ], value => {
      visibility.joiner = value;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }))
  );

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "button-secondary";
  clearBtn.textContent = "Удалить все";
  clearBtn.disabled = !visibility.groups.length;
  clearBtn.addEventListener("click", () => {
    field.dependsOn = normalizeDependencies();
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });
  topRow.append(clearBtn);
  section.appendChild(topRow);

  const groupsList = document.createElement("div");
  groupsList.className = "builder-list";
  visibility.groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const groupJoiner = document.createElement("div");
      groupJoiner.className = "dependency-joiner dependency-joiner-block";
      groupJoiner.textContent = visibility.joiner === "or" ? "ИЛИ" : "И";
      groupsList.appendChild(groupJoiner);
    }

    groupsList.appendChild(renderDependencyGroupEditor(field, visibility, group, groupIndex));
  });
  section.appendChild(groupsList);

  const addGroupBtn = document.createElement("button");
  addGroupBtn.type = "button";
  addGroupBtn.textContent = "Добавить блок условий";
  addGroupBtn.disabled = getDependencyTargets(field.id).length === 0;
  addGroupBtn.addEventListener("click", () => {
    visibility.groups.push(createDependencyGroup(field));
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });
  section.appendChild(addGroupBtn);

  return section;
}

function renderOptionEditor(option, options, optionIndex, field) {
  const card = document.createElement("div");
  card.className = "builder-item builder-child builder-item-compact";

  const { header, handle, title, meta } = createBuilderHeader(
    option.label || `Вариант ${optionIndex + 1}`,
    `Значение: ${option.value || "без значения"}`,
    "Перетащить вариант"
  );
  card.appendChild(header);
  attachSortable(card, handle, options, optionIndex, "option", field.id);

  const row1 = document.createElement("div");
  row1.className = "builder-row builder-row-3";
  row1.append(
    createBuilderField("Значение", createCommittedTextInput(option.value || "", value => {
      option.value = value;
      meta.textContent = `Значение: ${option.value || "без значения"}`;
    }, value => {
      option.value = value;
      meta.textContent = `Значение: ${option.value || "без значения"}`;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    })),
    createBuilderField("Название", createTextInput(option.label || "", value => {
      option.label = value;
      title.textContent = text(option.label || `Вариант ${optionIndex + 1}`);
      applySchemaChanges();
    })),
    createBuilderField("Описание", createTextInput(option.description || "", value => {
      option.description = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-4";
  row2.append(
    createBuilderField("Изображение / URL", createTextInput(option.image || "", value => {
      option.image = value;
      applySchemaChanges();
    })),
    createBuilderField("Цена", createTextInput(option.price || 0, value => {
      option.price = Number(value) || 0;
      applySchemaChanges();
    }, "number")),
    createBuilderField("Тип цены", createSelectInput(option.priceType || "fixed", [
      { value: "fixed", label: "Фиксированная" },
      { value: "perPerson", label: "За человека" }
    ], value => {
      option.priceType = value;
      applySchemaChanges();
    })),
    createBuilderField("Промо-текст", createTextInput(option.promoText || "", value => {
      option.promoText = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "builder-row";
  row3.append(
    createBuilderField("Подробнее", createTextarea(option.details || "", value => {
      option.details = value;
      applySchemaChanges();
    })),
    createBuilderField("Ссылка на карту", createTextInput(option.mapUrl || "", value => {
      option.mapUrl = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row3);

  const switches = document.createElement("div");
  switches.className = "builder-switches";
  switches.append(
    createCheckbox("Выбран по умолчанию", option.defaultSelected, checked => {
      option.defaultSelected = checked;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }),
    createCheckbox("Нельзя отключить", option.locked, checked => {
      option.locked = checked;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    })
  );
  card.appendChild(switches);

  const actions = document.createElement("div");
  actions.className = "builder-inline-actions";

  const removeOptionBtn = document.createElement("button");
  removeOptionBtn.type = "button";
  removeOptionBtn.className = "button-secondary";
  removeOptionBtn.textContent = "Удалить вариант";
  removeOptionBtn.addEventListener("click", () => {
    options.splice(optionIndex, 1);
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });

  actions.append(removeOptionBtn);
  card.appendChild(actions);

  return card;
}

function renderFieldEditor(field, siblings, index) {
  const card = document.createElement("section");
  card.className = "builder-item";
  card.id = `builder-field-${field.id}`;

  const insertTopBtn = document.createElement("button");
  insertTopBtn.type = "button";
  insertTopBtn.className = "builder-insert-btn builder-insert-top";
  insertTopBtn.textContent = "+";
  insertTopBtn.title = "Добавить вопрос сверху";
  insertTopBtn.addEventListener("click", () => insertFieldAt(index));
  card.appendChild(insertTopBtn);

  const insertBottomBtn = document.createElement("button");
  insertBottomBtn.type = "button";
  insertBottomBtn.className = "builder-insert-btn builder-insert-bottom";
  insertBottomBtn.textContent = "+";
  insertBottomBtn.title = "Добавить вопрос снизу";
  insertBottomBtn.addEventListener("click", () => insertFieldAt(index + 1));
  card.appendChild(insertBottomBtn);

  const { header, handle, actions: headerActions, title, meta } = createBuilderHeader(
    field.label || "Новое поле",
    `Поле ${index + 1} • ID: ${field.id || "без id"}`,
    "Перетащить вопрос"
  );
  const dependenciesBtn = document.createElement("button");
  dependenciesBtn.type = "button";
  dependenciesBtn.className = "button-secondary builder-dependency-toggle";
  dependenciesBtn.textContent = isDependenciesCollapsed(field.id)
    ? `Показать зависимости (${getDependencyRuleCount(field)})`
    : `Скрыть зависимости (${getDependencyRuleCount(field)})`;
  dependenciesBtn.addEventListener("click", () => toggleDependenciesSection(field.id));
  headerActions.insertBefore(dependenciesBtn, handle);

  card.appendChild(header);
  attachSortable(card, handle, siblings, index, "field");

  const row1 = document.createElement("div");
  row1.className = "builder-row";
  row1.append(
    createBuilderField("ID поля", createCommittedTextInput(field.id || "", value => {
      field.id = value;
      meta.textContent = `Поле ${index + 1} • ID: ${field.id || "без id"}`;
    }, value => {
      field.id = value || generateId("field");
      meta.textContent = `Поле ${index + 1} • ID: ${field.id || "без id"}`;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    })),
    createBuilderField("Название вопроса", createTextInput(field.label || "", value => {
      field.label = value;
      title.textContent = text(field.label || "Новое поле");
      renderBuilderOutline();
      applySchemaChanges();
    }))
  );
  card.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-3";
  row2.append(
    createBuilderField("Тип", createSelectInput(field.type || "single", [
      { value: "text", label: "Текст" },
      { value: "single", label: "Один вариант" },
      { value: "multi", label: "Несколько вариантов" }
    ], value => {
      field.type = value;
      if (value === "text") {
        delete field.options;
        delete field.appearance;
      } else if (!Array.isArray(field.options) || !field.options.length) {
        field.options = [createOptionTemplate()];
      }
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    })),
    createBuilderField("Вид", createSelectInput(field.appearance || "", [
      { value: "", label: "Стандартный" },
      { value: "media-grid", label: "Карточки с изображением" },
      { value: "media-carousel", label: "Карусель с изображениями" }
    ], value => {
      field.appearance = value || undefined;
      applySchemaChanges({ rerenderBuilder: true });
    })),
    createBuilderField("Подсказка", createTextInput(field.hint || "", value => {
      field.hint = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row2);

  const promoRow = document.createElement("div");
  promoRow.className = "builder-row";
  promoRow.append(
    createBuilderField("Плашка над вопросом", createTextInput(field.promoTag || "", value => {
      field.promoTag = value;
      applySchemaChanges();
    })),
    createBuilderField("Промо-заголовок блока", createTextarea(field.promoTitle || "", value => {
      field.promoTitle = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(promoRow);

  const promoSubRow = document.createElement("div");
  promoSubRow.className = "builder-row";
  promoSubRow.append(
    createBuilderField("Промо-подзаголовок блока", createTextarea(field.promoSubtitle || "", value => {
      field.promoSubtitle = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(promoSubRow);

  const switches = document.createElement("div");
  switches.className = "builder-switches";
  switches.append(
    createCheckbox("Обязательное поле", field.required, checked => {
      field.required = checked;
      applySchemaChanges();
    })
  );
  card.appendChild(switches);

  const actions = document.createElement("div");
  actions.className = "builder-inline-actions";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "button-secondary";
  removeBtn.textContent = "Удалить вопрос";
  removeBtn.addEventListener("click", () => {
    removeFieldAt(index);
  });

  actions.append(removeBtn);
  card.appendChild(actions);
  if (!isDependenciesCollapsed(field.id)) {
    card.appendChild(renderDependenciesSection(field));
  }

  if (field.type !== "text") {
    const optionsTitle = document.createElement("div");
    optionsTitle.className = "builder-section-title";
    optionsTitle.textContent = "Варианты ответа";
    card.appendChild(optionsTitle);

    const optionList = document.createElement("div");
    optionList.className = "builder-list";
    (field.options || []).forEach((option, optionIndex) => {
      optionList.appendChild(renderOptionEditor(option, field.options, optionIndex, field));
    });
    card.appendChild(optionList);

    const addOptionBtn = document.createElement("button");
    addOptionBtn.type = "button";
    addOptionBtn.textContent = "Добавить вариант";
    addOptionBtn.addEventListener("click", () => {
      field.options = field.options || [];
      field.options.push(createOptionTemplate());
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    });
    card.appendChild(addOptionBtn);
  }

  return card;
}

function renderUiConfigEditor() {
  const card = document.createElement("section");
  card.className = "builder-item builder-editor-card builder-settings-card";
  card.id = "builder-section-ui";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "Верх формы и пользовательские поля";
  card.appendChild(title);

  const intro = document.createElement("p");
  intro.className = "field-hint builder-editor-note";
  intro.textContent = "Редактируйте тексты по блокам: hero, подписи интерфейса и пользовательские поля.";
  card.appendChild(intro);

  const sections = document.createElement("div");
  sections.className = "builder-panel-sections";

  const row1 = document.createElement("div");
  row1.className = "builder-row";
  row1.append(
    createBuilderField("Заголовок страницы", createTextInput(state.uiConfig.pageTitle || "", value => {
      state.uiConfig.pageTitle = value;
      applySchemaChanges();
    })),
    createBuilderField("Подзаголовок блока пользователя", createTextInput(state.uiConfig.userSectionTitle || "", value => {
      state.uiConfig.userSectionTitle = value;
      applySchemaChanges();
    }))
  );

  const heroRow = document.createElement("div");
  heroRow.className = "builder-row";
  heroRow.append(
    createBuilderField("Hero: плашка", createTextInput(state.uiConfig.heroKicker || "", value => {
      state.uiConfig.heroKicker = value;
      applySchemaChanges();
    })),
    createBuilderField("Hero: бейдж", createTextInput(state.uiConfig.heroBadge || "", value => {
      state.uiConfig.heroBadge = value;
      applySchemaChanges();
    }))
  );

  const heroTextRow = document.createElement("div");
  heroTextRow.className = "builder-row";
  heroTextRow.append(
    createBuilderField("Hero: главный заголовок", createTextarea(state.uiConfig.heroHeadline || "", value => {
      state.uiConfig.heroHeadline = value;
      applySchemaChanges();
    })),
    createBuilderField("Hero: подпись справа", createTextarea(state.uiConfig.heroNote || "", value => {
      state.uiConfig.heroNote = value;
      applySchemaChanges();
    }))
  );

  const row2 = document.createElement("div");
  row2.className = "builder-row";
  row2.append(
    createBuilderField("Hero: подзаголовок", createTextarea(state.uiConfig.heroSubline || "", value => {
      state.uiConfig.heroSubline = value;
      applySchemaChanges();
    })),
    createBuilderField("Подсказка к данным пользователя", createTextarea(state.uiConfig.userSectionHint || "", value => {
      state.uiConfig.userSectionHint = value;
      applySchemaChanges();
    }))
  );

  const row2b = document.createElement("div");
  row2b.className = "builder-row builder-row-single";
  row2b.append(
    createBuilderField("Текст под ценой", createTextarea(state.uiConfig.draftStatusText || "", value => {
      state.uiConfig.draftStatusText = value;
      applySchemaChanges();
    }))
  );

  const row3 = document.createElement("div");
  row3.className = "builder-row builder-row-4";
  row3.append(
    createBuilderField("Плейсхолдер ФИО", createTextInput(state.uiConfig.namePlaceholder || "", value => {
      state.uiConfig.namePlaceholder = value;
      applySchemaChanges();
    })),
    createBuilderField("Плейсхолдер группы", createTextInput(state.uiConfig.groupPlaceholder || "", value => {
      state.uiConfig.groupPlaceholder = value;
      applySchemaChanges();
    })),
    createBuilderField("Подпись Билет", createTextInput(state.uiConfig.ticketLabel || "", value => {
      state.uiConfig.ticketLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("Количество участников", createTextInput(state.uiConfig.participantsCount || getParticipantCount(), value => {
      state.uiConfig.participantsCount = Math.max(1, Number(value) || CONFIG.participants);
      if (ui.participantsCount) {
        ui.participantsCount.textContent = getParticipantCount();
      }
      applySchemaChanges();
    }, "number"))
  );

  const row4 = document.createElement("div");
  row4.className = "builder-row builder-row-3";
  row4.append(
    createBuilderField("Счётчик участников", createTextInput(state.uiConfig.participantsStatLabel || "", value => {
      state.uiConfig.participantsStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("Счётчик заполнений", createTextInput(state.uiConfig.responsesStatLabel || "", value => {
      state.uiConfig.responsesStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("Кнопка итогов", createTextInput(state.uiConfig.detailsButtonLabel || "", value => {
      state.uiConfig.detailsButtonLabel = value;
      applySchemaChanges();
    }))
  );

  const row5 = document.createElement("div");
  row5.className = "builder-row";
  row5.append(
    createBuilderField("Кнопка отправки", createTextInput(state.uiConfig.saveButtonLabel || "", value => {
      state.uiConfig.saveButtonLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("Кнопка повторной отправки", createTextInput(state.uiConfig.resubmitButtonLabel || "", value => {
      state.uiConfig.resubmitButtonLabel = value;
      applySchemaChanges();
    }))
  );

  sections.append(
    createBuilderPanelSection("Hero и верх формы", "Крупные тексты и первый экран формы.", row1, heroRow, heroTextRow, row2),
    createBuilderPanelSection("Подписи и действия", "Кнопки, подписи счетчиков и текст под итогом.", row2b, row4, row5),
    createBuilderPanelSection("Поля пользователя", "Плейсхолдеры и число участников.", row3)
  );
  card.appendChild(sections);

  return card;
}

function renderThemeEditor() {
  const cfg = {
    ...getDefaultUiConfig(),
    ...(state.uiConfig || {})
  };
  const card = document.createElement("section");
  card.className = "builder-item builder-editor-card builder-theme-card";
  card.id = "builder-section-theme";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "Тема и кнопки";
  card.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint builder-editor-note";
  note.textContent = "Палитра разбита по смысловым блокам: фон страницы, hero, карточки, кнопки и таблица итогов.";
  card.appendChild(note);

  const sections = document.createElement("div");
  sections.className = "builder-panel-sections";

  const row1 = document.createElement("div");
  row1.className = "builder-row builder-row-3";
  row1.append(
    createBuilderField("Фон: свечение 1", createColorInput(getThemeColorValue(cfg, "pageGlowPrimary", "--page-glow-primary", "#ddff00"), value => {
      state.uiConfig.pageGlowPrimary = value;
      applySchemaChanges();
    })),
    createBuilderField("Фон: свечение 2", createColorInput(getThemeColorValue(cfg, "pageGlowSecondary", "--page-glow-secondary", "#ff3a3a"), value => {
      state.uiConfig.pageGlowSecondary = value;
      applySchemaChanges();
    })),
    createBuilderField("Фон страницы: старт", createColorInput(getThemeColorValue(cfg, "pageBgStart", "--page-bg-start", "#0f1013"), value => {
      state.uiConfig.pageBgStart = value;
      applySchemaChanges();
    }))
  );
  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-3";
  row2.append(
    createBuilderField("Фон страницы: середина", createColorInput(getThemeColorValue(cfg, "pageBgMid", "--page-bg-mid", "#262b34"), value => {
      state.uiConfig.pageBgMid = value;
      applySchemaChanges();
    })),
    createBuilderField("Фон страницы: конец", createColorInput(getThemeColorValue(cfg, "pageBgEnd", "--page-bg-end", "#121519"), value => {
      state.uiConfig.pageBgEnd = value;
      applySchemaChanges();
    })),
    createBuilderField("Hero: акцент", createColorInput(getThemeColorValue(cfg, "heroAccent", "--hero-accent", "#d9ff3f"), value => {
      state.uiConfig.heroAccent = value;
      applySchemaChanges();
    }))
  );
  const row3 = document.createElement("div");
  row3.className = "builder-row builder-row-3";
  row3.append(
    createBuilderField("Hero: фон старт", createColorInput(getThemeColorValue(cfg, "heroSurfaceStart", "--hero-surface-start", "#0b0c10"), value => {
      state.uiConfig.heroSurfaceStart = value;
      applySchemaChanges();
    })),
    createBuilderField("Hero: фон конец", createColorInput(getThemeColorValue(cfg, "heroSurfaceEnd", "--hero-surface-end", "#111217"), value => {
      state.uiConfig.heroSurfaceEnd = value;
      applySchemaChanges();
    })),
    createBuilderField("Карточки: фон старт", createColorInput(getThemeColorValue(cfg, "surfaceStart", "--surface-start", "#121318"), value => {
      state.uiConfig.surfaceStart = value;
      applySchemaChanges();
    }))
  );
  const row4 = document.createElement("div");
  row4.className = "builder-row builder-row-3";
  row4.append(
    createBuilderField("Карточки: фон конец", createColorInput(getThemeColorValue(cfg, "surfaceEnd", "--surface-end", "#1a1c22"), value => {
      state.uiConfig.surfaceEnd = value;
      applySchemaChanges();
    })),
    createBuilderField("Карточки: текст", createColorInput(getThemeColorValue(cfg, "surfaceText", "--surface-text", "#f6f8f1"), value => {
      state.uiConfig.surfaceText = value;
      applySchemaChanges();
    })),
    createBuilderField("Карточки: обводка", createColorInput(getThemeColorValue(cfg, "surfaceBorder", "--surface-border", "#444444"), value => {
      state.uiConfig.surfaceBorder = value;
      applySchemaChanges();
    }))
  );
  const row5 = document.createElement("div");
  row5.className = "builder-row builder-row-3";
  row5.append(
    createBuilderField("Основная кнопка: старт", createColorInput(getThemeColorValue(cfg, "buttonPrimaryStart", "--button-primary-start", "#0f766e"), value => {
      state.uiConfig.buttonPrimaryStart = value;
      applySchemaChanges();
    })),
    createBuilderField("Основная кнопка: конец", createColorInput(getThemeColorValue(cfg, "buttonPrimaryEnd", "--button-primary-end", "#059669"), value => {
      state.uiConfig.buttonPrimaryEnd = value;
      applySchemaChanges();
    })),
    createBuilderField("Кнопка итогов: старт", createColorInput(getThemeColorValue(cfg, "buttonDetailsStart", "--button-details-start", "#475569"), value => {
      state.uiConfig.buttonDetailsStart = value;
      applySchemaChanges();
    }))
  );
  const row6 = document.createElement("div");
  row6.className = "builder-row builder-row-3";
  row6.append(
    createBuilderField("Кнопка итогов: конец", createColorInput(getThemeColorValue(cfg, "buttonDetailsEnd", "--button-details-end", "#334155"), value => {
      state.uiConfig.buttonDetailsEnd = value;
      applySchemaChanges();
    })),
    createBuilderField("Вторичная кнопка: фон", createColorInput(getThemeColorValue(cfg, "buttonSecondaryBg", "--button-secondary-bg", "#e5e7eb"), value => {
      state.uiConfig.buttonSecondaryBg = value;
      applySchemaChanges();
    })),
    createBuilderField("Вторичная кнопка: текст", createColorInput(getThemeColorValue(cfg, "buttonSecondaryText", "--button-secondary-text", "#1f2937"), value => {
      state.uiConfig.buttonSecondaryText = value;
      applySchemaChanges();
    }))
  );
  const row7 = document.createElement("div");
  row7.className = "builder-row";
  row7.append(
    createBuilderField("Таблица итогов: верх", createColorInput(getThemeColorValue(cfg, "checkTableStart", "--check-table-start", "#161920"), value => {
      state.uiConfig.checkTableStart = value;
      applySchemaChanges();
    })),
    createBuilderField("Таблица итогов: низ", createColorInput(getThemeColorValue(cfg, "checkTableEnd", "--check-table-end", "#0f1218"), value => {
      state.uiConfig.checkTableEnd = value;
      applySchemaChanges();
    }))
  );
  sections.append(
    createBuilderPanelSection("Фон страницы", "Глобальный фон и световые акценты.", row1, row2),
    createBuilderPanelSection("Hero и карточки", "Акцентный цвет, hero и базовые поверхности формы.", row3, row4),
    createBuilderPanelSection("Кнопки и таблица итогов", "CTA-кнопки, вторичные действия и итоговая таблица.", row5, row6, row7)
  );
  card.appendChild(sections);

  const saveThemeBtn = document.createElement("button");
  saveThemeBtn.type = "button";
  saveThemeBtn.className = "builder-primary-action";
  saveThemeBtn.textContent = "Сохранить тему";
  saveThemeBtn.addEventListener("click", saveSchemaNow);
  card.appendChild(saveThemeBtn);

  return card;
}

function renderResponsesPanel() {
  const section = document.createElement("section");
  section.className = "builder-item";
  section.id = "builder-section-responses";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "Ответы";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "Последние ответы из базы данных. Показываем до 100 строк.";
  section.appendChild(note);

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "button-secondary";
  refreshBtn.textContent = state.builder.responses.loading ? "Загружаем..." : "Обновить ответы";
  refreshBtn.disabled = state.builder.responses.loading;
  refreshBtn.addEventListener("click", async () => {
    await loadResponsesPreview();
    renderBuilder();
  });
  const actions = document.createElement("div");
  actions.className = "builder-panel-actions";
  actions.appendChild(refreshBtn);

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "button-secondary";
  exportBtn.textContent = "Скачать таблицу";
  exportBtn.disabled = state.builder.responses.loading || !state.builder.responses.rows.length;
  exportBtn.addEventListener("click", exportResponsesToExcel);
  actions.appendChild(exportBtn);

  section.appendChild(actions);

  if (!state.builder.responses.headers.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = state.builder.responses.loading
      ? "Загружаем ответы..."
      : "Ответов пока нет или они ещё не загружены.";
    section.appendChild(empty);
    return section;
  }

  const wrap = document.createElement("div");
  wrap.className = "builder-table-wrap";

  const table = document.createElement("table");
  table.className = "builder-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  state.builder.responses.headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = text(String(header));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  state.builder.responses.rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = text(String(cell ?? ""));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  section.appendChild(wrap);

  return section;
}

function renderBuilderOutline() {
  if (!ui.builderOutline) {
    return;
  }

  ui.builderOutline.innerHTML = "";

  if (state.builder.activeTab !== "constructor") {
    const info = document.createElement("div");
    info.className = "builder-outline-note";
    info.textContent = state.builder.activeTab === "theme"
      ? "Цвета и визуальные настройки"
      : state.builder.activeTab === "settings"
        ? "Тексты и параметры формы"
        : "Таблица ответов";
    ui.builderOutline.appendChild(info);
    return;
  }

  const topItem = document.createElement("div");
  topItem.className = "builder-outline-item";

  const topLink = document.createElement("button");
  topLink.type = "button";
  topLink.className = "builder-outline-link";
  topLink.textContent = "Верх формы";
  topLink.addEventListener("click", () => {
    document.getElementById("builder-section-ui")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  topItem.appendChild(topLink);
  ui.builderOutline.appendChild(topItem);

  getFields().forEach((field, index) => {
    const item = document.createElement("div");
    item.className = "builder-outline-item";

    const handle = createDragHandle("Перетащить вопрос");
    item.appendChild(handle);

    const link = document.createElement("button");
    link.type = "button";
    link.className = "builder-outline-link";
    link.textContent = getFieldDisplayName(field);
    link.addEventListener("click", () => {
      document.getElementById(`builder-field-${field.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    item.appendChild(link);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "builder-outline-remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Удалить вопрос";
    removeBtn.addEventListener("click", event => {
      event.stopPropagation();
      removeFieldAt(index);
    });
    item.appendChild(removeBtn);

    attachSortable(item, handle, state.schema, index, "field");
    ui.builderOutline.appendChild(item);
  });
}

function renderBuilder() {
  if (!ui.builderContent) {
    return;
  }

  const isConstructorTab = state.builder.activeTab === "constructor";
  const isWideEditorTab = state.builder.activeTab === "theme" || state.builder.activeTab === "settings";
  const isSettingsTab = state.builder.activeTab === "settings";
  if (ui.addTopFieldBtn) {
    ui.addTopFieldBtn.disabled = !isConstructorTab;
    ui.addTopFieldBtn.classList.toggle("hidden-text", !isConstructorTab);
  }
  if (ui.addFieldFromSidebarBtn) {
    ui.addFieldFromSidebarBtn.disabled = !isConstructorTab;
    ui.addFieldFromSidebarBtn.classList.toggle("hidden-text", !isConstructorTab);
  }
  if (ui.resetSchemaBtn) {
    ui.resetSchemaBtn.classList.toggle("hidden-text", !isSettingsTab);
  }
  if (ui.resetAllDataBtn) {
    ui.resetAllDataBtn.classList.toggle("hidden-text", !isSettingsTab);
  }
  if (ui.builderActions) {
    ui.builderActions.classList.toggle("hidden-text", !isSettingsTab);
  }
  if (ui.builderSidebar) {
    ui.builderSidebar.classList.toggle("hidden-text", !isConstructorTab);
  }
  if (ui.saveSchemaBtn) {
    ui.saveSchemaBtn.classList.toggle("hidden-text", state.builder.activeTab === "responses");
  }

  ui.builderContent.classList.toggle("builder-content-wide", isWideEditorTab);
  ui.builderContent.classList.toggle("builder-content-constructor", isConstructorTab);
  ui.builderLayout?.classList.toggle("builder-layout-focus", isWideEditorTab);
  ui.builderSidebar?.classList.toggle("hidden-text", isWideEditorTab);

  ui.builderContent.innerHTML = "";
  if (state.builder.activeTab === "theme") {
    ui.builderContent.appendChild(renderThemeEditor());
  } else if (state.builder.activeTab === "settings") {
    ui.builderContent.appendChild(renderUiConfigEditor());
  } else if (state.builder.activeTab === "responses") {
    ui.builderContent.appendChild(renderResponsesPanel());
  } else {
    getFields().forEach((field, index) => {
      ui.builderContent.appendChild(renderFieldEditor(field, state.schema, index));
    });

    const footerActions = document.createElement("div");
    footerActions.className = "builder-footer-actions";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Добавить вопрос";
    addBtn.addEventListener("click", () => {
      insertFieldAt(state.schema.length);
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "builder-primary-action";
    saveBtn.textContent = "Сохранить";
    saveBtn.addEventListener("click", saveSchemaNow);

    footerActions.append(addBtn, saveBtn);
    ui.builderContent.appendChild(footerActions);
  }
  renderBuilderOutline();

  ui.builderTabs.forEach(tab => {
    tab.classList.toggle("builder-tab-active", tab.dataset.builderTab === state.builder.activeTab);
  });
}

function closeBuilder() {
  if (isBuilderPage()) {
    setAdminToken("");
    if (ui.builderWorkspace) {
      ui.builderWorkspace.classList.add("hidden-text");
    }
    if (ui.builderGate) {
      ui.builderGate.classList.remove("hidden-text");
    }
    if (ui.builderPasscode) {
      ui.builderPasscode.value = "";
    }
    return;
  }
}

function unlockBuilderWorkspace() {
  if (ui.builderGate) {
    ui.builderGate.classList.add("hidden-text");
  }
  if (ui.builderWorkspace) {
    ui.builderWorkspace.classList.remove("hidden-text");
  }
  if (ui.builderAuthError) {
    ui.builderAuthError.classList.add("hidden-text");
  }
  renderBuilder();
}

async function setBuilderTab(tabName) {
  state.builder.activeTab = tabName;
  if (tabName === "responses") {
    await loadResponsesPreview();
  }
  renderBuilder();
}

function createExcelHtmlTable(headers, rows) {
  const escapeHtml = value => text(String(value ?? ""))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const head = headers.map(header => `<th>${escapeHtml(header)}</th>`).join("");
  const body = rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 700; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
}

function exportResponsesToExcel() {
  const headers = Array.isArray(state.builder.responses.headers) ? state.builder.responses.headers : [];
  const rows = Array.isArray(state.builder.responses.rows) ? state.builder.responses.rows : [];
  if (!headers.length || !rows.length) {
    return;
  }

  const html = createExcelHtmlTable(headers, rows);
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `responses-${datePart}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleBuilderUnlock() {
  const passcode = ui.builderPasscode ? ui.builderPasscode.value.trim() : "";


  try {
    const result = await FormApi.loginAdmin(CONFIG, passcode);
    setAdminToken(result.adminToken);
    unlockBuilderWorkspace();
  } catch (error) {
    if (ui.builderAuthError) {
      ui.builderAuthError.textContent = "Неверный код доступа или web app не принял авторизацию.";
      ui.builderAuthError.classList.remove("hidden-text");
    }
  }
}

async function initializeCommonData() {
  hydrateSchema();
  await loadRemoteSchema().catch(error => console.error(error));
  initializeDefaults(getFields());
}

async function initializeFormPage() {
  ui.participantsCount.textContent = getParticipantCount();
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
}

async function initializeBuilderPage() {
  ui.addTopFieldBtn?.remove();
  renderBuilder();
  if (isAdminUnlocked()) {
    unlockBuilderWorkspace();
  }

  if (ui.unlockBuilderBtn) {
    ui.unlockBuilderBtn.addEventListener("click", handleBuilderUnlock);
  }

  if (ui.builderPasscode) {
    ui.builderPasscode.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        handleBuilderUnlock();
      }
    });
  }

  ui.closeBuilderBtn.addEventListener("click", closeBuilder);
  ui.saveSchemaBtn?.addEventListener("click", saveSchemaNow);
  ui.builderTabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      await setBuilderTab(tab.dataset.builderTab || "constructor");
    });
  });
  ui.addTopFieldBtn?.addEventListener("click", () => {
    insertFieldAt(state.schema.length);
  });
  ui.addFieldFromSidebarBtn?.addEventListener("click", () => {
    insertFieldAt(state.schema.length);
  });
  ui.resetSchemaBtn.addEventListener("click", () => openConfirmModal("reset-schema"));
  if (ui.resetAllDataBtn) {
    ui.resetAllDataBtn.addEventListener("click", () => openConfirmModal("reset-all-data"));
  }
  ui.confirmCancelBtn.addEventListener("click", closeConfirmModal);
  ui.confirmSubmitBtn.addEventListener("click", confirmModalAction);
  ui.confirmModal.addEventListener("click", event => {
    if (event.target === ui.confirmModal) {
      closeConfirmModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  window.addEventListener("pointerup", () => {
    if (!state.builder.drag) {
      state.builder.dragArmed = null;
    }
  });

  ui.pageMode = document.body.dataset.page || "form";
  ui.dynamic = document.getElementById("dynamic");
  ui.perPerson = document.getElementById("perPerson");
  ui.participantsCount = document.getElementById("participantsCount");
  ui.responsesCount = document.getElementById("responsesCount");
  ui.detailsBtn = document.getElementById("detailsBtn");
  ui.saveBtn = document.getElementById("saveBtn");
  ui.submitStatus = document.getElementById("submitStatus");
  ui.detailsModal = document.getElementById("detailsModal");
  ui.detailsContent = document.getElementById("detailsContent");
  ui.closeModal = document.getElementById("closeModal");
  ui.confirmModal = document.getElementById("confirmModal");
  ui.confirmTitle = document.getElementById("confirmTitle");
  ui.confirmText = document.getElementById("confirmText");
  ui.confirmCancelBtn = document.getElementById("confirmCancelBtn");
  ui.confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
  ui.builderContent = document.getElementById("builderContent");
  ui.builderActions = document.getElementById("builderActions");
  ui.builderSidebar = document.getElementById("builderSidebar");
  ui.builderLayout = document.querySelector(".builder-layout");
  ui.closeBuilderBtn = document.getElementById("closeBuilderBtn");
  ui.saveSchemaBtn = document.getElementById("saveSchemaBtn");
  ui.addFieldFromSidebarBtn = document.getElementById("addFieldFromSidebarBtn");
  ui.addTopFieldBtn = document.getElementById("addTopFieldBtn");
  ui.resetSchemaBtn = document.getElementById("resetSchemaBtn");
  ui.resetAllDataBtn = document.getElementById("resetAllDataBtn");
  ui.builderGate = document.getElementById("builderGate");
  ui.builderWorkspace = document.getElementById("builderWorkspace");
  ui.builderPasscode = document.getElementById("builderPasscode");
  ui.unlockBuilderBtn = document.getElementById("unlockBuilderBtn");
  ui.builderAuthError = document.getElementById("builderAuthError");
  ui.builderTabs = Array.from(document.querySelectorAll("[data-builder-tab]"));
  ui.builderOutline = document.getElementById("builderOutline");
  ui.pageTitle = document.getElementById("pageTitle");
  ui.heroKicker = document.getElementById("heroKicker");
  ui.heroHeadline = document.getElementById("heroHeadline");
  ui.heroSubline = document.getElementById("heroSubline");
  ui.heroBadge = document.getElementById("heroBadge");
  ui.heroNote = document.getElementById("heroNote");
  ui.userSectionTitle = document.getElementById("userSectionTitle");
  ui.userSectionHint = document.getElementById("userSectionHint");
  ui.participantsStatLabel = document.getElementById("participantsStatLabel");
  ui.responsesStatLabel = document.getElementById("responsesStatLabel");
  ui.name = document.getElementById("name");
  ui.group = document.getElementById("group");
  ui.profileError = document.getElementById("profileError");
  ui.profileCard = document.getElementById("profileCard");
  ui.scrollTopBtn = document.getElementById("scrollTopBtn");

  await initializeCommonData();

  if (isBuilderPage()) {
    await initializeBuilderPage();
    return;
  }

  await initializeFormPage();
});
