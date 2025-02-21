# Weather App (MongoDB + Node.js)

## Описание
Приложение для получения данных о погоде с возможностью сохранения запросов. Поддерживает регистрацию, авторизацию и управление запросами.

## Стек технологий
- **Backend**: Node.js, Express.js
- **База данных**: MongoDB
- **Аутентификация**: JWT (JSON Web Token)
- **Пароли**: bcrypt
- **Разметка**: EJS (Embedded JavaScript)

## Установка и запуск
### 1. Клонирование репозитория
```sh
git clone https://github.com/shyr1es/NoSQL_final-T.Dinmukhammed-M.Adilkhan.git
cd analytics-platform
```

### 2. Установка зависимостей
```sh
npm install
```

### 3. Создание `.env` файла
Создайте файл `.env` в корневой папке и добавьте:
```env
MONGO_URI=mongodb://127.0.0.1:27017/analytics
PORT=5000
OPENWEATHER_API_KEY=1519a798d51342ce3faa2579955f87fd
JWT_SECRET=supersecretkey
```

### 4. Запуск сервера
```sh
node server.js
```

## API Маршруты
### Аутентификация
- **POST** `/register` – регистрация пользователя (требует `username` и `password`)
- **POST** `/login` – вход в систему (возвращает JWT токен)

### Работа с запросами
> *Требуется авторизация (передавать JWT в заголовке `Authorization`)*
- **GET** `/search` – получить историю запросов
- **POST** `/search` – сохранить запрос (JSON `{ "city": "Almaty" }`)
- **DELETE** `/search/:id` – удалить запрос по ID

## Оптимизация
- Индексация коллекции `searchqueries` по `city`
- Индексация `users` по `username` (уникальный индекс)

## Возможные улучшения
- Добавление кеширования запросов
- Интеграция с React/Vue для UI
- Улучшение безопасности (refresh tokens, rate limiting)

---
**Разработчик:** Maratov Adilkhan , Temirgalin Dinmukhammed 

