function resolveApiBaseUrl() {
  const runtimeConfig = window.FORM_RUNTIME_CONFIG || {};
  const runtimeBaseUrl = typeof runtimeConfig.apiBaseUrl === "string" ? runtimeConfig.apiBaseUrl.trim() : "";
  if (runtimeBaseUrl) {
    return runtimeBaseUrl.replace(/\/$/, "");
  }

  try {
    const storedBaseUrl = window.localStorage.getItem("event-form-api-base-url") || "";
    if (storedBaseUrl.trim()) {
      return storedBaseUrl.trim().replace(/\/$/, "");
    }
  } catch (error) {
    void error;
  }

  const hostname = window.location.hostname || "";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    return "/api";
  }

  if (hostname.endsWith(".github.io")) {
    return "";
  }

  return "/api";
}

function readRuntimeValue(name) {
  const runtimeConfig = window.FORM_RUNTIME_CONFIG || {};
  const value = runtimeConfig[name];
  return typeof value === "string" ? value.trim() : "";
}

function resolveFormSlug() {
  const urlSlug = (() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return (params.get("form") || "").trim();
    } catch {
      return "";
    }
  })();

  if (urlSlug) {
    return urlSlug;
  }

  return readRuntimeValue("formSlug");
}

const CONFIG = {
  participants: 80,
  storage: {
    draftKey: "event-form-draft-v1",
    statsKey: "event-form-stats-v1",
    schemaKey: "event-form-schema-v1",
    uiConfigKey: "event-form-ui-config-v1",
    adminTokenKey: "event-form-admin-token-v1",
    authSessionKey: "event-form-auth-session-v1",
    builderFormSlugKey: "event-form-builder-slug-v1"
  },
  api: {
    baseUrl: resolveApiBaseUrl()
  },
  supabase: {
    url: readRuntimeValue("supabaseUrl"),
    anonKey: readRuntimeValue("supabaseAnonKey") || readRuntimeValue("supabasePublishableKey")
  },
  form: {
    slug: resolveFormSlug()
  },
  builder: {
    url: readRuntimeValue("builderUrl")
  },
  ui: {
    pageTitle: "Командообразование спорт",
    userSectionTitle: "Данные студента СГУПС",
    userSectionHint: "Оставьте имя и группу, чтобы мы сохранили ваш выбор.",
    namePlaceholder: "ФИО",
    groupPlaceholder: "Группа",
    participantsStatLabel: "Участников в группе",
    responsesStatLabel: "Уже заполнили",
    ticketLabel: "Цена билета",
    detailsButtonLabel: "Общий чек / Итого",
    saveButtonLabel: "Отправить выбор",
    resubmitButtonLabel: "Обновить мой выбор",
    draftStatusText: "После отправки выбор сохранится, и его можно будет изменить позже.",
    buttonPrimaryStart: "#0f766e",
    buttonPrimaryEnd: "#059669",
    buttonDetailsStart: "#475569",
    buttonDetailsEnd: "#334155",
    buttonSecondaryBg: "#e5e7eb",
    buttonSecondaryText: "#1f2937",
    builderTitle: "Конструктор формы",
    builderHint: "Здесь вы можете менять структуру формы, пользовательские поля, оформление и блок вопросов."
  },
  fields: [
    {
      id: "location",
      label: "2. Место проведения",
      hint: "Выберите одну площадку. Изображения и цены можно заменить прямо в config.js.",
      type: "single",
      required: true,
      appearance: "media-grid",
      options: [
        {
          value: "loft",
          label: "Лофт",
          description: "Светлое пространство для вечеринки, презентации или банкета.",
          image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
          price: 20000,
          priceType: "fixed"
        },
        {
          value: "country",
          label: "Загородная площадка",
          description: "Подходит для BBQ, активностей и выездной программы.",
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
          price: 30000,
          priceType: "fixed"
        },
        {
          value: "restaurant",
          label: "Ресторан / банкетный зал",
          description: "Готовая инфраструктура для банкета и обслуживания гостей.",
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
          price: 25000,
          priceType: "fixed"
        }
      ]
    },
    {
      id: "alcohol",
      label: "3. Алкоголь",
      hint: "Обязательный выбор, один вариант.",
      type: "single",
      required: true,
      options: [
        { value: "own", label: "Свой", price: 0, priceType: "perPerson" },
        { value: "purchased", label: "Закупленный", price: 150, priceType: "perPerson" },
        { value: "unlimitedBar", label: "Безлимитный бар с меню и барменами", price: 400, priceType: "perPerson" }
      ]
    },
    {
      id: "food",
      label: "4. Питание",
      hint: "Можно выбрать один или несколько вариантов.",
      type: "multi",
      options: [
        { value: "selfFood", label: "Самостоятельное", price: 0, priceType: "fixed" },
        { value: "bbq", label: "Шашлык / BBQ", price: 600, priceType: "perPerson" },
        { value: "buffet", label: "Фуршет", price: 700, priceType: "perPerson" },
        { value: "banquet", label: "Банкет", price: 1200, priceType: "perPerson" },
        { value: "fastfood", label: "Фастфуд", price: 450, priceType: "perPerson" },
        { value: "veggie", label: "Вегетарианское / диетическое", price: 650, priceType: "perPerson" }
      ]
    },
    {
      id: "drinks",
      label: "5. Напитки",
      hint: "Взаимоисключающий выбор.",
      type: "single",
      required: true,
      options: [
        { value: "ownAlcohol", label: "Свой алкоголь", price: 0, priceType: "fixed" },
        { value: "beer", label: "Пиво", price: 120, priceType: "perPerson" },
        { value: "wine", label: "Вино", price: 220, priceType: "perPerson" },
        { value: "strongAlcohol", label: "Крепкий алкоголь", price: 320, priceType: "perPerson" },
        { value: "softDrinks", label: "Безалкогольные напитки", price: 90, priceType: "perPerson" },
        { value: "cocktailBar", label: "Бар (бармен + коктейли)", price: 350, priceType: "perPerson" },
        { value: "noAlcohol", label: "Без алкоголя", price: 0, priceType: "fixed" }
      ]
    },
    {
      id: "entertainment",
      label: "7. Развлекательная программа",
      hint: "Можно включить несколько опций. Подарочные услуги уже включены в пакет.",
      type: "multi",
      options: [
        { value: "host", label: "Ведущий", price: 0, priceType: "fixed", defaultSelected: true, locked: true, promoText: "Включено бесплатно" },
        { value: "games", label: "Конкурсы и тимбилдинг-игры", price: 0, priceType: "fixed", defaultSelected: true, locked: true, promoText: "Включено бесплатно" },
        { value: "dj", label: "Диджей", price: 0, priceType: "fixed", defaultSelected: true, locked: true, promoText: "Включено бесплатно" },
        { value: "photoVideo", label: "Фото/видеосъёмка", price: 0, priceType: "fixed", defaultSelected: true, locked: true, promoText: "Включено бесплатно" },
        { value: "photozone", label: "Фотозона", price: 5000, priceType: "fixed" }
      ]
    },
    {
      id: "extraServices",
      label: "8. Дополнительные услуги",
      hint: "Можно выбрать несколько услуг. Некоторые бонусы уже входят в пакет.",
      type: "multi",
      options: [
        {
          value: "transfer",
          label: "Трансфер",
          price: 0,
          priceType: "fixed",
          children: [
            {
              id: "transferType",
              label: "Тип трансфера",
              type: "single",
              required: true,
              options: [
                { value: "bus", label: "Автобус", price: 15000, priceType: "fixed" },
                { value: "minibus", label: "Микроавтобус", price: 9000, priceType: "fixed" }
              ]
            }
          ]
        },
        { value: "decor", label: "Декор площадки", price: 7000, priceType: "fixed" },
        { value: "equipment", label: "Оборудование (звук, свет)", price: 12000, priceType: "fixed" },
        { value: "projector", label: "Проектор / экран", price: 3500, priceType: "fixed" },
        { value: "cleanup", label: "Уборка после мероприятия", price: 0, priceType: "fixed", defaultSelected: true, locked: true, promoText: "Подарок для группы" },
        { value: "gifts", label: "Подарки участникам", price: 500, priceType: "perPerson" }
      ]
    }
  ]
};
