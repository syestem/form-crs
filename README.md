# GitHub Pages Deploy

Эта папка содержит только frontend-часть проекта для публикации на GitHub Pages.

Рекомендуемый backend для этой версии: Supabase Edge Functions.

## Что нужно сделать

1. Скопируйте `config.runtime.github.example.js` в `config.runtime.js`
2. Укажите адрес вашего backend:

```js
window.FORM_RUNTIME_CONFIG = {
  apiBaseUrl: "https://your-project-ref.supabase.co/functions/v1/form-api"
};
```

3. Загрузите содержимое этой папки в репозиторий для GitHub Pages
4. Настройте Supabase по инструкции в [SUPABASE_GITHUB_DEPLOY.md](/S:/develop/form/SUPABASE_GITHUB_DEPLOY.md)

## Что публиковать в GitHub

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
