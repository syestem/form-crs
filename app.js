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
  formMeta: {
    title: "",
    slug: ""
  },
  stats: {
    responsesCount: 0,
    optionCounts: {}
  },
  optionDetailsOpen: {},
  dateCalendarMonths: {},
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
    selectedFormSlug: "",
    selectedFormTitle: "",
    collapsedDependencies: {},
    forms: {
      loading: false,
      error: "",
      items: [],
      showCreatePanel: false,
      editingSlugFormId: "",
      editingSlugValue: "",
      draft: {
        title: "",
        slug: ""
      }
    },
    responses: {
      loading: false,
      rows: [],
      headers: [],
      records: [],
      selectedKeys: []
    },
    members: {
      loading: false,
      error: "",
      items: [],
      draftEmail: "",
      draftRole: "editor"
    },
    themeMode: "basic",
    saveIndicatorTone: "idle",
    saveIndicatorText: "\u0412\u0441\u0435 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b"
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
  builderFormsBtn: null,
  builderOpenFormBtn: null,
  saveSchemaBtn: null,
  addFieldFromSidebarBtn: null,
  addTopFieldBtn: null,
  resetSchemaBtn: null,
  resetAllDataBtn: null,
  builderGate: null,
  builderWorkspace: null,
  builderEmail: null,
  builderPasscode: null,
  unlockBuilderBtn: null,
  builderForgotPasswordBtn: null,
  builderAuthModeLabel: null,
  builderAuthError: null,
  builderWorkspaceTitle: null,
  builderTabs: [],
  builderOutline: null,
  pageTitle: null,
  heroKicker: null,
  heroRibbonTop: null,
  heroHeadline: null,
  heroSubline: null,
  heroBadge: null,
  heroNote: null,
  heroRibbonBottom: null,
  adminEntryLink: null,
  userSectionTitle: null,
  userSectionHint: null,
  participantsStatLabel: null,
  responsesStatLabel: null,
  name: null,
  group: null,
  profileError: null,
  profileCard: null,
  scrollTopBtn: null,
  loadingOverlay: null,
  loadingLabel: null,
  builderSaveIndicator: null
};

const loadingState = {
  count: 0
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

function ensureLoadingOverlay() {
  if (ui.loadingOverlay || typeof document === "undefined" || !document.body) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "app-loading-overlay hidden-text";

  const card = document.createElement("div");
  card.className = "app-loading-card";

  const spinner = document.createElement("div");
  spinner.className = "app-loading-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const label = document.createElement("div");
  label.className = "app-loading-label";
  label.textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...";

  card.append(spinner, label);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  ui.loadingOverlay = overlay;
  ui.loadingLabel = label;
}

function showLoadingOverlay(message = "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...") {
  ensureLoadingOverlay();
  if (!ui.loadingOverlay) {
    return;
  }

  loadingState.count += 1;
  ui.loadingLabel.textContent = cleanString(message);
  ui.loadingOverlay.classList.remove("hidden-text");
}

function hideLoadingOverlay() {
  if (!ui.loadingOverlay) {
    return;
  }

  loadingState.count = Math.max(0, loadingState.count - 1);
  if (loadingState.count === 0) {
    ui.loadingOverlay.classList.add("hidden-text");
  }
}

function resetLoadingOverlay() {
  loadingState.count = 0;
  if (ui.loadingOverlay) {
    ui.loadingOverlay.classList.add("hidden-text");
  }
}

async function runWithLoading(message, callback) {
  showLoadingOverlay(message);
  try {
    return await callback();
  } finally {
    hideLoadingOverlay();
  }
}

function ensureBuilderSaveIndicator() {
  if (!isBuilderPage() || ui.builderSaveIndicator || typeof document === "undefined" || !document.body) {
    return;
  }

  const indicator = document.createElement("div");
  indicator.className = "builder-save-indicator";
  document.body.appendChild(indicator);
  ui.builderSaveIndicator = indicator;
}

function updateBuilderSaveIndicator() {
  if (!isBuilderPage()) {
    return;
  }

  ensureBuilderSaveIndicator();
  if (!ui.builderSaveIndicator) {
    return;
  }

  ui.builderSaveIndicator.textContent = state.builder.saveIndicatorText;
  ui.builderSaveIndicator.dataset.tone = state.builder.saveIndicatorTone;
}

function setBuilderSaveIndicator(textValue, tone = "idle") {
  state.builder.saveIndicatorText = cleanString(textValue || "");
  state.builder.saveIndicatorTone = tone;
  updateBuilderSaveIndicator();
}

function hasSupabaseAuthConfig() {
  return Boolean(CONFIG.supabase?.url && CONFIG.supabase?.anonKey && window.supabase?.createClient);
}

function getSupabaseSession() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storage.authSessionKey) || "null");
  } catch {
    return null;
  }
}

function setSupabaseSession(session) {
  if (session) {
    localStorage.setItem(CONFIG.storage.authSessionKey, JSON.stringify(session));
    return;
  }

  localStorage.removeItem(CONFIG.storage.authSessionKey);
}

function getSupabaseAccessToken() {
  return cleanString(getSupabaseSession()?.access_token || "");
}

function getBuilderBearerToken() {
  if (hasSupabaseAuthConfig()) {
    return getSupabaseAccessToken();
  }
  return getAdminToken();
}

function hasBuilderAuthorization() {
  return Boolean(getBuilderBearerToken());
}

function getStoredBuilderFormSlug() {
  try {
    return localStorage.getItem(CONFIG.storage.builderFormSlugKey) || "";
  } catch {
    return "";
  }
}

function setSelectedBuilderFormSlug(slug, persist = true) {
  const normalized = cleanString(slug || "");
  state.builder.selectedFormSlug = normalized;
  CONFIG.form.slug = normalized;

  if (!persist) {
    return;
  }

  try {
    if (normalized) {
      localStorage.setItem(CONFIG.storage.builderFormSlugKey, normalized);
    } else {
      localStorage.removeItem(CONFIG.storage.builderFormSlugKey);
    }
  } catch {
    void 0;
  }
}

function setSelectedBuilderFormMeta(form) {
  state.builder.selectedFormTitle = cleanString(form?.title || "");
  setSelectedBuilderFormSlug(cleanString(form?.slug || ""));
}

function hasSelectedBuilderForm() {
  return Boolean(state.builder.selectedFormSlug);
}

function getSelectedBuilderFormRecord() {
  return state.builder.forms.items.find(item => cleanString(item.slug) === cleanString(state.builder.selectedFormSlug)) || null;
}

function getBuilderFormMetaPayload() {
  if (!hasSelectedBuilderForm()) {
    return null;
  }

  return {
    slug: state.builder.selectedFormSlug,
    title: state.builder.selectedFormTitle || undefined
  };
}

function getBuilderEntryHref() {
  if (CONFIG.builder?.url) {
    return CONFIG.builder.url;
  }

  try {
    return new URL("builder.html", window.location.href).toString();
  } catch {
    return "builder.html";
  }
}

function slugifyFormValue(value) {
  return cleanString(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0430-\u044f\u0451]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getPublicFormHref(slug) {
  const normalized = cleanString(slug || "");
  try {
    const url = new URL("index.html", window.location.href);
    if (normalized) {
      url.searchParams.set("form", normalized);
    }
    return url.toString();
  } catch {
    return normalized ? `index.html?form=${encodeURIComponent(normalized)}` : "index.html";
  }
}

function formatBuilderDate(value) {
  const source = cleanString(value || "");
  if (!source) {
    return "\u2014";
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return source;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getRoleLabel(role) {
  const normalized = cleanString(role || "").toLowerCase();
  if (normalized === "owner") {
    return "\u0412\u043b\u0430\u0434\u0435\u043b\u0435\u0446";
  }
  if (normalized === "admin") {
    return "\u0410\u0434\u043c\u0438\u043d";
  }
  if (normalized === "editor") {
    return "\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440";
  }
  return "\u041d\u0430\u0431\u043b\u044e\u0434\u0430\u0442\u0435\u043b\u044c";
}

function formatFormDateValue(value) {
  const source = cleanString(value || "");
  if (!source) {
    return "";
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return source;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function getResponsesHeaderLabel(header) {
  const normalized = cleanString(header || "");
  switch (normalized.toLowerCase()) {
    case "updatedat":
      return "\u0414\u0430\u0442\u0430 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f";
    case "name":
      return "\u0424\u0418\u041e";
    case "group":
      return "\u0413\u0440\u0443\u043f\u043f\u0430";
    case "perperson":
      return "\u0426\u0435\u043d\u0430 \u043d\u0430 \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0430";
    default:
      return text(normalized);
  }
}

function getAssignableRoleChoices() {
  return [
    { value: "owner", label: "\u0412\u043b\u0430\u0434\u0435\u043b\u0435\u0446" },
    { value: "admin", label: "\u0410\u0434\u043c\u0438\u043d" },
    { value: "editor", label: "\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440" },
    { value: "viewer", label: "\u041d\u0430\u0431\u043b\u044e\u0434\u0430\u0442\u0435\u043b\u044c" }
  ];
}

let supabaseBrowserClient = null;

function getSupabaseBrowserClient() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  supabaseBrowserClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return supabaseBrowserClient;
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
    return "\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0438\u043c\u044f \u0438 \u0433\u0440\u0443\u043f\u043f\u0443";
  }

  if (isEmptyValue(state.profile.name)) {
    return "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043c\u044f";
  }

  if (isEmptyValue(state.profile.group)) {
    return "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0433\u0440\u0443\u043f\u043f\u0443";
  }

  return "";
}

function formatPerPerson(amount, people) {
  return `${Math.round(amount / people)} \u20bd/\u0447\u0435\u043b`;
}

function formatTotal(amount) {
  return `${amount} \u20bd`;
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

  if (field.type === "date") {
    return "";
  }

  return null;
}

function parsePositiveCount(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function getDisplayParticipantCount() {
  const rawValue = state.uiConfig?.displayParticipantsCount ?? state.uiConfig?.participantsCount ?? CONFIG.participants;
  return parsePositiveCount(rawValue, CONFIG.participants);
}

function getPricingParticipantCount() {
  const rawValue = state.uiConfig?.pricingParticipantsCount ?? state.uiConfig?.participantsCount ?? CONFIG.participants;
  return parsePositiveCount(rawValue, CONFIG.participants);
}

function normalizeUiConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  return {
    ...source,
    pageTitle: cleanString(source.pageTitle || ""),
    heroRibbonTopText: cleanString(source.heroRibbonTopText || "Cottage event selection"),
    heroKicker: cleanString(source.heroKicker || "Private estate edition"),
    heroHeadline: cleanString(source.heroHeadline || "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0443, \u0431\u0430\u0440 \u0438 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0443 \u0442\u0430\u043a, \u0431\u0443\u0434\u0442\u043e \u0443\u0436\u0435 \u043f\u0440\u043e\u0434\u0430\u0435\u0442\u0435 \u0441\u0430\u043c \u0432\u0435\u0447\u0435\u0440."),
    heroSubline: cleanString(source.heroSubline || "\u0424\u043e\u0440\u043c\u0430 \u0441\u043e\u0431\u0440\u0430\u043d\u0430 \u043a\u0430\u043a \u0430\u0444\u0438\u0448\u0430 \u0441\u043e\u0431\u044b\u0442\u0438\u044f: \u043a\u0440\u0443\u043f\u043d\u044b\u0435 ticket-style \u0430\u043a\u0446\u0435\u043d\u0442\u044b, \u0440\u0432\u0430\u043d\u044b\u0435 \u043d\u0435\u043e\u043d\u043e\u0432\u044b\u0435 \u043f\u043b\u0430\u0448\u043a\u0438 \u0438 \u043f\u043e\u043d\u044f\u0442\u043d\u044b\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u043e\u0442 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438 \u0434\u043e afterparty."),
    heroBadge: cleanString(source.heroBadge || "Sale focus"),
    heroNote: cleanString(source.heroNote || "\u041b\u0443\u0447\u0448\u0435 \u0432\u0441\u0435\u0433\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u043a\u0430\u043a \u043f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u044f \u043a\u043e\u0442\u0442\u0435\u0434\u0436\u0430, \u0437\u0430\u0433\u043e\u0440\u043e\u0434\u043d\u043e\u0439 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438 \u0438 \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044f \u0432\u0435\u0447\u0435\u0440\u0430."),
    heroRibbonText: cleanString(source.heroRibbonText || "tickets tickets tickets tickets"),
    userSectionTitle: cleanString(source.userSectionTitle || "\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430"),
    userSectionHint: cleanString(source.userSectionHint || "\u041e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0438\u043c\u044f \u0438 \u0433\u0440\u0443\u043f\u043f\u0443, \u0447\u0442\u043e\u0431\u044b \u043c\u044b \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u043b\u0438 \u0432\u0430\u0448 \u0432\u044b\u0431\u043e\u0440."),
    namePlaceholder: cleanString(source.namePlaceholder || "\u0424\u0418\u041e"),
    groupPlaceholder: cleanString(source.groupPlaceholder || "\u0413\u0440\u0443\u043f\u043f\u0430"),
    participantsStatLabel: cleanString(source.participantsStatLabel || "\u0412 \u0433\u0440\u0443\u043f\u043f\u0435"),
    responsesStatLabel: cleanString(source.responsesStatLabel || "\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u043b\u0438 \u0444\u043e\u0440\u043c\u0443"),
    ticketLabel: cleanString(source.ticketLabel || "\u0426\u0435\u043d\u0430 \u0431\u0438\u043b\u0435\u0442\u0430"),
    detailsButtonLabel: cleanString(source.detailsButtonLabel || "\u041e\u0431\u0449\u0438\u0439 \u0447\u0435\u043a / \u0418\u0442\u043e\u0433\u043e"),
    saveButtonLabel: cleanString(source.saveButtonLabel || "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0432\u044b\u0431\u043e\u0440"),
    resubmitButtonLabel: cleanString(source.resubmitButtonLabel || "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043c\u043e\u0439 \u0432\u044b\u0431\u043e\u0440"),
    draftStatusText: cleanString(source.draftStatusText || "\u041f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0432\u044b\u0431\u043e\u0440 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f, \u0438 \u0435\u0433\u043e \u043c\u043e\u0436\u043d\u043e \u0431\u0443\u0434\u0435\u0442 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0437\u0436\u0435."),
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
    participantsCount: Number(source.participantsCount) || CONFIG.participants,
    displayParticipantsCount: parsePositiveCount(source.displayParticipantsCount ?? source.participantsCount, CONFIG.participants),
    pricingParticipantsCount: parsePositiveCount(source.pricingParticipantsCount ?? source.participantsCount, CONFIG.participants)
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
    label: cleanString(option?.label) || "\u041d\u043e\u0432\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442",
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
    label: cleanString(field?.label) || "\u041d\u043e\u0432\u044b\u0439 \u0432\u043e\u043f\u0440\u043e\u0441",
    hint: cleanString(field?.hint) || "",
    promoTag: cleanString(field?.promoTag) || "",
    promoTitle: cleanString(field?.promoTitle) || "",
    promoSubtitle: cleanString(field?.promoSubtitle) || "",
    type: field?.type || "single",
    required: Boolean(field?.required),
    appearance: field?.appearance || undefined,
    dependsOn: normalizeDependencies(field?.dependsOn)
  };

  if (normalized.type !== "text" && normalized.type !== "date") {
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
    return "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e";
  }

  if (option.priceType === "fixed") {
    return `${Math.round(option.price / people)} \u20bd/\u0447\u0435\u043b`;
  }

  return `${option.price} \u20bd/\u0447\u0435\u043b`;
}

function getFieldPopularityMeta(field, value) {
  const normalizedValue = cleanString(value || "");
  if (!normalizedValue) {
    return { count: 0, percent: 0 };
  }

  const count = Number(state.stats.optionCounts?.[field.id]?.[normalizedValue] || 0);
  const total = Number(state.stats.responsesCount || 0);
  return {
    count,
    percent: count && total ? Math.round((count / total) * 100) : 0
  };
}

function getDatePopularityTone(percent) {
  if (percent >= 60) {
    return "high";
  }
  if (percent >= 30) {
    return "mid";
  }
  if (percent > 0) {
    return "low";
  }
  return "";
}

function parseIsoDateParts(value) {
  const source = cleanString(value || "");
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3])
  };
}

function formatIsoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCalendarMonthState(fieldId, currentValue) {
  const stored = state.dateCalendarMonths[fieldId];
  if (stored && Number.isFinite(stored.year) && Number.isFinite(stored.month)) {
    return stored;
  }

  const parsed = parseIsoDateParts(currentValue);
  if (parsed) {
    const value = { year: parsed.year, month: parsed.month };
    state.dateCalendarMonths[fieldId] = value;
    return value;
  }

  const now = new Date();
  const value = { year: now.getFullYear(), month: now.getMonth() };
  state.dateCalendarMonths[fieldId] = value;
  return value;
}

function shiftCalendarMonth(fieldId, offset, currentValue) {
  const current = getCalendarMonthState(fieldId, currentValue);
  const nextDate = new Date(current.year, current.month + offset, 1);
  state.dateCalendarMonths[fieldId] = {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth()
  };
}

