console.log("🔥 SERVER BOOTING")

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

const allowedOrigins = [
    "https://ai-habit-tracker-tawny.vercel.app",
    "https://ai-habit-tracker-black.vercel.app",
    "http://localhost:5173"
];

app.use(cors({
    origin: function (origin, callback) {

        // allow requests without origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() })
})

// app.use(cors(corsOptions))
// app.options("*", cors(corsOptions))
app.options("*", cors())
app.use(express.json({ limit: "1mb" }))

app.use("/api/auth", authRoutes)
app.use("/api/habits", habitRoutes)
app.use("/api/logs", logRoutes)
app.use("/api/ai", aiRoutes)
console.log("🔥 AUTH ROUTES LOADED")

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