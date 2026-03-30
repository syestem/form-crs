# Form Builder

Проект поддерживает три рабочих режима:

- локальная разработка через `Node.js`
- фронт на `GitHub Pages`
- backend на `Supabase Edge Functions` или на старом `PHP/PostgreSQL` хостинге

## Структура

- [index.html](/S:/develop/form/index.html) — публичная форма
- [builder.html](/S:/develop/form/builder.html) — админка/конструктор
- [app.js](/S:/develop/form/app.js) — основная клиентская логика
- [api.js](/S:/develop/form/api.js) — клиент API
- [config.js](/S:/develop/form/config.js) — дефолтный конфиг формы
- [style.css](/S:/develop/form/style.css) — общие стили
- [server.js](/S:/develop/form/server.js) — локальный dev-сервер
- [supabase/functions/form-api/index.ts](/S:/develop/form/supabase/functions/form-api/index.ts) — production backend для Supabase

Deploy-копии:

- [github-deploy](/S:/develop/form/github-deploy)
- [ftp-deploy](/S:/develop/form/ftp-deploy)

Исходником всегда считается корень проекта. После изменений deploy-папки нужно синхронизировать.

## Локальный запуск

```powershell
npm start
```

Дополнительно:

```powershell
npm run check
npm run sync-deploy
```

## GitHub Pages + Supabase

1. Настройте `Supabase`.
2. Укажите `apiBaseUrl`, `supabaseUrl`, `supabaseAnonKey` и `formSlug` в `config.runtime.js`.
3. Опубликуйте содержимое [github-deploy](/S:/develop/form/github-deploy).

Подробная инструкция:

- [SUPABASE_GITHUB_DEPLOY.md](/S:/develop/form/SUPABASE_GITHUB_DEPLOY.md)

## FTP-хостинг

Если нужен старый PHP-вариант:

1. Откройте [ftp-deploy](/S:/develop/form/ftp-deploy).
2. Подготовьте `.env`.
3. Залейте содержимое папки на сервер по FTP.

Краткая инструкция:

- [UPLOAD.txt](/S:/develop/form/UPLOAD.txt)

## Поддержка кодировки

Чтобы проект не возвращался к mojibake:

- добавлен [.editorconfig](/S:/develop/form/.editorconfig)
- добавлен [.gitattributes](/S:/develop/form/.gitattributes)

Все исходники проекта нужно сохранять в `UTF-8`.