function getDatePopularityStats(field, isoDate) {
  const meta = getFieldPopularityMeta(field, isoDate);
  return {
    count: meta.count,
    percent: meta.percent,
    tone: getDatePopularityTone(meta.percent)
  };
}

function createDateCalendar(field, currentValue) {
  const calendar = document.createElement("div");
  calendar.className = "date-calendar";

  const monthState = getCalendarMonthState(field.id, currentValue);
  const firstDay = new Date(monthState.year, monthState.month, 1);
  const daysInMonth = new Date(monthState.year, monthState.month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const header = document.createElement("div");
  header.className = "date-calendar-head";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "date-calendar-nav";
  prevBtn.textContent = "\u2039";
  prevBtn.addEventListener("click", () => {
    shiftCalendarMonth(field.id, -1, currentValue);
    refreshUI(true);
  });

  const title = document.createElement("div");
  title.className = "date-calendar-title";
  title.textContent = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(new Date(monthState.year, monthState.month, 1));

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "date-calendar-nav";
  nextBtn.textContent = "\u203a";
  nextBtn.addEventListener("click", () => {
    shiftCalendarMonth(field.id, 1, currentValue);
    refreshUI(true);
  });

  header.append(prevBtn, title, nextBtn);
  calendar.appendChild(header);

  const weekdays = document.createElement("div");
  weekdays.className = "date-calendar-weekdays";
  ["\u041f\u043d", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041f\u0442", "\u0421\u0431", "\u0412\u0441"].forEach(label => {
    const cell = document.createElement("div");
    cell.className = "date-calendar-weekday";
    cell.textContent = label;
    weekdays.appendChild(cell);
  });
  calendar.appendChild(weekdays);

  const grid = document.createElement("div");
  grid.className = "date-calendar-grid";

  for (let i = 0; i < startOffset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "date-calendar-day date-calendar-day-empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = formatIsoDate(monthState.year, monthState.month, day);
    const dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "date-calendar-day";
    dayBtn.textContent = String(day);
    if (currentValue === isoDate) {
      dayBtn.classList.add("date-calendar-day-selected");
    }

    const popularity = getDatePopularityStats(field, isoDate);
    if (popularity.tone) {
      dayBtn.dataset.popularity = popularity.tone;
      dayBtn.title = `${popularity.percent}% \u0433\u0440\u0443\u043f\u043f\u044b \u0432\u044b\u0431\u0440\u0430\u043b\u0438 \u044d\u0442\u0443 \u0434\u0430\u0442\u0443`;
    }

    dayBtn.addEventListener("click", () => {
      state.values[field.id] = isoDate;
      state.dateCalendarMonths[field.id] = { year: monthState.year, month: monthState.month };
      saveDraft();
      refreshUI(true);
    });

    grid.appendChild(dayBtn);
  }

  calendar.appendChild(grid);
  return calendar;
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
      ? "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442"
      : field.type === "date"
        ? "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0430\u0442\u0443"
        : "\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043f\u043e\u043b\u0435";
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
    ui.submitStatus.textContent = "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0431\u043b\u043e\u043a \u0441 \u0438\u043c\u0435\u043d\u0435\u043c \u0438 \u0433\u0440\u0443\u043f\u043f\u043e\u0439.";
    focusProfileError();
    return true;
  }

  const invalidField = findFirstInvalidField();
  if (!invalidField) {
    return false;
  }

  ui.submitStatus.textContent = `\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u043f\u0443\u043d\u043a\u0442: ${text(invalidField.label || "\u0431\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f")}.`;

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
  return `\u042d\u0442\u043e\u0442 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0432\u044b\u0431\u0440\u0430\u043b\u0438 ${percent}% \u0433\u0440\u0443\u043f\u043f\u044b`;
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
    headline.textContent = text(field.promoTitle || field.label || "\u0421\u0435\u043a\u0446\u0438\u044f \u0444\u043e\u0440\u043c\u044b");
    subline.textContent = text(field.promoSubtitle || "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u0442\u0435 \u043f\u0440\u043e\u0434\u0430\u044e\u0449\u0438\u0439 \u043f\u043e\u0434\u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0431\u043b\u043e\u043a\u0430 \u043f\u0440\u044f\u043c\u043e \u0432 \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u0435.");
  } else if (theme === "estate") {
    eyebrow.textContent = "Cottage drop";
    headline.textContent = "\u0421\u043e\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0438\u043a\u0435\u043d\u0434, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043f\u0440\u043e\u0434\u0430\u0435\u0442 \u0430\u0442\u043c\u043e\u0441\u0444\u0435\u0440\u0443 \u043a\u043e\u0442\u0442\u0435\u0434\u0436\u0430 \u0441 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u044d\u043a\u0440\u0430\u043d\u0430.";
    subline.textContent = "\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0438, \u0441\u0432\u0435\u0442, \u0431\u0430\u043d\u043a\u0435\u0442 \u0438 \u0432\u043e\u0437\u0434\u0443\u0445 \u0437\u0430\u0433\u043e\u0440\u043e\u0434\u043d\u043e\u0433\u043e \u0432\u0435\u0447\u0435\u0440\u0430 \u0432 \u043e\u0434\u043d\u043e\u0439 \u0432\u043e\u0440\u043e\u043d\u043a\u0435 \u0432\u044b\u0431\u043e\u0440\u0430.";
  } else if (theme === "alcohol") {
    eyebrow.textContent = "Afterparty mode";
    headline.textContent = "\u0411\u0430\u0440\u043d\u0430\u044f \u043f\u043e\u0434\u0430\u0447\u0430, \u043b\u0435\u0434, \u0431\u043e\u043a\u0430\u043b\u044b \u0438 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0439\u0431 \u0432\u0435\u0447\u0435\u0440\u0438\u043d\u043a\u0438.";
    subline.textContent = "\u041a\u043e\u0433\u0434\u0430 \u0431\u043b\u043e\u043a \u0430\u043b\u043a\u043e\u0433\u043e\u043b\u044f \u043f\u043e\u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0432 \u0437\u043e\u043d\u0435 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u0438, \u0441\u0435\u043a\u0446\u0438\u044f \u043e\u0436\u0438\u0432\u0430\u0435\u0442 \u043a\u0430\u043a \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0439 selling-\u043c\u043e\u043c\u0435\u043d\u0442.";
  } else if (theme === "feast") {
    eyebrow.textContent = "Taste direction";
    headline.textContent = "\u0415\u0434\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u043e\u0449\u0443\u0449\u0430\u0442\u044c\u0441\u044f \u043a\u0430\u043a \u0447\u0430\u0441\u0442\u044c \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b, \u0430 \u043d\u0435 \u043a\u0430\u043a \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0441\u0442\u0440\u043e\u043a\u0430.";
    subline.textContent = "\u0421\u043e\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u0430\u0441\u0442\u0440\u043e\u043d\u043e\u043c\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u0439 \u043f\u043e\u0434 \u0431\u0430\u043d\u043a\u0435\u0442, BBQ \u0438\u043b\u0438 \u043d\u0435\u0444\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0443\u0440\u0448\u0435\u0442.";
  } else if (theme === "show") {
    eyebrow.textContent = "Night rhythm";
    headline.textContent = "\u0420\u0430\u0437\u0432\u043b\u0435\u043a\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0431\u043b\u043e\u043a \u0437\u0430\u0434\u0430\u0435\u0442 \u0440\u0438\u0442\u043c \u0432\u0435\u0447\u0435\u0440\u0430 \u0438 \u043f\u0440\u043e\u0434\u0430\u0435\u0442 \u044d\u043c\u043e\u0446\u0438\u044e \u0437\u0430\u0440\u0430\u043d\u0435\u0435.";
    subline.textContent = "\u041f\u043e\u043a\u0430\u0436\u0438\u0442\u0435 \u0433\u043e\u0441\u0442\u044f\u043c, \u0447\u0442\u043e \u0437\u0434\u0435\u0441\u044c \u0431\u0443\u0434\u0435\u0442 \u043d\u0435 \u043f\u0440\u043e\u0441\u0442\u043e \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430, \u0430 \u043f\u043e\u043b\u043d\u043e\u0446\u0435\u043d\u043d\u043e\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u0435.";
  } else {
    eyebrow.textContent = `Chapter ${index + 1}`;
    headline.textContent = "\u0421\u0435\u043a\u0446\u0438\u044f \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0430 \u043a\u0430\u043a \u0447\u0430\u0441\u0442\u044c \u0436\u0438\u0432\u043e\u0439 \u043b\u0435\u043d\u0434\u0438\u043d\u0433\u043e\u0432\u043e\u0439 \u0438\u0441\u0442\u043e\u0440\u0438\u0438.";
    subline.textContent = "\u0422\u0435\u043a\u0441\u0442\u0443\u0440\u044b, \u043a\u0440\u0443\u043f\u043d\u044b\u0435 \u0430\u043a\u0446\u0435\u043d\u0442\u044b \u0438 \u0440\u0430\u0437\u043d\u044b\u0435 \u0440\u0438\u0442\u043c\u044b \u043f\u043e\u043c\u043e\u0433\u0430\u044e\u0442 \u043d\u0435 \u0443\u0441\u0442\u0430\u0432\u0430\u0442\u044c \u043e\u0442 \u0434\u043b\u0438\u043d\u043d\u043e\u0439 \u0444\u043e\u0440\u043c\u044b.";
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
    detailsBtn.textContent = "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435";
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
    mapBtn.textContent = "\u041b\u043e\u043a\u0430\u0446\u0438\u044f";
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
      input.readOnly = true;
      input.placeholder = "\u0414\u0414.\u041c\u041c.\u0413\u0413\u0413\u0413";
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

    dateWrap.appendChild(input);

    const popularityMeta = getFieldPopularityMeta(field, selectedDateValue);
    dateWrap.appendChild(createDateCalendar(field, selectedDateValue));

    if (selectedDateValue && popularityMeta.percent > 0) {
      dateWrap.dataset.popularity = getDatePopularityTone(popularityMeta.percent);
      const note = document.createElement("div");
      note.className = "date-field-popularity";
      note.textContent = `\u042d\u0442\u0443 \u0434\u0430\u0442\u0443 \u0432\u044b\u0431\u0440\u0430\u043b\u0438 ${popularityMeta.percent}% \u0433\u0440\u0443\u043f\u043f\u044b`;
      dateWrap.appendChild(note);
    }

    wrapper.appendChild(dateWrap);
  }

  if (Array.isArray(field.options) && field.options.length) {
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
      mobileHint.textContent = "\u041b\u0438\u0441\u0442\u0430\u0439\u0442\u0435 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u0438\u043b\u0438 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0441\u0442\u0440\u0435\u043b\u043a\u0438";

      field.options.forEach(option => {
        track.appendChild(createOptionNode(field, option, getPricingParticipantCount()));
      });

      carousel.append(previousBtn, track, nextBtn, mobileHint);
      mountCarouselControls(track, previousBtn, nextBtn, field.id);
      wrapper.appendChild(carousel);
    } else {
      field.options.forEach(option => {
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

function calculateTotal() {
  let total = 0;

  forEachSelectedOption(getFields(), (_, option) => {
    total += calcItem(option, getPricingParticipantCount());
  });

  const ticketLabel = text(state.uiConfig.ticketLabel || getDefaultUiConfig().ticketLabel);
  ui.perPerson.textContent = `${ticketLabel}: ${formatPerPerson(total, getPricingParticipantCount())}`;
  return total;
}

function generateDetails() {
  const rows = [];
  let total = 0;

  forEachSelectedOption(getFields(), (_, option) => {
    const sum = calcItem(option, getPricingParticipantCount());
    total += sum;

    rows.push(`
      <tr>
        <td>${option.label}</td>
        <td>${formatTotal(sum)}</td>
        <td>${formatPerPerson(sum, getPricingParticipantCount())}</td>
      </tr>
    `);
  });

  rows.push(`
    <tr class="check-table-total">
      <td><b>\u0418\u0442\u043e\u0433\u043e</b></td>
      <td><b>${formatTotal(total)}</b></td>
      <td><b>${formatPerPerson(total, getPricingParticipantCount())}</b></td>
    </tr>
  `);

  return `
    <div class="check-table-wrap">
      <table class="check-table">
        <thead>
          <tr>
            <th>\u041f\u043e\u0437\u0438\u0446\u0438\u044f</th>
            <th>\u041e\u0431\u0449\u0438\u0439 \u0447\u0435\u043a</th>
            <th>\u041d\u0430 \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0430</th>
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
    ui.adminEntryLink.textContent = "\u0412\u043e\u0439\u0442\u0438";
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
  ui.saveBtn.textContent = state.isSubmitting ? "\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430..." : state.meta.hasSubmitted ? text(state.uiConfig.resubmitButtonLabel || getDefaultUiConfig().resubmitButtonLabel) : text(state.uiConfig.saveButtonLabel || getDefaultUiConfig().saveButtonLabel);
  if (state.meta.hasSubmitted && state.meta.lastSubmittedAt && !state.isSubmitting) {
    ui.submitStatus.textContent = `\u0424\u043e\u0440\u043c\u0430 \u0443\u0436\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0432\u044b\u0431\u043e\u0440 \u0438 \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u0443\u044e \u0432\u0435\u0440\u0441\u0438\u044e. \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435: ${new Date(state.meta.lastSubmittedAt).toLocaleString("ru-RU")}`;
  } else if (!state.isSubmitting && !state.meta.hasSubmitted && !profileError) {
    ui.submitStatus.textContent = CONFIG.api.baseUrl ? text(state.uiConfig.draftStatusText || getDefaultUiConfig().draftStatusText) : "\u041f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0432\u044b\u0431\u043e\u0440 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e. \u0414\u043b\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u0441 \u0431\u0430\u0437\u043e\u0439 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0435 backend \u0438 \u0443\u043a\u0430\u0436\u0438\u0442\u0435 CONFIG.api.baseUrl.";
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
    return JSON.parse(localStorage.getItem(getScopedStorageKey(CONFIG.storage.draftKey)) || "null");
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
  return runWithLoading(isBuilderPage() ? "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0444\u043e\u0440\u043c\u0443..." : "\u0413\u043e\u0442\u043e\u0432\u0438\u043c \u0444\u043e\u0440\u043c\u0443...", async () => {
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

function queueSchemaSync() {
  if (isBuilderPage() && !hasSelectedBuilderForm()) {
    return;
  }

  if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.saveSchema !== "function") {
    return;
  }

  if (state.schemaSync.timerId) {
    clearTimeout(state.schemaSync.timerId);
  }

  state.schemaSync.timerId = window.setTimeout(async () => {
    state.schemaSync.timerId = 0;
    state.schemaSync.isSaving = true;
    setBuilderSaveIndicator("\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u0443\u0435\u043c \u0441 backend...", "saving");

    try {
      const result = await FormApi.saveSchema(CONFIG, state.schema, state.uiConfig, getBuilderBearerToken(), getBuilderFormMetaPayload());
      if (result?.form?.slug) {
        setSelectedBuilderFormMeta(result.form);
      }
      setBuilderSaveIndicator("\u0412\u0441\u0435 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b", "saved");
      if (isBuilderPage() && ui.submitStatus) {
        ui.submitStatus.textContent = "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u0445\u0435\u043c\u044b \u043f\u043e\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e \u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0432 \u0444\u043e\u0440\u043c\u0435 \u043f\u043e\u0441\u043b\u0435 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 backend API.";
      }
    } catch (error) {
      console.error(error);
      if (String(error.message || "").toLowerCase().includes("admin")) {
        setAdminToken("");
      }
      if (!state.isSubmitting) {
        ui.submitStatus.textContent = "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0432 \u0444\u043e\u0440\u043c\u0443. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 API.";
      }
      setBuilderSaveIndicator("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c", "error");
    } finally {
      state.schemaSync.isSaving = false;
    }
  }, 350);
}

async function saveSchemaNow() {
  saveSchema();
  saveUiConfig();

  if (isBuilderPage() && !hasSelectedBuilderForm()) {
    ui.submitStatus.textContent = "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u043e\u0440\u043c\u0443 \u0438\u043b\u0438 \u0441\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043d\u043e\u0432\u0443\u044e.";
    return;
  }

  if (!CONFIG.api.baseUrl || !window.FormApi || typeof FormApi.saveSchema !== "function") {
    ui.submitStatus.textContent = "\u041d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d backend API. \u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 URL backend API.";
    return;
  }

  try {
    setBuilderSaveIndicator("\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0432\u0440\u0443\u0447\u043d\u0443\u044e...", "saving");
    ui.submitStatus.textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0441\u0445\u0435\u043c\u0443...";
    const result = await FormApi.saveSchema(CONFIG, state.schema, state.uiConfig, getBuilderBearerToken(), getBuilderFormMetaPayload());
    if (result?.form?.slug) {
      setSelectedBuilderFormMeta(result.form);
    }
    ui.submitStatus.textContent = "\u0421\u0445\u0435\u043c\u0430 \u0444\u043e\u0440\u043c\u044b \u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.";
    setBuilderSaveIndicator("\u0412\u0441\u0435 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b", "saved");
  } catch (error) {
    console.error(error);
    if (String(error.message || "").toLowerCase().includes("admin")) {
      setAdminToken("");
      ui.submitStatus.textContent = "\u0421\u0435\u0441\u0441\u0438\u044f \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430 \u0438\u0441\u0442\u0435\u043a\u043b\u0430. \u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440 \u0437\u0430\u043d\u043e\u0432\u043e \u0438 \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435.";
      setBuilderSaveIndicator("\u0421\u0435\u0441\u0441\u0438\u044f \u0438\u0441\u0442\u0435\u043a\u043b\u0430", "error");
      return;
    }
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0441\u0445\u0435\u043c\u0443 \u0438\u043b\u0438 \u0444\u043e\u0440\u043c\u0443: ${error.message || "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430"}. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 API.`;
    setBuilderSaveIndicator("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c", "error");
  }
}

function getScopedStorageKey(baseKey) {
  const slug = cleanString(CONFIG.form?.slug || "").trim();
  return slug ? `${baseKey}:${slug}` : baseKey;
}

async function loadResponsesPreview() {
  return runWithLoading("\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043e\u0442\u0432\u0435\u0442\u044b...", async () => {
    if (isBuilderPage() && !hasSelectedBuilderForm()) {
      state.builder.responses.headers = [];
      state.builder.responses.rows = [];
      state.builder.responses.records = [];
      state.builder.responses.selectedKeys = [];
      return;
    }

    if (!window.FormApi || typeof FormApi.fetchResponses !== "function") {
      return;
    }

    state.builder.responses.loading = true;
    try {
      const result = await FormApi.fetchResponses(CONFIG, getBuilderBearerToken());
      state.builder.responses.headers = Array.isArray(result.headers) ? result.headers : [];
      state.builder.responses.rows = Array.isArray(result.rows) ? result.rows : [];
      state.builder.responses.records = Array.isArray(result.records) ? result.records : [];
      state.builder.responses.selectedKeys = state.builder.responses.selectedKeys.filter(key =>
        state.builder.responses.records.some(record => cleanString(record?.submissionKey) === key)
      );
    } catch (error) {
      console.error(error);
      state.builder.responses.headers = [];
      state.builder.responses.rows = [];
      state.builder.responses.records = [];
      state.builder.responses.selectedKeys = [];
      ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442\u044b: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
    } finally {
      state.builder.responses.loading = false;
      renderBuilder();
    }
  });
}

async function loadBuilderMembers() {
  if (!hasSelectedBuilderForm()) {
    state.builder.members.items = [];
    state.builder.members.error = "";
    return;
  }

  if (!window.FormApi || typeof FormApi.listMembers !== "function") {
    return;
  }

  state.builder.members.loading = true;
  state.builder.members.error = "";
  renderBuilder();
  try {
    const result = await FormApi.listMembers(CONFIG, getBuilderBearerToken());
    state.builder.members.items = Array.isArray(result.members) ? result.members : [];
  } catch (error) {
    state.builder.members.items = [];
    state.builder.members.error = cleanString(error?.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0440\u0430\u0432\u0430.");
  } finally {
    state.builder.members.loading = false;
    renderBuilder();
  }
}

async function inviteBuilderMember() {
  const email = cleanString(state.builder.members.draftEmail).toLowerCase();
  const role = cleanString(state.builder.members.draftRole || "editor");
  if (!email) {
    ui.submitStatus.textContent = "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.";
    return;
  }

  try {
    ui.submitStatus.textContent = "\u0414\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u043c \u0434\u043e\u0441\u0442\u0443\u043f...";
    await FormApi.addMember(CONFIG, { email, role }, getBuilderBearerToken());
    state.builder.members.draftEmail = "";
    state.builder.members.draftRole = "editor";
    await loadBuilderMembers();
    ui.submitStatus.textContent = "\u0414\u043e\u0441\u0442\u0443\u043f \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d.";
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u0434\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

async function updateBuilderMemberRole(member, role) {
  try {
    await FormApi.updateMember(CONFIG, member.userId, { role }, getBuilderBearerToken());
    await loadBuilderMembers();
    ui.submitStatus.textContent = "\u0420\u043e\u043b\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430.";
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0440\u043e\u043b\u044c: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

async function removeBuilderMember(member) {
  if (!window.confirm(`\u0423\u0431\u0440\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f \u0434\u043b\u044f ${cleanString(member.email || member.userId)}?`)) {
    return;
  }

  try {
    await FormApi.removeMember(CONFIG, member.userId, getBuilderBearerToken());
    await loadBuilderMembers();
    ui.submitStatus.textContent = "\u0414\u043e\u0441\u0442\u0443\u043f \u0443\u0434\u0430\u043b\u0435\u043d.";
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

function toggleResponseSelection(submissionKey, checked) {
  const key = cleanString(submissionKey || "");
  if (!key) {
    return;
  }

  const next = new Set(state.builder.responses.selectedKeys);
  if (checked) {
    next.add(key);
  } else {
    next.delete(key);
  }
  state.builder.responses.selectedKeys = Array.from(next);
}

function toggleAllResponsesSelection(checked) {
  state.builder.responses.selectedKeys = checked
    ? state.builder.responses.records.map(record => cleanString(record?.submissionKey)).filter(Boolean)
    : [];
}

async function deleteResponseRow(submissionKey) {
  const key = cleanString(submissionKey || "");
  if (!key || !hasSelectedBuilderForm()) {
    return;
  }

  try {
    ui.submitStatus.textContent = "\u0423\u0434\u0430\u043b\u044f\u0435\u043c \u043e\u0442\u0432\u0435\u0442...";
    await FormApi.deleteResponse(CONFIG, key, getBuilderBearerToken());
    await loadResponsesPreview();
    ui.submitStatus.textContent = "\u041e\u0442\u0432\u0435\u0442 \u0443\u0434\u0430\u043b\u0435\u043d.";
    renderBuilder();
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

async function deleteSelectedResponses() {
  if (!state.builder.responses.selectedKeys.length || !hasSelectedBuilderForm()) {
    return;
  }

  if (!window.confirm(`\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b (${state.builder.responses.selectedKeys.length})? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.`)) {
    return;
  }

  ui.submitStatus.textContent = "\u0423\u0434\u0430\u043b\u044f\u0435\u043c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b...";
  try {
    for (const submissionKey of state.builder.responses.selectedKeys) {
      await FormApi.deleteResponse(CONFIG, submissionKey, getBuilderBearerToken());
    }
    state.builder.responses.selectedKeys = [];
    await loadResponsesPreview();
    ui.submitStatus.textContent = "\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b \u0443\u0434\u0430\u043b\u0435\u043d\u044b.";
    renderBuilder();
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
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
    } else if ((field.type === "text" || field.type === "date") && !isEmptyValue(value)) {
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
    participants: getPricingParticipantCount(),
    pricingParticipants: getPricingParticipantCount(),
    displayParticipants: getDisplayParticipantCount(),
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
    ui.confirmTitle.textContent = "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0441\u0445\u0435\u043c\u0443 \u0444\u043e\u0440\u043c\u044b?";
    ui.confirmText.textContent = "\u041c\u044b \u0437\u0430\u043c\u0435\u043d\u0438\u043c \u0442\u0435\u043a\u0443\u0449\u0443\u044e \u0441\u0445\u0435\u043c\u0443 \u0432\u043e\u043f\u0440\u043e\u0441\u0430\u043c\u0438 \u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u043c\u0438 \u0438\u0437 config.js.";
    ui.confirmSubmitBtn.textContent = "\u0414\u0430, \u0441\u0431\u0440\u043e\u0441\u0438\u0442\u044c";
  } else if (action === "reset-all-data") {
    ui.confirmTitle.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u0441\u0435 \u043e\u0442\u0432\u0435\u0442\u044b \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439?";
    ui.confirmText.textContent = "\u0412\u0441\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0435 \u043e\u0442\u0432\u0435\u0442\u044b \u0434\u043b\u044f \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u0444\u043e\u0440\u043c\u044b \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043b\u0435\u043d\u044b \u0431\u0435\u0437 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f.";
    ui.confirmSubmitBtn.textContent = "\u0414\u0430, \u0443\u0434\u0430\u043b\u0438\u0442\u044c";
  } else {
    ui.confirmTitle.textContent = state.meta.hasSubmitted ? "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043d\u0443\u044e \u0444\u043e\u0440\u043c\u0443?" : "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0443?";
    ui.confirmText.textContent = state.meta.hasSubmitted ? "\u041c\u044b \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0448\u0435\u043c \u0432\u0430\u0448 \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0439 \u043e\u0442\u0432\u0435\u0442 \u0438 \u043e\u0431\u043d\u043e\u0432\u0438\u043c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u0444\u043e\u0440\u043c\u044b." : "\u041f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0432\u044b\u0431\u043e\u0440 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f, \u0438 \u0435\u0433\u043e \u043c\u043e\u0436\u043d\u043e \u0431\u0443\u0434\u0435\u0442 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0437\u0436\u0435.";
    ui.confirmSubmitBtn.textContent = "\u0414\u0430, \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c";
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
    ui.submitStatus.textContent = "\u0421\u0445\u0435\u043c\u0430 \u0444\u043e\u0440\u043c\u044b \u0441\u0431\u0440\u043e\u0448\u0435\u043d\u0430. \u0412\u0435\u0440\u043d\u0443\u043b\u0438 \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0438\u0437 config.js.";
    return;
  }

  if (action === "reset-all-data") {
    ui.submitStatus.textContent = "\u0423\u0434\u0430\u043b\u044f\u0435\u043c \u0432\u0441\u0435 \u043e\u0442\u0432\u0435\u0442\u044b...";
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
      ui.submitStatus.textContent = "\u0412\u0441\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0435 \u043e\u0442\u0432\u0435\u0442\u044b \u0443\u0434\u0430\u043b\u0435\u043d\u044b.";
    } catch (error) {
      console.error(error);
      ui.submitStatus.textContent = "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0435 \u043e\u0442\u0432\u0435\u0442\u044b. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044e \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.";
    }
    return;
  }

  state.isSubmitting = true;
  ui.submitStatus.textContent = "\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u043c \u0444\u043e\u0440\u043c\u0443...";
  updateSubmitUi();

  try {
    const payload = buildSubmissionPayload();
    const result = await FormApi.submit(CONFIG, payload);
    state.meta.hasSubmitted = true;
    state.meta.lastSubmittedAt = payload.updatedAt;
    saveDraft();
    await loadStats();
    refreshUI(true);
    ui.submitStatus.textContent = result.source === "remote" ? "\u0424\u043e\u0440\u043c\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430 \u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430 \u0432 \u0431\u0430\u0437\u0435. \u0412\u044b \u0441\u043c\u043e\u0436\u0435\u0442\u0435 \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0435\u0435 \u043f\u043e\u0437\u0436\u0435." : "\u0424\u043e\u0440\u043c\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430 \u0442\u043e\u043b\u044c\u043a\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e.";
  } catch (error) {
    console.error(error);
    ui.submitStatus.textContent = "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0444\u043e\u0440\u043c\u0443. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.";
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
  if (isBuilderPage()) {
    setBuilderSaveIndicator("\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f...", "saving");
  }
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
    label: "\u041d\u043e\u0432\u044b\u0439 \u0432\u043e\u043f\u0440\u043e\u0441",
    hint: "",
    type: "single",
    required: false,
    dependsOn: [],
    options: [
      createOptionTemplate()
    ]
  };
}

function cloneFieldForInsert(field) {
  const cloned = deepClone(field);
  cloned.id = generateId("field");
  if (Array.isArray(cloned.options)) {
    cloned.options = cloned.options.map(option => ({
      ...option,
      value: generateId("option")
    }));
  }
  return cloned;
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
    label: "\u041d\u043e\u0432\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442",
    description: "",
    details: "",
    mapUrl: "",
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

function createBuilderField(labelText, inputNode, className = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `builder-group${className ? ` ${className}` : ""}`;

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

  const textNode = document.createElement("span");
  textNode.textContent = text(labelText);

  wrapper.append(input, textNode);
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
  return text(field.label || "\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f");
}

function getOperatorChoices() {
  return [
    { value: "equals", label: "\u0420\u0430\u0432\u043d\u043e" },
    { value: "notEquals", label: "\u041d\u0435 \u0440\u0430\u0432\u043d\u043e" },
    { value: "includes", label: "\u0421\u043e\u0434\u0435\u0440\u0436\u0438\u0442" },
    { value: "notIncludes", label: "\u041d\u0435 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442" }
  ];
}

function getDependencyTargets(currentFieldId) {
  return [{
    value: "",
    label: "Не выбрано"
  }].concat(getFields()
    .filter(field => field.id !== currentFieldId)
    .map(field => ({
      value: field.id,
      label: `${getFieldDisplayName(field)} (${field.id})`
    })));
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
  })).reduce((items, option) => {
    if (!items.length) {
      items.push({ value: "", label: "Не выбрано" });
    }
    items.push(option);
    return items;
  }, []), value => {
    rule.value = value;
    applySchemaChanges();
  });
}

function createDependencyRule(field, targetField = null) {
  return {
    id: generateId("dep"),
    fieldId: targetField?.id || "",
    operator: targetField?.type === "multi" ? "includes" : "equals",
    value: ""
  };
}

function createDependencyGroup(field) {
  return normalizeDependencyGroup({
    joiner: "and",
    rules: [createDependencyRule(field, null)]
  });
}
function getDependencyRuleCount(field) {
  const visibility = normalizeDependencies(field.dependsOn);
  return visibility.groups.reduce((sum, group) => sum + (group.rules || []).filter(rule => cleanString(rule.fieldId || "")).length, 0);
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

function ensureDependencyEditorGroup(field) {
  field.dependsOn = normalizeDependencies(field.dependsOn);
  if (!field.dependsOn.groups.length) {
    field.dependsOn.groups.push(createDependencyGroup(field));
  }
  return field.dependsOn;
}

function renderDependencyGroupEditor(field, visibility, group, groupIndex) {
  const groupCard = document.createElement("div");
  groupCard.className = "builder-item builder-item-compact dependency-group-card";

  const row = document.createElement("div");
  row.className = "builder-row builder-row-4";
  const groupJoinerSelect = createSelectInput(group.joiner || "and", [
      { value: "and", label: "\u0418" },
      { value: "or", label: "\u0418\u041b\u0418" }
    ], value => {
      group.joiner = value;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    });
  groupJoinerSelect.classList.add("builder-dependency-joiner-select");
  row.append(
    createBuilderField("\u0421\u0432\u044f\u0437\u044c", groupJoinerSelect, "builder-group-compact builder-dependency-joiner-field")
  );

  const removeGroupBtn = document.createElement("button");
  removeGroupBtn.type = "button";
  removeGroupBtn.className = "button-secondary builder-row-delete builder-dependency-remove-group";
  removeGroupBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c";
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
      joinerBadge.textContent = group.joiner === "or" ? "\u0418\u041b\u0418" : "\u0418";
      ruleCard.appendChild(joinerBadge);
    }

    const ruleRow = document.createElement("div");
    ruleRow.className = "builder-row builder-row-4";
    ruleRow.append(
      createBuilderField("\u041f\u043e\u043b\u0435", createSelectInput(rule.fieldId || "", getDependencyTargets(field.id), value => {
        rule.fieldId = value;
        const target = getFields().find(item => item.id === value);
        rule.operator = target?.type === "multi" ? "includes" : "equals";
        rule.value = "";
        applySchemaChanges({ resetValues: true, rerenderBuilder: true });
      })),
      createBuilderField("\u0423\u0441\u043b\u043e\u0432\u0438\u0435", createSelectInput(rule.operator || "equals", getOperatorChoices(), value => {
        rule.operator = value;
        applySchemaChanges({ resetValues: true });
      })),
      createBuilderField("\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435", renderDependencyValueInput(field, rule))
    );

    const removeRuleBtn = document.createElement("button");
    removeRuleBtn.type = "button";
    removeRuleBtn.className = "button-secondary";
    removeRuleBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c";
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
  addRuleBtn.className = "builder-dependency-add-btn";
  addRuleBtn.textContent = "+";
  addRuleBtn.title = "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u043e";
  addRuleBtn.setAttribute("aria-label", "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u043e");
  addRuleBtn.disabled = getDependencyTargets(field.id).length === 0;
  addRuleBtn.addEventListener("click", () => {
    if (!getFields().find(item => item.id !== field.id)) {
      return;
    }
    group.rules.push(createDependencyRule(field, null));
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
  title.textContent = "\u0417\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0438 \u0438 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u0442\u0435, \u043a\u043e\u0433\u0434\u0430 \u044d\u0442\u043e \u043f\u043e\u043b\u0435 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0438\u043b\u0438 \u0441\u043a\u0440\u044b\u0432\u0430\u0435\u0442\u0441\u044f. \u041c\u043e\u0436\u043d\u043e \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0433\u0440\u0443\u043f\u043f \u0443\u0441\u043b\u043e\u0432\u0438\u0439 \u0438 \u043e\u0431\u044a\u0435\u0434\u0438\u043d\u044f\u0442\u044c \u0438\u0445 \u0447\u0435\u0440\u0435\u0437 \u0418 / \u0418\u041b\u0418.";
  section.appendChild(note);

  const visibility = ensureDependencyEditorGroup(field);

  const topRow = document.createElement("div");
  topRow.className = "builder-row builder-row-4 builder-row-dependencies";
  topRow.append(
    createBuilderField("\u0421\u0432\u044f\u0437\u044c \u043c\u0435\u0436\u0434\u0443 \u0433\u0440\u0443\u043f\u043f\u0430\u043c\u0438", createSelectInput(visibility.joiner || "and", [
      { value: "and", label: "\u0418" },
      { value: "or", label: "\u0418\u041b\u0418" }
    ], value => {
      visibility.joiner = value;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }))
  );

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "button-secondary builder-clear-btn";
  clearBtn.textContent = "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0432\u0441\u0435";
  clearBtn.addEventListener("click", () => {
    field.dependsOn = normalizeDependencies();
    ensureDependencyEditorGroup(field);
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
      groupJoiner.textContent = visibility.joiner === "or" ? "\u0418\u041b\u0418" : "\u0418";
      groupsList.appendChild(groupJoiner);
    }

    groupsList.appendChild(renderDependencyGroupEditor(field, visibility, group, groupIndex));
  });
  section.appendChild(groupsList);

  const addGroupBtn = document.createElement("button");
  addGroupBtn.type = "button";
  addGroupBtn.className = "builder-dependency-add-btn";
  addGroupBtn.textContent = "+";
  addGroupBtn.title = "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0433\u0440\u0443\u043f\u043f\u0443 \u0443\u0441\u043b\u043e\u0432\u0438\u0439";
  addGroupBtn.setAttribute("aria-label", "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0433\u0440\u0443\u043f\u043f\u0443 \u0443\u0441\u043b\u043e\u0432\u0438\u0439");
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
    option.label || `\u0412\u0430\u0440\u0438\u0430\u043d\u0442 ${optionIndex + 1}`,
    `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`,
    "\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044c \u0432\u0430\u0440\u0438\u0430\u043d\u0442"
  );
  card.appendChild(header);
  attachSortable(card, handle, options, optionIndex, "option", field.id);

  const row1 = document.createElement("div");
  row1.className = "builder-row builder-row-3";
  row1.append(
    createBuilderField("\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435", createCommittedTextInput(option.value || "", value => {
      option.value = value;
      meta.textContent = `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`;
    }, value => {
      option.value = value;
      meta.textContent = `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    })),
    createBuilderField("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", createTextInput(option.label || "", value => {
      option.label = value;
      title.textContent = text(option.label || `\u0412\u0430\u0440\u0438\u0430\u043d\u0442 ${optionIndex + 1}`);
      applySchemaChanges();
    })),
    createBuilderField("\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435", createTextInput(option.description || "", value => {
      option.description = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-4";
  row2.append(
    createBuilderField("\u0424\u043e\u0442\u043e / URL", createTextInput(option.image || "", value => {
      option.image = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0426\u0435\u043d\u0430", createTextInput(option.price || 0, value => {
      option.price = Number(value) || 0;
      applySchemaChanges();
    }, "number")),
    createBuilderField("\u0422\u0438\u043f \u0446\u0435\u043d\u044b", createSelectInput(option.priceType || "fixed", [
      { value: "fixed", label: "\u0424\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f" },
      { value: "perPerson", label: "\u041d\u0430 \u0447\u0435\u043b\u043e\u0432\u0435\u043a" }
    ], value => {
      option.priceType = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u0440\u043e\u043c\u043e-\u0442\u0435\u043a\u0441\u0442", createTextInput(option.promoText || "", value => {
      option.promoText = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "builder-row builder-row-3";
  row3.append(
    createBuilderField("\u041f\u043b\u0435\u0439\u0441\u0445\u043e\u043b\u0434\u0435\u0440 \u0438\u043c\u0435\u043d\u0438", createTextInput(state.uiConfig.namePlaceholder || "", value => {
      state.uiConfig.namePlaceholder = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043b\u0435\u0439\u0441\u0445\u043e\u043b\u0434\u0435\u0440 \u0433\u0440\u0443\u043f\u043f\u044b", createTextInput(state.uiConfig.groupPlaceholder || "", value => {
      state.uiConfig.groupPlaceholder = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u0446\u0435\u043d\u044b", createTextInput(state.uiConfig.ticketLabel || "", value => {
      state.uiConfig.ticketLabel = value;
      applySchemaChanges();
    }))
  );

  const participantsRow = document.createElement("div");
  participantsRow.className = "builder-row builder-row-2";
  participantsRow.append(
    createBuilderField("\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u043d\u0430 \u0441\u0430\u0439\u0442\u0435", createTextInput(state.uiConfig.displayParticipantsCount || getDisplayParticipantCount(), value => {
      state.uiConfig.displayParticipantsCount = Math.max(1, Number(value) || CONFIG.participants);
      if (ui.participantsCount) {
        ui.participantsCount.textContent = getDisplayParticipantCount();
      }
      applySchemaChanges();
    }, "number")),
    createBuilderField("\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u0434\u043b\u044f \u0446\u0435\u043d\u044b", createTextInput(state.uiConfig.pricingParticipantsCount || state.uiConfig.participantsCount || getPricingParticipantCount(), value => {
      const normalized = Math.max(1, Number(value) || CONFIG.participants);
      state.uiConfig.pricingParticipantsCount = normalized;
      state.uiConfig.participantsCount = normalized;
      applySchemaChanges();
    }, "number"))
  );

  const row4 = document.createElement("div");
  row4.className = "builder-row builder-row-3";
  row4.append(
    createBuilderField("\u0421\u0447\u0435\u0442\u0447\u0438\u043a \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432", createTextInput(state.uiConfig.participantsStatLabel || "", value => {
      state.uiConfig.participantsStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0421\u0447\u0435\u0442\u0447\u0438\u043a \u043e\u0442\u0432\u0435\u0442\u043e\u0432", createTextInput(state.uiConfig.responsesStatLabel || "", value => {
      state.uiConfig.responsesStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435", createTextInput(state.uiConfig.detailsButtonLabel || "", value => {
      state.uiConfig.detailsButtonLabel = value;
      applySchemaChanges();
    }))
  );

  const row5 = document.createElement("div");
  row5.className = "builder-row";
  row5.append(
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438", createTextInput(state.uiConfig.saveButtonLabel || "", value => {
      state.uiConfig.saveButtonLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e\u0439 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438", createTextInput(state.uiConfig.resubmitButtonLabel || "", value => {
      state.uiConfig.resubmitButtonLabel = value;
      applySchemaChanges();
    }))
  );

  sections.append(
    createBuilderPanelSection("Hero \u0438 \u0432\u0435\u0440\u0445 \u0444\u043e\u0440\u043c\u044b", "\u0417\u0434\u0435\u0441\u044c \u043d\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u0435\u0440\u0432\u044b\u0439 \u044d\u043a\u0440\u0430\u043d \u0444\u043e\u0440\u043c\u044b \u0438 hero-\u0431\u043b\u043e\u043a.", row1, heroRow, heroTextRow, row2),
    createBuilderPanelSection("\u041f\u043e\u0434\u043f\u0438\u0441\u0438 \u0438 \u043a\u043d\u043e\u043f\u043a\u0438", "\u041f\u043e\u0434\u043f\u0438\u0441\u0438, \u043a\u043d\u043e\u043f\u043a\u0438 \u0438 \u0441\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0435 \u0442\u0435\u043a\u0441\u0442\u044b \u0432 \u043d\u0438\u0436\u043d\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0444\u043e\u0440\u043c\u044b.", row2b, row4, row5),
    createBuilderPanelSection("\u041f\u043e\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", "\u041f\u043b\u0435\u0439\u0441\u0445\u043e\u043b\u0434\u0435\u0440\u044b \u0438 \u0441\u0447\u0435\u0442\u0447\u0438\u043a\u0438 \u0434\u043b\u044f \u0438\u043c\u0435\u043d\u0438, \u0433\u0440\u0443\u043f\u043f\u044b \u0438 \u0441\u043e\u0441\u0442\u0430\u0432\u0430.", row3, participantsRow)
  );
  card.appendChild(sections);

  return card;
}

function renderOptionEditor(option, options, optionIndex, field) {
  const card = document.createElement("div");
  card.className = "builder-item builder-child builder-item-compact";

  const { header, handle, title, meta } = createBuilderHeader(
    option.label || `\u0412\u0430\u0440\u0438\u0430\u043d\u0442 ${optionIndex + 1}`,
    `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`,
    "\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044c \u0432\u0430\u0440\u0438\u0430\u043d\u0442"
  );
  card.appendChild(header);
  attachSortable(card, handle, options, optionIndex, "option", field.id);

  const row1 = document.createElement("div");
  row1.className = "builder-row builder-row-single";
  row1.append(
    createBuilderField("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", createTextInput(option.label || "", value => {
      option.label = value;
      title.textContent = text(option.label || `\u0412\u0430\u0440\u0438\u0430\u043d\u0442 ${optionIndex + 1}`);
      applySchemaChanges();
    })),
    createBuilderField("\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435", createTextarea(option.description || "", value => {
      option.description = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-option-meta";
  const optionValueInput = createCommittedTextInput(option.value || "", value => {
    option.value = value;
    meta.textContent = `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`;
  }, value => {
    option.value = value;
    meta.textContent = `\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435: ${option.value || "\u043d\u0435 \u0437\u0430\u0434\u0430\u043d\u043e"}`;
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  }, "text");
  optionValueInput.disabled = true;
  row2.append(
    createBuilderField("\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435", optionValueInput, "builder-group-compact"),
    createBuilderField("\u0424\u043e\u0442\u043e", createTextInput(option.image || "", value => {
      option.image = value;
      applySchemaChanges();
    }), "builder-group-compact"),
    createBuilderField("\u041b\u043e\u043a\u0430\u0446\u0438\u044f", createTextInput(option.mapUrl || "", value => {
      option.mapUrl = value;
      applySchemaChanges();
    }), "builder-group-compact"),
    createBuilderField("\u0426\u0435\u043d\u0430", createTextInput(option.price || 0, value => {
      option.price = Number(value) || 0;
      applySchemaChanges();
    }, "number"), "builder-group-compact"),
    createBuilderField("\u0422\u0438\u043f \u0446\u0435\u043d\u044b", createSelectInput(option.priceType || "fixed", [
      { value: "fixed", label: "\u0424\u0438\u043a\u0441\u0438\u0440." },
      { value: "perPerson", label: "\u041d\u0430 \u0447\u0435\u043b." }
    ], value => {
      option.priceType = value;
      applySchemaChanges();
    }), "builder-group-compact"),
    createBuilderField("\u041f\u0440\u043e\u043c\u043e", createTextInput(option.promoText || "", value => {
      option.promoText = value;
      applySchemaChanges();
    }), "builder-group-compact")
  );
  card.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "builder-row builder-row-2";
  row3.append(
    createBuilderField("\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435", createTextarea(option.details || "", value => {
      option.details = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0421\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0435 \u0444\u043b\u0430\u0433\u0438", (() => {
      const wrap = document.createElement("div");
      wrap.className = "builder-switches";
      wrap.append(
        createCheckbox("\u0412\u044b\u0431\u0440\u0430\u043d\u043e \u043f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e", option.defaultSelected, checked => {
          option.defaultSelected = checked;
          applySchemaChanges({ resetValues: true });
        }),
        createCheckbox("\u0417\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u043e", option.locked, checked => {
          option.locked = checked;
          applySchemaChanges({ resetValues: true });
        })
      );
      return wrap;
    })())
  );
  card.appendChild(row3);

  const actions = document.createElement("div");
  actions.className = "builder-inline-actions";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "button-secondary";
  removeBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u0430\u0440\u0438\u0430\u043d\u0442";
  removeBtn.addEventListener("click", () => {
    options.splice(optionIndex, 1);
    if (!options.length) {
      options.push(createOptionTemplate());
    }
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });

  actions.appendChild(removeBtn);
  card.appendChild(actions);
  return card;
}

function renderFieldEditor(field, fields, index) {
  const card = document.createElement("section");
  card.className = "builder-item";
  card.id = `builder-field-${field.id}`;

  const { header, handle, title, meta } = createBuilderHeader(
    field.label || `\u041f\u043e\u043b\u0435 ${index + 1}`,
    `\u041f\u043e\u043b\u0435 ${index + 1} \u2022 ID: ${field.id}`,
    "\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441"
  );
  card.appendChild(header);
  attachSortable(card, handle, fields, index, "field");

  const dependencyToggleRow = document.createElement("div");
  dependencyToggleRow.className = "builder-inline-actions";

  const dependencyToggle = document.createElement("button");
  dependencyToggle.type = "button";
  dependencyToggle.className = "button-secondary builder-dependency-toggle";
  dependencyToggle.textContent = isDependenciesCollapsed(field.id)
    ? `\u0417\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0438 \u0438 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u044c (${getDependencyRuleCount(field)})`
    : "\u0421\u043a\u0440\u044b\u0442\u044c \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u0438";
  dependencyToggle.addEventListener("click", () => {
    toggleDependenciesSection(field.id);
  });
  dependencyToggleRow.appendChild(dependencyToggle);
  card.appendChild(dependencyToggleRow);

  if (!isDependenciesCollapsed(field.id)) {
    card.appendChild(renderDependenciesSection(field));
  }

  const row1 = document.createElement("div");
  row1.className = "builder-row builder-row-2";
  row1.append(
    createBuilderField("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u0430", createTextInput(field.label || "", value => {
      field.label = value;
      title.textContent = text(field.label || `\u041f\u043e\u043b\u0435 ${index + 1}`);
      renderBuilderOutline();
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0430", createTextInput(field.hint || "", value => {
      field.hint = value;
      applySchemaChanges();
    }))
  );
  card.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "builder-row builder-row-field-meta";
  row2.append(
    createBuilderField("ID \u043f\u043e\u043b\u044f", createCommittedTextInput(field.id || "", value => {
      field.id = value;
      meta.textContent = `\u041f\u043e\u043b\u0435 ${index + 1} \u2022 ID: ${field.id || "\u0431\u0435\u0437 id"}`;
    }, value => {
      field.id = value || generateId("field");
      meta.textContent = `\u041f\u043e\u043b\u0435 ${index + 1} \u2022 ID: ${field.id}`;
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }), "builder-group-compact"),
    createBuilderField("\u0422\u0438\u043f", createSelectInput(field.type || "single", [
      { value: "single", label: "\u041e\u0434\u0438\u043d \u0432\u0430\u0440\u0438\u0430\u043d\u0442" },
      { value: "multi", label: "\u041d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u043e\u0432" },
      { value: "text", label: "\u0422\u0435\u043a\u0441\u0442" },
      { value: "date", label: "\u0414\u0430\u0442\u0430" }
    ], value => {
      field.type = value;
      if (value === "text" || value === "date") {
        delete field.options;
        field.appearance = "";
      } else if (!Array.isArray(field.options) || !field.options.length) {
        field.options = [createOptionTemplate()];
        }
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    }), "builder-group-compact"),
    createBuilderField("\u0412\u0438\u0434", (() => {
      const appearanceSelect = createSelectInput(field.appearance || "default", [
      { value: "default", label: "\u041e\u0431\u044b\u0447\u043d\u044b\u0439" },
      { value: "media-grid", label: "\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u0441 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435\u043c" },
      { value: "media-carousel", label: "\u041a\u0430\u0440\u0443\u0441\u0435\u043b\u044c \u0441 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f\u043c\u0438" }
    ], value => {
      field.appearance = value === "default" ? "" : value;
      applySchemaChanges({ rerenderBuilder: true });
    });
      if (field.type === "text" || field.type === "date") {
        appearanceSelect.value = "default";
        appearanceSelect.disabled = true;
      }
      return appearanceSelect;
    })(), "builder-group-compact"),
    createBuilderField("\u041f\u0440\u043e\u043c\u043e-\u0442\u0435\u0433", createTextInput(field.promoTag || "", value => {
      field.promoTag = value;
      applySchemaChanges();
    }), "builder-group-compact"),
    createBuilderField("\u041f\u0440\u043e\u043c\u043e-\u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a", createTextInput(field.promoTitle || "", value => {
      field.promoTitle = value;
      applySchemaChanges();
    }), "builder-group-compact")
  );
  card.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "builder-row builder-row-2";
  row3.append(
    createBuilderField("\u041f\u0440\u043e\u043c\u043e-\u043f\u043e\u0434\u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a", createTextarea(field.promoSubtitle || "", value => {
      field.promoSubtitle = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0424\u043b\u0430\u0433\u0438", (() => {
      const wrap = document.createElement("div");
      wrap.className = "builder-switches";
      wrap.append(
        createCheckbox("\u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043f\u043e\u043b\u0435", field.required, checked => {
          field.required = checked;
          applySchemaChanges({ resetValues: true });
        })
      );
      return wrap;
    })())
  );
  card.appendChild(row3);

  if (field.type !== "text" && field.type !== "date") {
    if (!Array.isArray(field.options) || !field.options.length) {
      field.options = [createOptionTemplate()];
    }

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "builder-list";
    field.options.forEach((option, optionIndex) => {
      optionsWrap.appendChild(renderOptionEditor(option, field.options, optionIndex, field));
    });
    card.appendChild(optionsWrap);

    const addOptionBtn = document.createElement("button");
    addOptionBtn.type = "button";
    addOptionBtn.className = "builder-add-option-btn";
    addOptionBtn.textContent = "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432\u0430\u0440\u0438\u0430\u043d\u0442";
    addOptionBtn.addEventListener("click", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      field.options.push(createOptionTemplate());
      applySchemaChanges({ resetValues: true, rerenderBuilder: true });
    });
    card.appendChild(addOptionBtn);
  }

  const fieldActions = document.createElement("div");
  fieldActions.className = "builder-field-actions";

  const duplicateBtn = document.createElement("button");
  duplicateBtn.type = "button";
  duplicateBtn.className = "button-secondary";
  duplicateBtn.textContent = "\u0414\u0443\u0431\u043b\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u043b\u0435";
  duplicateBtn.addEventListener("click", () => {
    fields.splice(index + 1, 0, cloneFieldForInsert(field));
    applySchemaChanges({ resetValues: true, rerenderBuilder: true });
  });

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "button-secondary";
  removeBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u043b\u0435";
  removeBtn.addEventListener("click", () => {
    removeFieldAt(index);
  });

  fieldActions.append(duplicateBtn, removeBtn);
  card.appendChild(fieldActions);
  return card;
}
function renderUiConfigEditor() {
  const card = document.createElement("section");
  card.className = "builder-item builder-editor-card builder-settings-card";
  card.id = "builder-section-ui";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0444\u043e\u0440\u043c\u044b";
  card.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint builder-editor-note";
  note.textContent = "\u0417\u0434\u0435\u0441\u044c \u043c\u0435\u043d\u044f\u044e\u0442\u0441\u044f \u0442\u0435\u043a\u0441\u0442\u044b hero-\u0431\u043b\u043e\u043a\u0430, \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0445 \u043f\u043e\u043b\u0435\u0439 \u0438 \u043a\u043d\u043e\u043f\u043e\u043a \u0444\u043e\u0440\u043c\u044b.";
  card.appendChild(note);

  const sections = document.createElement("div");
  sections.className = "builder-panel-sections";

  const formMetaRow = document.createElement("div");
  formMetaRow.className = "builder-row builder-row-2";
  formMetaRow.append(
    createBuilderField("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0444\u043e\u0440\u043c\u044b", createTextInput(state.builder.selectedFormTitle || "", value => {
      state.builder.selectedFormTitle = value;
    })),
    createBuilderField("\u0410\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b", createTextInput(state.builder.selectedFormSlug || "", value => {
      state.builder.selectedFormSlug = slugifyFormValue(value);
    }))
  );

  const formDangerRow = document.createElement("div");
  formDangerRow.className = "builder-panel-actions";
  const deleteFormBtn = document.createElement("button");
  deleteFormBtn.type = "button";
  deleteFormBtn.className = "button-secondary";
  deleteFormBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0444\u043e\u0440\u043c\u0443";
  deleteFormBtn.disabled = !getSelectedBuilderFormRecord();
  deleteFormBtn.addEventListener("click", () => {
    const selectedForm = getSelectedBuilderFormRecord();
    if (selectedForm) {
      deleteBuilderForm(selectedForm);
    }
  });
  formDangerRow.appendChild(deleteFormBtn);

  const heroRow = document.createElement("div");
  heroRow.className = "builder-row builder-row-3";
  heroRow.append(
    createBuilderField("\u0412\u0435\u0440\u0445\u043d\u044f\u044f \u043b\u0435\u043d\u0442\u0430", createTextInput(state.uiConfig.heroRibbonTopText || "", value => {
      state.uiConfig.heroRibbonTopText = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043b\u0430\u0448\u043a\u0430 hero", createTextInput(state.uiConfig.heroKicker || "", value => {
      state.uiConfig.heroKicker = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0411\u0435\u0439\u0434\u0436 hero", createTextInput(state.uiConfig.heroBadge || "", value => {
      state.uiConfig.heroBadge = value;
      applySchemaChanges();
    }))
  );

  const heroMetaRow = document.createElement("div");
  heroMetaRow.className = "builder-row builder-row-2";
  heroMetaRow.append(
    createBuilderField("\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u0430", createTextInput(state.uiConfig.heroNote || "", value => {
      state.uiConfig.heroNote = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041d\u0438\u0436\u043d\u044f\u044f \u043b\u0435\u043d\u0442\u0430", createTextInput(state.uiConfig.heroRibbonText || "", value => {
      state.uiConfig.heroRibbonText = value;
      applySchemaChanges();
    }))
  );

  const heroTextRow = document.createElement("div");
  heroTextRow.className = "builder-row";
  heroTextRow.append(
    createBuilderField("\u0413\u043b\u0430\u0432\u043d\u044b\u0439 \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a", createTextarea(state.uiConfig.heroHeadline || "", value => {
      state.uiConfig.heroHeadline = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043e\u0434\u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a", createTextarea(state.uiConfig.heroSubline || "", value => {
      state.uiConfig.heroSubline = value;
      applySchemaChanges();
    }))
  );

  const heroRibbonRow = document.createElement("div");
  heroRibbonRow.className = "builder-row";
  heroRibbonRow.append(
    createBuilderField("\u041d\u0430\u0434\u043f\u0438\u0441\u044c \u043d\u0430 \u043d\u0438\u0436\u043d\u0435\u0439 \u043b\u0435\u043d\u0442\u0435", createTextInput(state.uiConfig.heroRibbonText || "", value => {
      state.uiConfig.heroRibbonText = value;
      applySchemaChanges();
    }))
  );

  const userRow = document.createElement("div");
  userRow.className = "builder-row builder-row-3";
  userRow.append(
    createBuilderField("\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0431\u043b\u043e\u043a\u0430", createTextInput(state.uiConfig.userSectionTitle || "", value => {
      state.uiConfig.userSectionTitle = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043b\u0435\u0439\u0441\u0445\u043e\u043b\u0434\u0435\u0440 \u0424\u0418\u041e", createTextInput(state.uiConfig.namePlaceholder || "", value => {
      state.uiConfig.namePlaceholder = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043b\u0435\u0439\u0441\u0445\u043e\u043b\u0434\u0435\u0440 \u0433\u0440\u0443\u043f\u043f\u044b", createTextInput(state.uiConfig.groupPlaceholder || "", value => {
      state.uiConfig.groupPlaceholder = value;
      applySchemaChanges();
    }))
  );

  const userHintRow = document.createElement("div");
  userHintRow.className = "builder-row";
  userHintRow.append(
    createBuilderField("\u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0430 \u0431\u043b\u043e\u043a\u0430 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", createTextarea(state.uiConfig.userSectionHint || "", value => {
      state.uiConfig.userSectionHint = value;
      applySchemaChanges();
    }))
  );

  const countRow = document.createElement("div");
  countRow.className = "builder-row builder-row-2";
  countRow.append(
    createBuilderField("\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u043d\u0430 \u0441\u0430\u0439\u0442\u0435", createTextInput(state.uiConfig.displayParticipantsCount || getDisplayParticipantCount(), value => {
      state.uiConfig.displayParticipantsCount = Math.max(1, Number(value) || CONFIG.participants);
      applySchemaChanges();
    }, "number")),
    createBuilderField("\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u0434\u043b\u044f \u0446\u0435\u043d\u044b", createTextInput(state.uiConfig.pricingParticipantsCount || state.uiConfig.participantsCount || getPricingParticipantCount(), value => {
      const normalized = Math.max(1, Number(value) || CONFIG.participants);
      state.uiConfig.pricingParticipantsCount = normalized;
      state.uiConfig.participantsCount = normalized;
      applySchemaChanges();
    }, "number"))
  );

  const labelsRow = document.createElement("div");
  labelsRow.className = "builder-row builder-row-3";
  labelsRow.append(
    createBuilderField("\u0421\u0447\u0435\u0442\u0447\u0438\u043a \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432", createTextInput(state.uiConfig.participantsStatLabel || "", value => {
      state.uiConfig.participantsStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u0421\u0447\u0435\u0442\u0447\u0438\u043a \u043e\u0442\u0432\u0435\u0442\u043e\u0432", createTextInput(state.uiConfig.responsesStatLabel || "", value => {
      state.uiConfig.responsesStatLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u0446\u0435\u043d\u044b", createTextInput(state.uiConfig.ticketLabel || "", value => {
      state.uiConfig.ticketLabel = value;
      applySchemaChanges();
    }))
  );

  const buttonRow = document.createElement("div");
  buttonRow.className = "builder-row builder-row-3";
  buttonRow.append(
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u0438\u0442\u043e\u0433\u0430", createTextInput(state.uiConfig.detailsButtonLabel || "", value => {
      state.uiConfig.detailsButtonLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438", createTextInput(state.uiConfig.saveButtonLabel || "", value => {
      state.uiConfig.saveButtonLabel = value;
      applySchemaChanges();
    })),
    createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e\u0439 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438", createTextInput(state.uiConfig.resubmitButtonLabel || "", value => {
      state.uiConfig.resubmitButtonLabel = value;
      applySchemaChanges();
    }))
  );

  const draftRow = document.createElement("div");
  draftRow.className = "builder-row";
  draftRow.append(
    createBuilderField("\u0422\u0435\u043a\u0441\u0442 \u043f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438", createTextarea(state.uiConfig.draftStatusText || "", value => {
      state.uiConfig.draftStatusText = value;
      applySchemaChanges();
    }))
  );

  sections.append(
    createBuilderPanelSection("\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u0444\u043e\u0440\u043c\u044b", "\u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0444\u043e\u0440\u043c\u044b \u0438 \u0435\u0435 \u0430\u0434\u0440\u0435\u0441 \u0434\u043b\u044f \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u043e\u0439 \u0441\u0441\u044b\u043b\u043a\u0438.", formMetaRow, formDangerRow),
    createBuilderPanelSection("Hero \u0438 \u0432\u0435\u0440\u0445 \u0444\u043e\u0440\u043c\u044b", "\u041a\u0440\u0443\u043f\u043d\u044b\u0435 \u0442\u0435\u043a\u0441\u0442\u044b \u0438 \u043f\u0440\u043e\u0434\u0430\u044e\u0449\u0438\u0435 \u043f\u043e\u0434\u043f\u0438\u0441\u0438 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u044d\u043a\u0440\u0430\u043d\u0430.", heroRow, heroMetaRow, heroTextRow, heroRibbonRow),
    createBuilderPanelSection("\u041f\u043e\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", "\u041f\u043e\u0434\u043f\u0438\u0441\u0438 \u0438 \u0442\u0435\u043a\u0441\u0442\u044b \u0431\u043b\u043e\u043a\u0430 \u0441 \u0438\u043c\u0435\u043d\u0435\u043c \u0438 \u0433\u0440\u0443\u043f\u043f\u043e\u0439.", userRow, userHintRow, countRow),
    createBuilderPanelSection("\u041f\u043e\u0434\u043f\u0438\u0441\u0438 \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f", "\u041a\u043d\u043e\u043f\u043a\u0438, \u0441\u0447\u0435\u0442\u0447\u0438\u043a\u0438 \u0438 \u0442\u0435\u043a\u0441\u0442 \u043f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438.", labelsRow, buttonRow, draftRow)
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
  title.textContent = "\u0422\u0435\u043c\u0430 \u0438 \u0446\u0432\u0435\u0442\u0430";
  card.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint builder-editor-note";
  note.textContent = state.builder.themeMode === "basic"
    ? "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u043e\u0442\u043e\u0432\u0443\u044e \u043f\u0430\u043b\u0438\u0442\u0440\u0443 \u0438\u043b\u0438 \u043f\u043e\u0434\u043a\u0440\u0443\u0442\u0438\u0442\u0435 \u0441\u0430\u043c\u044b\u0435 \u0432\u0430\u0436\u043d\u044b\u0435 \u0430\u043a\u0446\u0435\u043d\u0442\u044b."
    : "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c \u0434\u0430\u0435\u0442 \u0442\u043e\u0447\u043d\u0443\u044e \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0443 \u0432\u0441\u0435\u0445 \u0446\u0432\u0435\u0442\u043e\u0432.";
  card.appendChild(note);

  const modeRow = document.createElement("div");
  modeRow.className = "builder-theme-mode";
  [
    { value: "basic", label: "\u0411\u0430\u0437\u043e\u0432\u044b\u0439" },
    { value: "advanced", label: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0439" }
  ].forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button-secondary${state.builder.themeMode === item.value ? " builder-theme-mode-active" : ""}`;
    button.textContent = item.label;
    button.addEventListener("click", () => {
      state.builder.themeMode = item.value;
      renderBuilder();
    });
    modeRow.appendChild(button);
  });
  card.appendChild(modeRow);

  const sections = document.createElement("div");
  sections.className = "builder-panel-sections";

  if (state.builder.themeMode === "basic") {
    const presetsWrap = document.createElement("div");
    presetsWrap.className = "builder-theme-presets";
    [
      {
        name: "\u0411\u0430\u0437\u043e\u0432\u0430\u044f",
        values: { heroAccent: "#d9ff3f", buttonPrimaryStart: "#0f766e", buttonPrimaryEnd: "#059669", pageBgStart: "#0f1013", pageBgMid: "#262b34", pageBgEnd: "#121519", pageGlowPrimary: "#ddff00", pageGlowSecondary: "#ff3a3a" }
      },
      {
        name: "\u041e\u043b\u0438\u0432\u043a\u0430",
        values: { heroAccent: "#d7ff39", buttonPrimaryStart: "#15803d", buttonPrimaryEnd: "#16a34a", pageBgStart: "#13150f", pageBgMid: "#27281d", pageBgEnd: "#171810", pageGlowPrimary: "#d7ff39", pageGlowSecondary: "#95c11f" }
      },
      {
        name: "\u041d\u043e\u0447\u043d\u0430\u044f",
        values: { heroAccent: "#7cf5ff", buttonPrimaryStart: "#2563eb", buttonPrimaryEnd: "#0ea5e9", pageBgStart: "#0d1320", pageBgMid: "#1c2434", pageBgEnd: "#101822", pageGlowPrimary: "#38bdf8", pageGlowSecondary: "#6366f1" }
      },
      {
        name: "\u0422\u0435\u043f\u043b\u0430\u044f",
        values: { heroAccent: "#ffd166", buttonPrimaryStart: "#ef4444", buttonPrimaryEnd: "#f97316", pageBgStart: "#1f1311", pageBgMid: "#2b1f1c", pageBgEnd: "#1a1210", pageGlowPrimary: "#f97316", pageGlowSecondary: "#ef4444" }
      },
      {
        name: "\u0424\u0438\u043e\u043b\u0435\u0442",
        values: { heroAccent: "#c4b5fd", buttonPrimaryStart: "#7c3aed", buttonPrimaryEnd: "#a855f7", pageBgStart: "#161221", pageBgMid: "#241f36", pageBgEnd: "#171223", pageGlowPrimary: "#8b5cf6", pageGlowSecondary: "#ec4899" }
      },
      {
        name: "\u041c\u043e\u0440\u0441\u043a\u0430\u044f",
        values: { heroAccent: "#67e8f9", buttonPrimaryStart: "#0f766e", buttonPrimaryEnd: "#0891b2", pageBgStart: "#0e1a1d", pageBgMid: "#182a30", pageBgEnd: "#10191b", pageGlowPrimary: "#06b6d4", pageGlowSecondary: "#14b8a6" }
      },
      {
        name: "\u041c\u0438\u043d\u0438\u043c\u0430\u043b",
        values: { heroAccent: "#f8fafc", buttonPrimaryStart: "#475569", buttonPrimaryEnd: "#334155", pageBgStart: "#121418", pageBgMid: "#1f232b", pageBgEnd: "#15181d", pageGlowPrimary: "#94a3b8", pageGlowSecondary: "#64748b" }
      }
    ].forEach(preset => {
      const presetBtn = document.createElement("button");
      presetBtn.type = "button";
      presetBtn.className = "builder-theme-preset";
      presetBtn.innerHTML = `<span class="builder-theme-preset-swatches"><span style="background:${preset.values.heroAccent}"></span><span style="background:${preset.values.buttonPrimaryStart}"></span><span style="background:${preset.values.pageBgMid}"></span></span><span>${preset.name}</span>`;
      presetBtn.addEventListener("click", () => {
        Object.assign(state.uiConfig, preset.values);
        applySchemaChanges();
        renderBuilder();
      });
      presetsWrap.appendChild(presetBtn);
    });

    const quickRow = document.createElement("div");
    quickRow.className = "builder-row builder-row-3";
    quickRow.append(
      createBuilderField("\u0410\u043a\u0446\u0435\u043d\u0442", createColorInput(getThemeColorValue(cfg, "heroAccent", "--hero-accent", "#d9ff3f"), value => {
        state.uiConfig.heroAccent = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u043a\u043d\u043e\u043f\u043a\u0430", createColorInput(getThemeColorValue(cfg, "buttonPrimaryStart", "--button-primary-start", "#0f766e"), value => {
        state.uiConfig.buttonPrimaryStart = value;
        state.uiConfig.buttonPrimaryEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0424\u043e\u043d", createColorInput(getThemeColorValue(cfg, "pageBgMid", "--page-bg-mid", "#262b34"), value => {
        state.uiConfig.pageBgMid = value;
        applySchemaChanges();
      }))
    );

    sections.append(
      createBuilderPanelSection("\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u0432\u044b\u0431\u043e\u0440", "\u041f\u0440\u0435\u0441\u0435\u0442\u044b \u0434\u043b\u044f \u0440\u044f\u0434\u043e\u0432\u043e\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.", presetsWrap),
      createBuilderPanelSection("\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u0446\u0432\u0435\u0442\u0430", "\u041c\u0438\u043d\u0438\u043c\u0443\u043c \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043a \u0431\u0435\u0437 \u043f\u0435\u0440\u0435\u0433\u0440\u0443\u0437\u0430.", quickRow)
    );
  } else {
    const row1 = document.createElement("div");
    row1.className = "builder-row builder-row-3";
    row1.append(
      createBuilderField("\u0424\u043e\u043d: \u0441\u0432\u0435\u0447\u0435\u043d\u0438\u0435 1", createColorInput(getThemeColorValue(cfg, "pageGlowPrimary", "--page-glow-primary", "#ddff00"), value => {
        state.uiConfig.pageGlowPrimary = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0424\u043e\u043d: \u0441\u0432\u0435\u0447\u0435\u043d\u0438\u0435 2", createColorInput(getThemeColorValue(cfg, "pageGlowSecondary", "--page-glow-secondary", "#ff3a3a"), value => {
        state.uiConfig.pageGlowSecondary = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0424\u043e\u043d \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b: \u0441\u0442\u0430\u0440\u0442", createColorInput(getThemeColorValue(cfg, "pageBgStart", "--page-bg-start", "#0f1013"), value => {
        state.uiConfig.pageBgStart = value;
        applySchemaChanges();
      }))
    );
    const row2 = document.createElement("div");
    row2.className = "builder-row builder-row-3";
    row2.append(
      createBuilderField("\u0424\u043e\u043d \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b: \u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0430", createColorInput(getThemeColorValue(cfg, "pageBgMid", "--page-bg-mid", "#262b34"), value => {
        state.uiConfig.pageBgMid = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0424\u043e\u043d \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b: \u043a\u043e\u043d\u0435\u0446", createColorInput(getThemeColorValue(cfg, "pageBgEnd", "--page-bg-end", "#121519"), value => {
        state.uiConfig.pageBgEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("Hero: \u0430\u043a\u0446\u0435\u043d\u0442", createColorInput(getThemeColorValue(cfg, "heroAccent", "--hero-accent", "#d9ff3f"), value => {
        state.uiConfig.heroAccent = value;
        applySchemaChanges();
      }))
    );
    const row3 = document.createElement("div");
    row3.className = "builder-row builder-row-3";
    row3.append(
      createBuilderField("Hero: \u0444\u043e\u043d \u0441\u0432\u0435\u0440\u0445\u0443", createColorInput(getThemeColorValue(cfg, "heroSurfaceStart", "--hero-surface-start", "#0b0c10"), value => {
        state.uiConfig.heroSurfaceStart = value;
        applySchemaChanges();
      })),
      createBuilderField("Hero: \u0444\u043e\u043d \u0441\u043d\u0438\u0437\u0443", createColorInput(getThemeColorValue(cfg, "heroSurfaceEnd", "--hero-surface-end", "#111217"), value => {
        state.uiConfig.heroSurfaceEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438: \u0444\u043e\u043d \u0441\u0432\u0435\u0440\u0445\u0443", createColorInput(getThemeColorValue(cfg, "surfaceStart", "--surface-start", "#121318"), value => {
        state.uiConfig.surfaceStart = value;
        applySchemaChanges();
      }))
    );
    const row4 = document.createElement("div");
    row4.className = "builder-row builder-row-3";
    row4.append(
      createBuilderField("\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438: \u0444\u043e\u043d \u0441\u043d\u0438\u0437\u0443", createColorInput(getThemeColorValue(cfg, "surfaceEnd", "--surface-end", "#1a1c22"), value => {
        state.uiConfig.surfaceEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438: \u0442\u0435\u043a\u0441\u0442", createColorInput(getThemeColorValue(cfg, "surfaceText", "--surface-text", "#f6f8f1"), value => {
        state.uiConfig.surfaceText = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438: \u043e\u0431\u0432\u043e\u0434\u043a\u0430", createColorInput(getThemeColorValue(cfg, "surfaceBorder", "--surface-border", "#444444"), value => {
        state.uiConfig.surfaceBorder = value;
        applySchemaChanges();
      }))
    );
    const row5 = document.createElement("div");
    row5.className = "builder-row builder-row-3";
    row5.append(
      createBuilderField("\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u043a\u043d\u043e\u043f\u043a\u0430: \u0441\u0442\u0430\u0440\u0442", createColorInput(getThemeColorValue(cfg, "buttonPrimaryStart", "--button-primary-start", "#0f766e"), value => {
        state.uiConfig.buttonPrimaryStart = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u043a\u043d\u043e\u043f\u043a\u0430: \u043a\u043e\u043d\u0435\u0446", createColorInput(getThemeColorValue(cfg, "buttonPrimaryEnd", "--button-primary-end", "#059669"), value => {
        state.uiConfig.buttonPrimaryEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u0438\u0442\u043e\u0433\u0430: \u0441\u0442\u0430\u0440\u0442", createColorInput(getThemeColorValue(cfg, "buttonDetailsStart", "--button-details-start", "#475569"), value => {
        state.uiConfig.buttonDetailsStart = value;
        applySchemaChanges();
      }))
    );
    const row6 = document.createElement("div");
    row6.className = "builder-row builder-row-3";
    row6.append(
      createBuilderField("\u041a\u043d\u043e\u043f\u043a\u0430 \u0438\u0442\u043e\u0433\u0430: \u043a\u043e\u043d\u0435\u0446", createColorInput(getThemeColorValue(cfg, "buttonDetailsEnd", "--button-details-end", "#334155"), value => {
        state.uiConfig.buttonDetailsEnd = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0412\u0442\u043e\u0440\u0438\u0447\u043d\u0430\u044f \u043a\u043d\u043e\u043f\u043a\u0430: \u0444\u043e\u043d", createColorInput(getThemeColorValue(cfg, "buttonSecondaryBg", "--button-secondary-bg", "#e5e7eb"), value => {
        state.uiConfig.buttonSecondaryBg = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0412\u0442\u043e\u0440\u0438\u0447\u043d\u0430\u044f \u043a\u043d\u043e\u043f\u043a\u0430: \u0442\u0435\u043a\u0441\u0442", createColorInput(getThemeColorValue(cfg, "buttonSecondaryText", "--button-secondary-text", "#1f2937"), value => {
        state.uiConfig.buttonSecondaryText = value;
        applySchemaChanges();
      }))
    );
    const row7 = document.createElement("div");
    row7.className = "builder-row builder-row-2";
    row7.append(
      createBuilderField("\u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u0438\u0442\u043e\u0433\u043e\u0432: \u0432\u0435\u0440\u0445", createColorInput(getThemeColorValue(cfg, "checkTableStart", "--check-table-start", "#161920"), value => {
        state.uiConfig.checkTableStart = value;
        applySchemaChanges();
      })),
      createBuilderField("\u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u0438\u0442\u043e\u0433\u043e\u0432: \u043d\u0438\u0437", createColorInput(getThemeColorValue(cfg, "checkTableEnd", "--check-table-end", "#0f1218"), value => {
        state.uiConfig.checkTableEnd = value;
        applySchemaChanges();
      }))
    );
    sections.append(
      createBuilderPanelSection("\u0424\u043e\u043d \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b", "\u0421\u0432\u0435\u0447\u0435\u043d\u0438\u0435 \u0438 \u043e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u0433\u0440\u0430\u0434\u0438\u0435\u043d\u0442 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b.", row1, row2),
      createBuilderPanelSection("Hero \u0438 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438", "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 hero-\u0431\u043b\u043e\u043a\u0430 \u0438 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u043e\u0432.", row3, row4),
      createBuilderPanelSection("\u041a\u043d\u043e\u043f\u043a\u0438 \u0438 \u0442\u0430\u0431\u043b\u0438\u0446\u0430 \u0438\u0442\u043e\u0433\u043e\u0432", "\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 CTA \u0438 \u0442\u0430\u0431\u043b\u0438\u0446\u0430 \u0440\u0430\u0441\u0447\u0435\u0442\u0430 \u0438\u0442\u043e\u0433\u043e\u0432.", row5, row6, row7)
    );
  }

  card.appendChild(sections);
  return card;
}

function renderResponsesPanel() {
  const section = document.createElement("section");
  section.className = "builder-item";
  section.id = "builder-section-responses";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "\u041e\u0442\u0432\u0435\u0442\u044b";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0445 \u043e\u0442\u0432\u0435\u0442\u043e\u0432 \u043f\u043e \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u0444\u043e\u0440\u043c\u0435. \u0414\u043b\u044f Excel \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u044d\u043a\u0441\u043f\u043e\u0440\u0442.";
  section.appendChild(note);

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "button-secondary";
  refreshBtn.textContent = state.builder.responses.loading ? "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435..." : "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442\u044b";
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
  exportBtn.textContent = "\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0442\u0430\u0431\u043b\u0438\u0446\u0443";
  exportBtn.disabled = state.builder.responses.loading || !state.builder.responses.rows.length;
  exportBtn.addEventListener("click", exportResponsesToExcel);
  actions.appendChild(exportBtn);

  const deleteSelectedBtn = document.createElement("button");
  deleteSelectedBtn.type = "button";
  deleteSelectedBtn.className = "button-secondary";
  deleteSelectedBtn.textContent = `\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435${state.builder.responses.selectedKeys.length ? ` (${state.builder.responses.selectedKeys.length})` : ""}`;
  deleteSelectedBtn.disabled = state.builder.responses.loading || !state.builder.responses.selectedKeys.length;
  deleteSelectedBtn.addEventListener("click", deleteSelectedResponses);
  actions.appendChild(deleteSelectedBtn);

  section.appendChild(actions);

  if (!state.builder.responses.headers.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = state.builder.responses.loading
      ? "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043e\u0442\u0432\u0435\u0442\u044b..."
      : "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f.";
    section.appendChild(empty);
    return section;
  }

  const summary = renderResponsesSummary(
    state.builder.responses.headers,
    state.builder.responses.rows
  );
  if (summary) {
    section.appendChild(summary);
  }

  const wrap = document.createElement("div");
  wrap.className = "builder-table-wrap";

  const table = document.createElement("table");
  table.className = "builder-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const selectedCount = state.builder.responses.selectedKeys.length;
  const allKeys = state.builder.responses.records.map(record => cleanString(record?.submissionKey)).filter(Boolean);
  const allSelected = Boolean(allKeys.length) && allKeys.every(key => state.builder.responses.selectedKeys.includes(key));

  const selectHeader = document.createElement("th");
  const selectAll = document.createElement("input");
  selectAll.type = "checkbox";
  selectAll.checked = allSelected;
  selectAll.indeterminate = selectedCount > 0 && !allSelected;
  selectAll.disabled = state.builder.responses.loading || !allKeys.length;
  selectAll.addEventListener("change", event => {
    toggleAllResponsesSelection(event.target.checked);
    renderBuilder();
  });
  selectHeader.appendChild(selectAll);
  headRow.appendChild(selectHeader);

  state.builder.responses.headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = getResponsesHeaderLabel(header);
    headRow.appendChild(th);
  });
  const actionsHeader = document.createElement("th");
  actionsHeader.textContent = "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f";
  headRow.appendChild(actionsHeader);
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  state.builder.responses.rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const submissionKey = cleanString(state.builder.responses.records[index]?.submissionKey || "");

    const selectTd = document.createElement("td");
    const selectRow = document.createElement("input");
    selectRow.type = "checkbox";
    selectRow.checked = state.builder.responses.selectedKeys.includes(submissionKey);
    selectRow.disabled = state.builder.responses.loading || !submissionKey;
    selectRow.addEventListener("change", event => {
      toggleResponseSelection(submissionKey, event.target.checked);
      renderBuilder();
    });
    selectTd.appendChild(selectRow);
    tr.appendChild(selectTd);

    row.forEach(cell => {
      const td = document.createElement("td");
      const headerKey = String(state.builder.responses.headers[tr.children.length - 1] || "");
      td.textContent = /updatedat/i.test(headerKey)
        ? formatBuilderDate(cell)
        : text(String(cell ?? ""));
      tr.appendChild(td);
    });
    const actionTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button-secondary builder-row-delete";
    removeBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c";
    removeBtn.disabled = state.builder.responses.loading || !submissionKey;
    removeBtn.addEventListener("click", () => {
      if (window.confirm("\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u043e\u0442\u0432\u0435\u0442? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.")) {
        deleteResponseRow(submissionKey);
      }
    });
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  section.appendChild(wrap);

  return section;
}

function buildResponsesSummaryData(headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows) || !headers.length || !rows.length) {
    return null;
  }

  const updatedAtIndex = headers.findIndex(header => /updatedat/i.test(String(header || "")));
  const firstDynamicIndex = Math.min(4, headers.length);
  const topAnswers = [];

  for (let index = firstDynamicIndex; index < headers.length; index += 1) {
    const counts = new Map();
    rows.forEach(row => {
      const value = cleanString(row?.[index] ?? "").trim();
      if (!value) {
        return;
      }
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    if (!counts.size) {
      continue;
    }

    const [topValue, topCount] = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0];
    topAnswers.push({
      label: getResponsesHeaderLabel(headers[index] || ""),
      value: text(topValue),
      count: topCount
    });
  }

  return {
    total: rows.length,
    lastUpdated: updatedAtIndex >= 0 ? formatBuilderDate(rows[0]?.[updatedAtIndex] || "") : "",
    highlights: topAnswers.slice(0, 3)
  };
}

function renderResponsesSummary(headers, rows) {
  const summary = buildResponsesSummaryData(headers, rows);
  if (!summary) {
    return null;
  }

  const wrap = document.createElement("div");
  wrap.className = "builder-responses-summary";

  const metricTotal = document.createElement("div");
  metricTotal.className = "builder-responses-summary-card";
  const totalLabel = document.createElement("span");
  totalLabel.className = "builder-responses-summary-label";
  totalLabel.textContent = "\u041e\u0442\u0432\u0435\u0442\u043e\u0432";
  const totalValue = document.createElement("strong");
  totalValue.className = "builder-responses-summary-value";
  totalValue.textContent = String(summary.total);
  metricTotal.append(totalLabel, totalValue);
  wrap.appendChild(metricTotal);

  if (summary.lastUpdated) {
    const metricUpdated = document.createElement("div");
    metricUpdated.className = "builder-responses-summary-card";
    const updatedLabel = document.createElement("span");
    updatedLabel.className = "builder-responses-summary-label";
    updatedLabel.textContent = "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u043e\u0442\u0432\u0435\u0442";
    const updatedValue = document.createElement("strong");
    updatedValue.className = "builder-responses-summary-value";
    updatedValue.textContent = text(summary.lastUpdated);
    metricUpdated.append(updatedLabel, updatedValue);
    wrap.appendChild(metricUpdated);
  }

  summary.highlights.forEach(item => {
    const card = document.createElement("div");
    card.className = "builder-responses-summary-card";
    card.dataset.kind = "answer";

    const label = document.createElement("span");
    label.className = "builder-responses-summary-label";
    label.textContent = item.label;

    const value = document.createElement("strong");
    value.className = "builder-responses-summary-value";
    value.textContent = item.value;

    const meta = document.createElement("span");
    meta.className = "builder-responses-summary-meta";
    meta.textContent = `\u0412\u044b\u0431\u043e\u0440\u043e\u0432: ${item.count}`;

    card.append(label, value, meta);
    wrap.appendChild(card);
  });

  return wrap;
}

function renderPermissionsPanel() {
  const section = document.createElement("section");
  section.className = "builder-item builder-editor-card";
  section.id = "builder-section-permissions";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "\u041f\u0440\u0430\u0432\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "\u0414\u0435\u043b\u0438\u0442\u0435\u0441\u044c \u0434\u043e\u0441\u0442\u0443\u043f\u043e\u043c \u043a \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u0443 \u0438 \u043d\u0430\u0437\u043d\u0430\u0447\u0430\u0439\u0442\u0435 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u043f\u0440\u0430\u0432 \u0434\u043b\u044f \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.";
  section.appendChild(note);

  const inviteRow = document.createElement("div");
  inviteRow.className = "builder-row builder-row-3";
  inviteRow.append(
    createBuilderField("Email", createTextInput(state.builder.members.draftEmail || "", value => {
      state.builder.members.draftEmail = value;
    })),
    createBuilderField("\u0420\u043e\u043b\u044c", createSelectInput(state.builder.members.draftRole || "editor", getAssignableRoleChoices(), value => {
      state.builder.members.draftRole = value;
    })),
    createBuilderField("\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435", (() => {
      const wrap = document.createElement("div");
      wrap.className = "builder-inline-actions";
      const inviteBtn = document.createElement("button");
      inviteBtn.type = "button";
      inviteBtn.className = "builder-primary-action";
      inviteBtn.textContent = "\u0412\u044b\u0434\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f";
      inviteBtn.addEventListener("click", inviteBuilderMember);
      wrap.appendChild(inviteBtn);
      return wrap;
    })())
  );
  section.appendChild(inviteRow);

  if (state.builder.members.error) {
    const error = document.createElement("p");
    error.className = "error-text";
    error.textContent = state.builder.members.error;
    section.appendChild(error);
  }

  if (state.builder.members.loading) {
    const loading = document.createElement("p");
    loading.className = "field-hint";
    loading.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043f\u0440\u0430\u0432\u0430...";
    section.appendChild(loading);
    return section;
  }

  const list = document.createElement("div");
  list.className = "builder-forms-list";

  if (!state.builder.members.items.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "\u0423 \u044d\u0442\u043e\u0439 \u0444\u043e\u0440\u043c\u044b \u043f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0434\u0440\u0443\u0433\u0438\u0445 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432.";
    list.appendChild(empty);
  } else {
    state.builder.members.items.forEach(member => {
      const card = document.createElement("div");
      card.className = "builder-form-card";

      const head = document.createElement("div");
      head.className = "builder-form-card-head";

      const info = document.createElement("div");
      info.className = "builder-heading";

      const memberTitle = document.createElement("h4");
      memberTitle.className = "builder-form-card-title";
      memberTitle.textContent = cleanString(member.email || member.userId || "\u0411\u0435\u0437 email");

      const meta = document.createElement("div");
      meta.className = "builder-form-card-meta";
      meta.textContent = `user: ${cleanString(member.userId || "\u2014")}`;
      info.append(memberTitle, meta);
      head.appendChild(info);

      const roleBadge = document.createElement("span");
      roleBadge.className = `builder-role-badge builder-role-${cleanString(member.role || "viewer").toLowerCase()}`;
      roleBadge.textContent = getRoleLabel(member.role);
      head.appendChild(roleBadge);
      card.appendChild(head);

      const actions = document.createElement("div");
      actions.className = "builder-form-card-actions";

      const roleSelect = createSelectInput(cleanString(member.role || "viewer"), getAssignableRoleChoices(), value => {
        updateBuilderMemberRole(member, value);
      });
      actions.appendChild(roleSelect);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "button-secondary";
      removeBtn.textContent = "\u0423\u0431\u0440\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f";
      removeBtn.disabled = cleanString(member.role) === "owner";
      removeBtn.addEventListener("click", () => {
        removeBuilderMember(member);
      });
      actions.appendChild(removeBtn);

      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  section.appendChild(list);
  return section;
}

function renderBuilderOutline() {
  if (!ui.builderOutline) {
    return;
  }

  ui.builderOutline.innerHTML = "";

  if (state.builder.activeTab !== "constructor") {
    return;
  }

  const topItem = document.createElement("div");
  topItem.className = "builder-outline-item";

  const topLink = document.createElement("button");
  topLink.type = "button";
  topLink.className = "builder-outline-link";
  topLink.textContent = "\u0412\u0435\u0440\u0445 \u0444\u043e\u0440\u043c\u044b";
  topLink.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  topItem.appendChild(topLink);
  ui.builderOutline.appendChild(topItem);

  getFields().forEach((field, index) => {
    const item = document.createElement("div");
    item.className = "builder-outline-item";

    const handle = createDragHandle("\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441");
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
    removeBtn.textContent = "x";
    removeBtn.title = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441";
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

  const hasActiveBuilderForm = hasSelectedBuilderForm();
  if (ui.builderWorkspaceTitle) {
    ui.builderWorkspaceTitle.textContent = hasActiveBuilderForm
      ? text(state.builder.selectedFormTitle || state.builder.selectedFormSlug || "\u0424\u043e\u0440\u043c\u0430")
      : "\u041c\u043e\u0438 \u0444\u043e\u0440\u043c\u044b";
  }
  const isConstructorTab = state.builder.activeTab === "constructor";
  const isResponsesTab = hasActiveBuilderForm && state.builder.activeTab === "responses";
  const isPermissionsTab = hasActiveBuilderForm && state.builder.activeTab === "permissions";
  const isWideEditorTab = !hasActiveBuilderForm || (hasActiveBuilderForm && (state.builder.activeTab === "theme" || state.builder.activeTab === "settings" || state.builder.activeTab === "responses" || state.builder.activeTab === "permissions"));
  const isSettingsTab = hasActiveBuilderForm && state.builder.activeTab === "settings";
  if (ui.addTopFieldBtn) {
    ui.addTopFieldBtn.disabled = !hasActiveBuilderForm || !isConstructorTab;
    ui.addTopFieldBtn.classList.toggle("hidden-text", !hasActiveBuilderForm || !isConstructorTab);
  }
  if (ui.addFieldFromSidebarBtn) {
    ui.addFieldFromSidebarBtn.disabled = !hasActiveBuilderForm || !isConstructorTab;
    ui.addFieldFromSidebarBtn.classList.toggle("hidden-text", !hasActiveBuilderForm || !isConstructorTab);
  }
  if (ui.resetSchemaBtn) {
    ui.resetSchemaBtn.classList.toggle("hidden-text", !isSettingsTab);
  }
  if (ui.resetAllDataBtn) {
    ui.resetAllDataBtn.classList.toggle("hidden-text", !isSettingsTab);
  }
  if (ui.builderActions) {
    ui.builderActions.classList.toggle("hidden-text", !isSettingsTab);
    ui.builderActions.hidden = !isSettingsTab;
  }
  if (ui.builderSidebar) {
    ui.builderSidebar.classList.toggle("hidden-text", !hasActiveBuilderForm || !isConstructorTab);
    ui.builderSidebar.hidden = !hasActiveBuilderForm || !isConstructorTab;
    ui.builderSidebar.style.display = !hasActiveBuilderForm || !isConstructorTab ? "none" : "";
  }
  if (ui.saveSchemaBtn) {
    ui.saveSchemaBtn.classList.toggle("hidden-text", !hasActiveBuilderForm || isResponsesTab || isPermissionsTab);
  }
  if (ui.builderFormsBtn) {
    ui.builderFormsBtn.classList.toggle("hidden-text", !hasActiveBuilderForm);
  }
  if (ui.builderOpenFormBtn) {
    ui.builderOpenFormBtn.classList.toggle("hidden-text", !hasActiveBuilderForm);
    ui.builderOpenFormBtn.href = hasActiveBuilderForm ? getPublicFormHref(state.builder.selectedFormSlug) : "#";
  }
  ui.builderTabs.forEach(tab => {
    tab.classList.toggle("hidden-text", !hasActiveBuilderForm);
  });

  ui.builderContent.classList.toggle("builder-content-wide", isWideEditorTab);
  ui.builderContent.classList.toggle("builder-content-constructor", hasActiveBuilderForm && isConstructorTab);
  ui.builderLayout?.classList.toggle("builder-layout-focus", isWideEditorTab);
  ui.builderSidebar?.classList.toggle("hidden-text", !hasActiveBuilderForm || isWideEditorTab);
  if (ui.builderSidebar) {
    ui.builderSidebar.hidden = !hasActiveBuilderForm || !isConstructorTab;
    ui.builderSidebar.style.display = !hasActiveBuilderForm || !isConstructorTab ? "none" : "";
  }

  ui.builderContent.innerHTML = "";
  if (!hasActiveBuilderForm) {
    ui.builderContent.appendChild(renderBuilderFormsHub());
  } else if (state.builder.activeTab === "theme") {
    ui.builderContent.appendChild(renderThemeEditor());
  } else if (state.builder.activeTab === "settings") {
    ui.builderContent.appendChild(renderUiConfigEditor());
  } else if (state.builder.activeTab === "permissions") {
    ui.builderContent.appendChild(renderPermissionsPanel());
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
    addBtn.textContent = "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432\u043e\u043f\u0440\u043e\u0441";
    addBtn.addEventListener("click", () => {
      insertFieldAt(state.schema.length);
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "builder-primary-action";
    saveBtn.textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c";
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
    if (hasSupabaseAuthConfig()) {
      getSupabaseBrowserClient()?.auth.signOut().catch(() => {});
    }
    setAdminToken("");
    setSupabaseSession(null);
    if (ui.builderWorkspace) {
      ui.builderWorkspace.classList.add("hidden-text");
    }
    if (ui.builderGate) {
      ui.builderGate.classList.remove("hidden-text");
    }
    if (ui.builderEmail) {
      ui.builderEmail.value = "";
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

function applyBuilderAuthMode() {
  const supabaseMode = hasSupabaseAuthConfig();
  ui.builderEmail?.classList.toggle("hidden-text", !supabaseMode);
  ui.builderForgotPasswordBtn?.classList.toggle("hidden-text", !supabaseMode);

  if (ui.unlockBuilderBtn) {
    ui.unlockBuilderBtn.textContent = supabaseMode ? "\u0412\u043e\u0439\u0442\u0438" : "\u0412\u043e\u0439\u0442\u0438";
  }

  if (ui.builderPasscode) {
    ui.builderPasscode.placeholder = supabaseMode ? "\u041f\u0430\u0440\u043e\u043b\u044c" : "\u041a\u043e\u0434 \u0434\u043e\u0441\u0442\u0443\u043f\u0430";
  }

  if (ui.builderForgotPasswordBtn) {
    ui.builderForgotPasswordBtn.textContent = "\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c";
  }

  if (ui.builderAuthModeLabel) {
    ui.builderAuthModeLabel.textContent = supabaseMode
      ? "\u0412\u0445\u043e\u0434 \u0447\u0435\u0440\u0435\u0437 Supabase Auth: email \u0438 \u043f\u0430\u0440\u043e\u043b\u044c."
      : "\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c: \u0432\u0445\u043e\u0434 \u043f\u043e \u043a\u043e\u0434\u0443 \u0434\u043e\u0441\u0442\u0443\u043f\u0430.";
    ui.builderAuthModeLabel.classList.remove("hidden-text");
  }
}

async function setBuilderTab(tabName) {
  await runWithLoading("\u041e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u043c \u0432\u043a\u043b\u0430\u0434\u043a\u0443...", async () => {
    await new Promise(resolve => window.requestAnimationFrame(() => resolve()));
    state.builder.activeTab = tabName;
    renderBuilder();
    if (tabName === "responses") {
      await loadResponsesPreview();
    } else if (tabName === "permissions") {
      await loadBuilderMembers();
    }
    renderBuilder();
  });
}

function nextFrame() {
  return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
}

async function paintBeforeHeavyWork(message, callback) {
  showLoadingOverlay(message);
  try {
    await nextFrame();
    return await callback();
  } finally {
    hideLoadingOverlay();
  }
}

function createCsvContent(headers, rows) {
  const escapeCsv = value => {
    const normalized = String(value ?? "").replaceAll('"', '""');
    return `"${normalized}"`;
  };

  const lines = [
    headers.map(escapeCsv).join(";"),
    ...rows.map(row => row.map(escapeCsv).join(";"))
  ];

  return lines.join("\r\n");
}

function exportResponsesToExcel() {
  const headers = Array.isArray(state.builder.responses.headers) ? state.builder.responses.headers : [];
  const rows = Array.isArray(state.builder.responses.rows) ? state.builder.responses.rows : [];
  if (!headers.length || !rows.length) {
    return;
  }

  const preparedRows = rows.map(row => row.map((cell, index) => {
    const headerKey = String(headers[index] || "");
    return /updatedat/i.test(headerKey) ? formatBuilderDate(cell) : text(String(cell ?? ""));
  }));
  const csv = createCsvContent(headers.map(getResponsesHeaderLabel), preparedRows);
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = new Date().toISOString().slice(0, 10);
  const formSlug = slugifyFormValue(state.builder.selectedFormSlug || CONFIG.form?.slug || "form") || "form";
  link.href = url;
  link.download = `${formSlug}-${datePart}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadBuilderForms() {
  return runWithLoading("\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0444\u043e\u0440\u043c\u044b...", async () => {
    if (!window.FormApi || typeof FormApi.listForms !== "function" || !hasBuilderAuthorization()) {
      state.builder.forms.loading = false;
      renderBuilder();
      return;
    }

    state.builder.forms.loading = true;
    state.builder.forms.error = "";
    renderBuilder();

    try {
      const result = await FormApi.listForms(CONFIG, getBuilderBearerToken());
      state.builder.forms.items = Array.isArray(result.forms) ? result.forms : [];
    } catch (error) {
      state.builder.forms.items = [];
      state.builder.forms.error = cleanString(error?.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0444\u043e\u0440\u043c\u044b.");
    } finally {
      state.builder.forms.loading = false;
      renderBuilder();
    }
  });
}

async function openBuilderForm(slug) {
  return runWithLoading("\u041e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u043c \u0444\u043e\u0440\u043c\u0443...", async () => {
    const normalized = cleanString(slug || "");
    if (!normalized) {
      return;
    }

    const selected = state.builder.forms.items.find(item => cleanString(item.slug) === normalized);
    if (selected) {
      state.builder.selectedFormTitle = cleanString(selected.title || "");
    }
    setSelectedBuilderFormSlug(normalized);
    state.builder.responses.headers = [];
    state.builder.responses.rows = [];
    state.builder.responses.records = [];
    await loadRemoteSchema();
    renderBuilder();
  });
}

function closeActiveBuilderForm() {
  setSelectedBuilderFormSlug("");
  state.builder.selectedFormTitle = "";
  state.builder.responses.headers = [];
  state.builder.responses.rows = [];
  state.builder.responses.records = [];
  state.builder.members.items = [];
  state.builder.members.error = "";
  state.builder.forms.editingSlugFormId = "";
  state.builder.forms.editingSlugValue = "";
  state.builder.activeTab = "constructor";
  renderBuilder();
}

async function updateBuilderFormMeta(formId, payload) {
  if (!window.FormApi || typeof FormApi.updateForm !== "function" || !hasBuilderAuthorization()) {
    return;
  }

  const current = state.builder.forms.items.find(item => cleanString(item.id) === cleanString(formId));
  const updates = {};
  if (payload.title !== undefined) {
    updates.title = payload.title ?? current?.title ?? "";
  }
  if (payload.slug !== undefined) {
    updates.slug = payload.slug ?? current?.slug ?? "";
  }
  if (payload.schema !== undefined) {
    updates.schema = payload.schema;
  }
  if (payload.uiConfig !== undefined) {
    updates.uiConfig = payload.uiConfig;
  }
  const result = await FormApi.updateForm(CONFIG, formId, updates, getBuilderBearerToken());

  await loadBuilderForms();
  if (result?.form?.slug && cleanString(current?.slug) === cleanString(state.builder.selectedFormSlug)) {
    setSelectedBuilderFormMeta(result.form);
  }
  return result;
}

function startEditingFormSlug(form) {
  state.builder.forms.editingSlugFormId = cleanString(form?.id || "");
  state.builder.forms.editingSlugValue = cleanString(form?.slug || "");
  renderBuilder();
}

function stopEditingFormSlug() {
  state.builder.forms.editingSlugFormId = "";
  state.builder.forms.editingSlugValue = "";
  renderBuilder();
}

async function submitEditingFormSlug(form) {
  const formId = cleanString(form?.id || "");
  const nextSlug = slugifyFormValue(state.builder.forms.editingSlugValue || "");
  if (!formId || !nextSlug) {
    ui.submitStatus.textContent = "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0430\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b.";
    return;
  }

  try {
    ui.submitStatus.textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0430\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b...";
    const result = await updateBuilderFormMeta(formId, { slug: nextSlug });
    state.builder.forms.editingSlugFormId = "";
    state.builder.forms.editingSlugValue = "";
    ui.submitStatus.textContent = "\u0410\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d.";
    if (cleanString(form.slug) === cleanString(state.builder.selectedFormSlug) && result?.form?.slug) {
      setSelectedBuilderFormMeta(result.form);
    }
    renderBuilder();
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0430\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

async function createBuilderForm() {
  if (!window.FormApi || typeof FormApi.createForm !== "function" || !hasBuilderAuthorization()) {
    return;
  }

  const title = cleanString(state.builder.forms.draft.title);
  if (!title) {
    ui.submitStatus.textContent = "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0439 \u0444\u043e\u0440\u043c\u044b.";
    return;
  }

  const slug = slugifyFormValue(state.builder.forms.draft.slug || title);
  if (!slug) {
    ui.submitStatus.textContent = "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0430\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b.";
    return;
  }

  try {
    ui.submitStatus.textContent = "\u0421\u043e\u0437\u0434\u0430\u0435\u043c \u0444\u043e\u0440\u043c\u0443...";
    const result = await FormApi.createForm(CONFIG, {
      title,
      slug,
      schema: [],
      uiConfig: {}
    }, getBuilderBearerToken());

    state.builder.forms.draft.title = "";
    state.builder.forms.draft.slug = "";
    state.builder.forms.showCreatePanel = false;
    await loadBuilderForms();
    ui.submitStatus.textContent = "\u0424\u043e\u0440\u043c\u0430 \u0441\u043e\u0437\u0434\u0430\u043d\u0430.";
    await openBuilderForm(result?.form?.slug || slug);
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0444\u043e\u0440\u043c\u0443: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
    renderBuilder();
  }
}

async function copyBuilderFormLink(slug) {
  const href = getPublicFormHref(slug);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(href);
    } else {
      const helper = document.createElement("textarea");
      helper.value = href;
      helper.setAttribute("readonly", "readonly");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    ui.submitStatus.textContent = "\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u0430\u044f \u0441\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430.";
  } catch {
    ui.submitStatus.textContent = "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443. \u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u0435\u0435 \u0432 \u043d\u043e\u0432\u043e\u0439 \u0432\u043a\u043b\u0430\u0434\u043a\u0435.";
  }
}

function renderBuilderFormsHub() {
  const section = document.createElement("section");
  section.className = "builder-item builder-editor-card builder-forms-manager";

  const title = document.createElement("h4");
  title.className = "builder-section-title";
  title.textContent = "\u041c\u043e\u0438 \u0444\u043e\u0440\u043c\u044b";
  section.appendChild(title);

  const note = document.createElement("p");
  note.className = "field-hint";
  note.textContent = "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u043e\u0440\u043c\u0443 \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430 \u0438\u043b\u0438 \u0441\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043d\u043e\u0432\u0443\u044e \u043d\u0438\u0436\u0435. \u0423 \u043a\u0430\u0436\u0434\u043e\u0439 \u0444\u043e\u0440\u043c\u044b \u0435\u0441\u0442\u044c \u0431\u044b\u0441\u0442\u0440\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0434\u043b\u044f \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u0438 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438.";
  section.appendChild(note);

  if (state.builder.forms.loading) {
    const loading = document.createElement("p");
    loading.className = "field-hint";
    loading.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0444\u043e\u0440\u043c\u044b...";
    section.appendChild(loading);
    return section;
  }

  if (state.builder.forms.error) {
    const error = document.createElement("p");
    error.className = "error-text";
    error.textContent = state.builder.forms.error;
    section.appendChild(error);
  }

  const list = document.createElement("div");
  list.className = "builder-forms-list";

  if (!state.builder.forms.items.length) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043d\u0438 \u043e\u0434\u043d\u043e\u0439 \u0444\u043e\u0440\u043c\u044b. \u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043f\u0435\u0440\u0432\u0443\u044e \u0447\u0435\u0440\u0435\u0437 \u043a\u043d\u043e\u043f\u043a\u0443 \u043d\u0438\u0436\u0435.";
    list.appendChild(empty);
  } else {
    state.builder.forms.items.forEach(form => {
      const card = document.createElement("div");
      card.className = "builder-form-card";

      const heading = document.createElement("div");
      heading.className = "builder-form-card-head";

      const info = document.createElement("div");
      info.className = "builder-heading";

      const formTitle = document.createElement("h4");
      formTitle.className = "builder-form-card-title";
      formTitle.textContent = text(form.title || form.slug || "\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f");

      const meta = document.createElement("div");
      meta.className = "builder-form-card-meta";
      meta.textContent = `\u0430\u0434\u0440\u0435\u0441: ${form.slug || "\u2014"} \u2022 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430: ${formatBuilderDate(form.updatedAt)}`;

      info.append(formTitle, meta);
      heading.appendChild(info);

      const roleBadge = document.createElement("span");
      roleBadge.className = `builder-role-badge builder-role-${cleanString(form.role || "viewer").toLowerCase()}`;
      roleBadge.textContent = getRoleLabel(form.role);
      heading.appendChild(roleBadge);
      card.appendChild(heading);

      const row = document.createElement("div");
      row.className = "builder-form-card-actions";

      const constructorBtn = document.createElement("button");
      constructorBtn.type = "button";
      constructorBtn.className = "builder-primary-action";
      constructorBtn.textContent = "\u041a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440";
      constructorBtn.addEventListener("click", () => openBuilderForm(form.slug));
      row.appendChild(constructorBtn);

      const settingsBtn = document.createElement("button");
      settingsBtn.type = "button";
      settingsBtn.className = "button-secondary";
      settingsBtn.textContent = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438";
      settingsBtn.addEventListener("click", async () => {
        await openBuilderForm(form.slug);
        await setBuilderTab("settings");
      });
      row.appendChild(settingsBtn);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "button-secondary";
      copyBtn.textContent = "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443";
      copyBtn.addEventListener("click", () => {
        copyBuilderFormLink(form.slug);
      });
      row.appendChild(copyBtn);

      const publicLink = document.createElement("a");
      publicLink.className = "builder-link builder-form-card-link";
      publicLink.href = getPublicFormHref(form.slug);
      publicLink.target = "_blank";
      publicLink.rel = "noreferrer";
      publicLink.textContent = "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0435";
      row.appendChild(publicLink);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "button-secondary";
      deleteBtn.textContent = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c";
      deleteBtn.addEventListener("click", () => {
        deleteBuilderForm(form);
      });
      row.appendChild(deleteBtn);

      card.appendChild(row);

      const slugTools = document.createElement("div");
      slugTools.className = "builder-form-slug-tools";

      if (cleanString(state.builder.forms.editingSlugFormId) === cleanString(form.id)) {
        const slugInput = createTextInput(state.builder.forms.editingSlugValue || "", value => {
          state.builder.forms.editingSlugValue = slugifyFormValue(value);
        });
        slugInput.placeholder = "new-form-address";
        slugTools.appendChild(createBuilderField("\u0410\u0434\u0440\u0435\u0441 \u0444\u043e\u0440\u043c\u044b", slugInput));

        const slugActions = document.createElement("div");
        slugActions.className = "builder-form-create-actions";

        const saveSlugBtn = document.createElement("button");
        saveSlugBtn.type = "button";
        saveSlugBtn.className = "builder-primary-action";
        saveSlugBtn.textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0430\u0434\u0440\u0435\u0441";
        saveSlugBtn.addEventListener("click", () => submitEditingFormSlug(form));

        const cancelSlugBtn = document.createElement("button");
        cancelSlugBtn.type = "button";
        cancelSlugBtn.className = "button-secondary";
        cancelSlugBtn.textContent = "\u041e\u0442\u043c\u0435\u043d\u0430";
        cancelSlugBtn.addEventListener("click", stopEditingFormSlug);

        slugActions.append(saveSlugBtn, cancelSlugBtn);
        slugTools.appendChild(slugActions);
      } else {
        const editSlugBtn = document.createElement("button");
        editSlugBtn.type = "button";
        editSlugBtn.className = "button-secondary";
        editSlugBtn.textContent = "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0430\u0434\u0440\u0435\u0441";
        editSlugBtn.addEventListener("click", () => startEditingFormSlug(form));
        slugTools.appendChild(editSlugBtn);
      }

      card.appendChild(slugTools);
      list.appendChild(card);
    });
  }

  section.appendChild(list);

  const footer = document.createElement("div");
  footer.className = "builder-forms-footer";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "builder-primary-action";
  toggleBtn.textContent = state.builder.forms.showCreatePanel ? "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c" : "\u041d\u043e\u0432\u0430\u044f \u0444\u043e\u0440\u043c\u0430";
  toggleBtn.addEventListener("click", () => {
    state.builder.forms.showCreatePanel = !state.builder.forms.showCreatePanel;
    renderBuilder();
  });
  footer.appendChild(toggleBtn);

  if (state.builder.forms.showCreatePanel) {
    const createPanel = document.createElement("div");
    createPanel.className = "builder-form-create-panel";

    const createTitle = document.createElement("h5");
    createTitle.className = "builder-form-create-title";
    createTitle.textContent = "\u041d\u043e\u0432\u0430\u044f \u0444\u043e\u0440\u043c\u0430";
    createPanel.appendChild(createTitle);

    const createHint = document.createElement("p");
    createHint.className = "field-hint";
    createHint.textContent = "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u043a\u043e\u0440\u043e\u0442\u043a\u0438\u0439 \u0430\u0434\u0440\u0435\u0441. \u041e\u043d \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u0432 \u043f\u0443\u0431\u043b\u0438\u0447\u043d\u043e\u0439 \u0441\u0441\u044b\u043b\u043a\u0435 \u0444\u043e\u0440\u043c\u044b.";
    createPanel.appendChild(createHint);

    const formRow = document.createElement("div");
    formRow.className = "builder-row builder-row-2";
    formRow.append(
      createBuilderField("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0444\u043e\u0440\u043c\u044b", createTextInput(state.builder.forms.draft.title || "", value => {
        const previousTitleSlug = slugifyFormValue(state.builder.forms.draft.title);
        state.builder.forms.draft.title = value;
        if (!state.builder.forms.draft.slug || slugifyFormValue(state.builder.forms.draft.slug) === previousTitleSlug) {
          state.builder.forms.draft.slug = slugifyFormValue(value);
        }
      })),
      createBuilderField("\u0410\u0434\u0440\u0435\u0441", createTextInput(state.builder.forms.draft.slug || "", value => {
        state.builder.forms.draft.slug = slugifyFormValue(value);
      }))
    );
    createPanel.appendChild(formRow);

    const createActions = document.createElement("div");
    createActions.className = "builder-form-create-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "builder-primary-action";
    submitBtn.textContent = "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0444\u043e\u0440\u043c\u0443";
    submitBtn.addEventListener("click", createBuilderForm);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "button-secondary";
    cancelBtn.textContent = "\u041e\u0442\u043c\u0435\u043d\u0430";
    cancelBtn.addEventListener("click", () => {
      state.builder.forms.showCreatePanel = false;
      state.builder.forms.draft.title = "";
      state.builder.forms.draft.slug = "";
      renderBuilder();
    });

    createActions.append(submitBtn, cancelBtn);
    createPanel.appendChild(createActions);
    footer.appendChild(createPanel);
  }

  section.appendChild(footer);
  return section;
}

async function handleBuilderUnlock() {
  showLoadingOverlay("\u0412\u0445\u043e\u0434\u0438\u043c \u0432 \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440...");
  if (hasSupabaseAuthConfig()) {
    const email = ui.builderEmail ? ui.builderEmail.value.trim() : "";
    const password = ui.builderPasscode ? ui.builderPasscode.value : "";

    try {
      const client = getSupabaseBrowserClient();
      const result = await client.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) {
        throw result.error;
      }

      setSupabaseSession(result.data.session || null);
      await loadBuilderForms();
      setSelectedBuilderFormSlug("");
      unlockBuilderWorkspace();
    } catch (error) {
      if (ui.builderAuthError) {
        ui.builderAuthError.textContent = cleanString(error?.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Supabase Auth.");
        ui.builderAuthError.classList.remove("hidden-text");
      }
    } finally {
      resetLoadingOverlay();
    }
    return;
  }

  const passcode = ui.builderPasscode ? ui.builderPasscode.value.trim() : "";


  try {
    const result = await FormApi.loginAdmin(CONFIG, passcode);
    setAdminToken(result.adminToken);
    await loadBuilderForms();
    setSelectedBuilderFormSlug("");
    unlockBuilderWorkspace();
  } catch (error) {
    if (ui.builderAuthError) {
      ui.builderAuthError.textContent = "\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 Supabase Auth \u0438\u043b\u0438 \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u0435 web app \u0434\u043b\u044f \u0432\u0445\u043e\u0434\u0430 \u043f\u043e \u043f\u0430\u0440\u043e\u043b\u044e \u0430\u0434\u043c\u0438\u043d\u0430.";
      ui.builderAuthError.classList.remove("hidden-text");
    }
  } finally {
    resetLoadingOverlay();
  }
}

async function deleteBuilderForm(form) {
  const formId = cleanString(form?.id || "");
  const formTitle = cleanString(form?.title || form?.slug || "\u044d\u0442\u0443 \u0444\u043e\u0440\u043c\u0443");
  if (!formId) {
    return;
  }

  if (!window.confirm(`\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0444\u043e\u0440\u043c\u0443 \"${formTitle}\"? \u0412\u043c\u0435\u0441\u0442\u0435 \u0441 \u043d\u0435\u0439 \u0443\u0434\u0430\u043b\u044f\u0442\u0441\u044f \u0438 \u043e\u0442\u0432\u0435\u0442\u044b \u044d\u0442\u043e\u0439 \u0444\u043e\u0440\u043c\u044b.`)) {
    return;
  }

  try {
    ui.submitStatus.textContent = "\u0423\u0434\u0430\u043b\u044f\u0435\u043c \u0444\u043e\u0440\u043c\u0443...";
    await FormApi.deleteForm(CONFIG, formId, getBuilderBearerToken());
    if (cleanString(state.builder.selectedFormSlug) === cleanString(form.slug)) {
      closeActiveBuilderForm();
    }
    await loadBuilderForms();
    ui.submitStatus.textContent = "\u0424\u043e\u0440\u043c\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430.";
  } catch (error) {
    ui.submitStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0444\u043e\u0440\u043c\u0443: ${cleanString(error?.message || "\u043e\u0448\u0438\u0431\u043a\u0430")}`;
  }
}

async function handleForgotPassword() {
  const email = ui.builderEmail ? ui.builderEmail.value.trim() : "";
  if (!hasSupabaseAuthConfig() || !email) {
    if (ui.builderAuthError) {
      ui.builderAuthError.textContent = "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u0434\u043b\u044f \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f.";
      ui.builderAuthError.classList.remove("hidden-text");
    }
    return;
  }

  try {
    const client = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const result = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (result.error) {
      throw result.error;
    }

    if (ui.builderAuthError) {
      ui.builderAuthError.textContent = "\u0421\u0441\u044b\u043b\u043a\u0430 \u0434\u043b\u044f \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430 \u043d\u0430 email.";
      ui.builderAuthError.classList.remove("hidden-text");
    }
  } catch (error) {
    if (ui.builderAuthError) {
      ui.builderAuthError.textContent = cleanString(error?.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043f\u0438\u0441\u044c\u043c\u043e \u0434\u043b\u044f \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f.");
      ui.builderAuthError.classList.remove("hidden-text");
    }
  }
}

async function initializeCommonData() {
  hydrateSchema();
  if (!isBuilderPage()) {
    await loadRemoteSchema().catch(error => console.error(error));
  }
  initializeDefaults(getFields());
}

async function initializeFormPage() {
  try {
    await runWithLoading("\u0413\u043e\u0442\u043e\u0432\u0438\u043c \u0444\u043e\u0440\u043c\u0443...", async () => {
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

async function initializeBuilderPage() {
  try {
    await runWithLoading("\u0413\u043e\u0442\u043e\u0432\u0438\u043c \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440...", async () => {
      ensureBuilderSaveIndicator();
      updateBuilderSaveIndicator();
      ui.addTopFieldBtn?.remove();
    applyBuilderAuthMode();
    if (hasSupabaseAuthConfig()) {
      setAdminToken("");
    }
    if (hasSupabaseAuthConfig()) {
      const client = getSupabaseBrowserClient();
      const result = await client.auth.getSession().catch(() => ({ data: { session: null } }));
      if (result?.data?.session) {
        setSupabaseSession(result.data.session);
      }
    }
    renderBuilder();
    if (hasBuilderAuthorization()) {
      setSelectedBuilderFormSlug("");
      await loadBuilderForms();
      unlockBuilderWorkspace();
    }
    });
  } finally {
    resetLoadingOverlay();
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

  if (ui.builderEmail) {
    ui.builderEmail.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        handleBuilderUnlock();
      }
    });
  }

  ui.builderForgotPasswordBtn?.addEventListener("click", handleForgotPassword);
  ui.builderFormsBtn?.addEventListener("click", async () => {
    closeActiveBuilderForm();
    state.builder.forms.loading = true;
    renderBuilder();
    await loadBuilderForms();
  });

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
  ui.builderFormsBtn = document.getElementById("builderFormsBtn");
  ui.builderOpenFormBtn = document.getElementById("builderOpenFormBtn");
  ui.saveSchemaBtn = document.getElementById("saveSchemaBtn");
  ui.addFieldFromSidebarBtn = document.getElementById("addFieldFromSidebarBtn");
  ui.addTopFieldBtn = document.getElementById("addTopFieldBtn");
  ui.resetSchemaBtn = document.getElementById("resetSchemaBtn");
  ui.resetAllDataBtn = document.getElementById("resetAllDataBtn");
  ui.builderGate = document.getElementById("builderGate");
  ui.builderWorkspace = document.getElementById("builderWorkspace");
  ui.builderEmail = document.getElementById("builderEmail");
  ui.builderPasscode = document.getElementById("builderPasscode");
  ui.unlockBuilderBtn = document.getElementById("unlockBuilderBtn");
  ui.builderForgotPasswordBtn = document.getElementById("builderForgotPasswordBtn");
  ui.builderAuthModeLabel = document.getElementById("builderAuthModeLabel");
  ui.builderAuthError = document.getElementById("builderAuthError");
  ui.builderWorkspaceTitle = document.getElementById("builderWorkspaceTitle");
  ui.builderTabs = Array.from(document.querySelectorAll("[data-builder-tab]"));
  ui.builderOutline = document.getElementById("builderOutline");
  ui.pageTitle = document.getElementById("pageTitle");
  ui.heroRibbonTop = document.getElementById("heroRibbonTop");
  ui.heroKicker = document.getElementById("heroKicker");
  ui.heroHeadline = document.getElementById("heroHeadline");
  ui.heroSubline = document.getElementById("heroSubline");
  ui.heroBadge = document.getElementById("heroBadge");
  ui.heroNote = document.getElementById("heroNote");
  ui.heroRibbonBottom = document.getElementById("heroRibbonBottom");
  ui.adminEntryLink = document.getElementById("adminEntryLink");
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
