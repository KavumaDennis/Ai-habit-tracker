import "dotenv/config"
import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import authRoutes from "./routes/auth.js"
import habitRoutes from "./routes/habits.js"
import logRoutes from "./routes/logs.js"
import aiRoutes from "./routes/ai.js"

import { notFound, errorHandler } from "./middleware/errorHandler.js"

const app = express()


const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.CLIENT_URL || "")
            .split(",")
            .map(o => o.trim())
            .filter(Boolean);

        // allow no-origin requests (Postman, health checks, etc.)
        if (!origin) return callback(null, true);

        // allow localhost (dev)
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }

        // allow production frontend
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // DO NOT THROW ERROR → just block safely
        return callback(null, false);
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() })
})

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(express.json({ limit: "1mb" }))

app.use("/api/auth", authRoutes)
app.use("/api/habits", habitRoutes)
app.use("/api/logs", logRoutes)
app.use("/api/ai", aiRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 8000

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} - env: ${process.env.NODE_ENV || "development"}`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err.message);
    });