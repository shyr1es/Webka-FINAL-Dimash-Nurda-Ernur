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
git clone https://github.com/your-repo/weather-app.git
cd weather-app
```

### 2. Установка зависимостей
```sh
npm install
```

### 3. Создание `.env` файла
Создайте файл `.env` в корневой папке и добавьте:
```env
PORT=3001
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
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

