# GitHub Pages Deploy

Эта папка содержит только frontend-часть проекта для публикации на GitHub Pages.

## Что нужно сделать

1. Скопируйте `config.runtime.github.example.js` в `config.runtime.js`
2. Укажите адрес вашего backend:

```js
window.FORM_RUNTIME_CONFIG = {
  apiBaseUrl: "https://example.com/api"
};
```

3. Загрузите содержимое этой папки в репозиторий для GitHub Pages
4. На PHP backend разрешите CORS для домена GitHub Pages через `CORS_ALLOWED_ORIGINS`

## Что публиковать

- `index.html`
- `builder.html`
- `app.js`
- `api.js`
- `config.js`
- `config.runtime.js`
- `style.css`

## Что не нужно

- `api/`
- `.htaccess`
- `server.js`
- `package.json`
