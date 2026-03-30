# Supabase + GitHub Pages

Эта схема делает:

- frontend на GitHub Pages
- backend на Supabase Edge Functions
- хранение схемы, ответов и админ-сессий в Supabase Postgres

## 1. Что загружать на GitHub Pages

Используйте содержимое [github-deploy](/S:/develop/form/github-deploy):

- `index.html`
- `builder.html`
- `app.js`
- `api.js`
- `config.js`
- `config.runtime.js`
- `style.css`
- `.nojekyll`

## 2. Что создать в Supabase

### SQL

В SQL Editor выполните [supabase/migrations/20260331_init_form_api.sql](/S:/develop/form/supabase/migrations/20260331_init_form_api.sql)

### Edge Function

Создайте функцию `form-api` из файла [supabase/functions/form-api/index.ts](/S:/develop/form/supabase/functions/form-api/index.ts)

Важно:

- для этой функции нужно отключить платформенную проверку JWT
- конфиг уже подготовлен в [supabase/config.toml](/S:/develop/form/supabase/config.toml)

Если деплой идет через CLI, используйте этот конфиг или флаг `--no-verify-jwt`.

## 3. Secrets в Supabase

Добавьте secrets:

- `ADMIN_PASSCODE`
- `ADMIN_TOKEN_TTL_HOURS`

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в Edge Functions обычно доступны внутри проекта, но если в вашей панели требуется, добавьте их тоже.

## 4. Какой URL вставлять во frontend

В `config.runtime.js`:

```js
window.FORM_RUNTIME_CONFIG = {
  apiBaseUrl: "https://your-project-ref.supabase.co/functions/v1/form-api"
};
```

## 5. Локальный запуск

Локально можно продолжать использовать:

```powershell
npm start
```

Это поднимет Node-версию backend для тестов на `localhost`.

## 6. Если `health` отвечает `401 Missing authorization header`

Это значит, что у функции включена проверка JWT на уровне Supabase Edge Gateway.

Нужно задеплоить `form-api` с отключенной проверкой JWT:

```bash
supabase functions deploy form-api --no-verify-jwt
```

или использовать [supabase/config.toml](/S:/develop/form/supabase/config.toml), где уже задано:

```toml
[functions.form-api]
verify_jwt = false
```

После этого URL

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/form-api/health
```

должен возвращать:

```json
{"ok":true}
```
