require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const morgan = require("morgan");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 🔗 Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// 🛢️ Схема пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
});
const User = mongoose.model("User", userSchema);

// 🛢️ Схема погоды
const weatherSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    city: { type: String, required: true, index: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    wind_speed: { type: Number, required: true },
});
const Weather = mongoose.model("Weather", weatherSchema);

// 🔐 Middleware для проверки токена
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "❌ Unauthorized: No token provided" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "❌ Invalid token" });
    }
}

// 📝 Регистрация пользователя
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "⚠️ Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "✅ User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔑 Авторизация пользователя
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "❌ Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🌦️ Получение погоды и автоматическое сохранение в MongoDB
app.get("/api/weather", authMiddleware, async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ error: "⚠️ City is required" });

        const apiKey = process.env.OPENWEATHER_API_KEY;
        const encodedCity = encodeURIComponent(city);
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric&lang=ru`;

        console.log(`🌍 Запрашиваем погоду для: ${city}`);

        const response = await axios.get(url);
        const { temp, humidity } = response.data.main;
        const wind_speed = response.data.wind?.speed || 0;

        const weatherData = new Weather({ city, temperature: temp, humidity, wind_speed });
        await weatherData.save();
        console.log(`✅ Данные о ${city} сохранены.`);

        res.json({ message: "✅ Данные успешно обновлены", data: weatherData });
    } catch (error) {
        console.error("❌ Ошибка:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.message || "Ошибка получения данных" });
    }
});

// 📊 Получение статистики
app.get("/api/weather/metrics", authMiddleware, async (req, res) => {
    try {
        const { city, field } = req.query;
        const stats = await Weather.aggregate([
            { $match: city ? { city } : {} },
            {
                $group: {
                    _id: null,
                    avg: { $avg: `$${field}` },
                    min: { $min: `$${field}` },
                    max: { $max: `$${field}` },
                    stdDev: { $stdDevPop: `$${field}` },
                },
            },
        ]);
        res.json(stats.length ? stats[0] : { error: "⚠️ No data found" });j
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🕒 История данных
app.get("/api/weather/history", authMiddleware, async (req, res) => {
    try {
        const { city, field } = req.query;
        const data = await Weather.find({ city }, { timestamp: 1, [field]: 1, _id: 0 }).sort({ timestamp: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));