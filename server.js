require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Определение схемы MongoDB
const weatherSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    city: String,
    temperature: Number,
    humidity: Number,
    wind_speed: Number,
});

const Weather = mongoose.model("Weather", weatherSchema);

// Получение погоды и автоматическое сохранение в MongoDB
app.get("/api/weather", async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ error: "City is required" });

        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);
        console.log("Weather API Response:", response.data);

        const { temp, humidity } = response.data.main;
        const wind_speed = response.data.wind?.speed || 0;

        // Автоматическое сохранение в MongoDB
        const weatherData = new Weather({ city, temperature: temp, humidity, wind_speed });
        await weatherData.save();

        res.json({ message: "Weather data saved", data: weatherData });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).json({ error: error.message });
    }
});

// Получение статистики (среднее, минимум, максимум, stdDev) по полю
app.get("/api/weather/metrics", async (req, res) => {
    try {
        const { city, field } = req.query;
        if (!field) return res.status(400).json({ error: "Field parameter is required (temperature, humidity, wind_speed)" });

        const query = city ? { city } : {};
        const stats = await Weather.aggregate([
            { $match: query },
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

        res.json(stats.length ? stats[0] : { error: "No data found" });
    } catch (error) {
        console.error("Error fetching weather metrics:", error);
        res.status(500).json({ error: error.message });
    }
});

// Получение измерений по полю с выбором даты и параметра
app.get("/api/weather/history", async (req, res) => {
    try {
        const { city, field, start_date, end_date } = req.query;
        if (!field) return res.status(400).json({ error: "Field parameter is required (temperature, humidity, wind_speed)" });

        const query = city ? { city } : {};
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999); // Исправление ошибки

            console.log("Start Date:", startDate);
            console.log("End Date:", endDate);

            query.timestamp = { $gte: startDate, $lte: endDate };
        }

        const data = await Weather.find(query, { timestamp: 1, [field]: 1, _id: 0 }).sort({ timestamp: -1 });

        res.json(data);
    } catch (error) {
        console.error("Error fetching weather history:", error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
