import "dotenv/config"
import mongoose from "mongoose"
import { format, subDays } from "date-fns"
import { connectDB } from "../config/db.js"
import User from "../models/User.js"
import Habit from "../models/Habit.js"
import HabitLog from "../models/HabitLog.js"
import AIInsight from "../models/AIInsight.js"
import { morningMotivation } from "../controllers/aiController.js"


const EMAIL = "kavumadennis11@gmail.com";
const PASSWORD = "Loading";
const NAME = "Kavuma Dennis";

const HABITS = [
    {
        name: "Drink 2L of water",
        description: "Stay hydrated throughout the day.",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        color: "#0ea5e9",
        icon: "💧",
        _streakProb: 0.95
    },
    {
        name: "Morning run",
        description: "30-minute run before breakfast.",
        category: "Fitness",
        frequency: "weekly",
        targetDays: 3,
        color: "#ef4444",
        icon: "🏃‍♀️",
        _streakProb: 0.72,
        _pattern: "weekends",
        _brokeAt: 18
    },
    {
        name: "Read 20 minutes",
        description: "Fiction or non-fiction reading session.",
        category: "Learning",
        frequency: "daily",
        targetDays: 7,
        color: "#6366f1",
        icon: "📚",
        _streakProb: 0.6
    },
    {
        name: "Meditation",
        description: "Mindful breathing and focus training.",
        category: "Mindfulness",
        frequency: "daily",
        targetDays: 7,
        color: "#10b981",
        icon: "🧘‍♂️",
        _streakProb: 0.8,
        _brokeAt: 12
    },
    {
        name: "Sleep before 11 PM",
        description: "Maintain consistent sleep schedule.",
        category: "Health",
        frequency: "daily",
        targetDays: 6,
        color: "#8b5cf6",
        icon: "🌙"
    },
    {
        name: "Workout session",
        description: "Strength or cardio training.",
        category: "Fitness",
        frequency: "weekly",
        targetDays: 4,
        color: "#f97316",
        icon: "🏋️",
        _streakProb: 0.68,
        _pattern: "alternating days"
    },
    {
        name: "No social media mornings",
        description: "Avoid social media for first hour after waking up.",
        category: "Productivity",
        frequency: "daily",
        targetDays: 5,
        color: "#64748b",
        icon: "📵"
    },
    {
        name: "Learn coding",
        description: "Build projects and practice coding.",
        category: "Learning",
        frequency: "daily",
        targetDays: 5,
        color: "#0f172a",
        icon: "💻",
        _streakProb: 0.77,
        _brokeAt: 25
    },
    {
        name: "Gratitude journaling",
        description: "Write 3 things you're grateful for.",
        category: "Mindfulness",
        frequency: "daily",
        targetDays: 7,
        color: "#f43f5e",
        icon: "✍️",
        _streakProb: 0.85
    },
    {
        name: "Eat healthy meals",
        description: "Avoid junk food and focus on balanced meals.",
        category: "Health",
        frequency: "daily",
        targetDays: 6,
        color: "#22c55e",
        icon: "🥗",
        _streakProb: 0.9,
        _pattern: "weekdays"
    }
];

const todayKey = () => format(new Date(), "yyyy-MM-dd")

const buildLogs = (habit, totalDays = 90) => {
    const logs = []
    const today = new Date()
    for (let i = 0; i < totalDays; i++) {
        const d = subDays(today, i)
        const dow = d.getDay()
        const key = format(d, "yyyy-MM-dd")
        let p = habit._streakProb
        if (habit._pattern === "weekdays") {
            if (dow === 0 || dow === 6) p *= 0.35
        }
        if (habit._pattern === "dropoff") {
            if (i < 14) p *= 0.25
        }
        if (habit._brokeAt && i >= habit._brokeAt - 2 && i <= habit._brokeAt + 2) {
            continue
        }

        const seed = Math.sin(i * 9301 + habit.name.length * 49297) * 233280
        const rnd = seed - Math.floor(seed)
        if (rnd < p) logs.push({ completedDate: key })
    }
    return logs
}

const run = async () => {
    await connectDB()

    let user = await User.findOne({ email: EMAIL })
    if (user) {
        console.log(`Found existing user ${EMAIL} - clearing their data...`);
        await Habit.deleteMany({ userId: user._id })
        await HabitLog.deleteMany({ userId: user._id })
        await AIInsight.deleteMany({ userId: user._id })
        user.name = NAME
        user.avatar = NAME.charAt(0).toUpperCase()
        user.morningMotivation = true
        user.password = PASSWORD
        await user.save()
    } else {
        user = await User.create({
            name: NAME,
            email: EMAIL,
            password: PASSWORD,
            avatar: NAME.charAt(0).toUpperCase(),
            morningMotivation: true
        })
        console.log(`Created user ${EMAIL}`);
    }

    const createdHabits = []
    for (let i = 0; i < HABITS.length; i++) {
        const h = HABITS[i]
        const habit = await Habit.create({
            userId: user._id,
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            targetDays: h.targetDays,
            color: h.color,
            icon: h.icon,
            order: 1,
            createdAt: subDays(new Date(), 89),
            updatedAt: subDays(new Date(), 89)
        })
        habit.createdAt = subDays(new Date(), 89)
        await habit.save({ timestamps: false })
        createdHabits.push({ habit, config: h })
    }

    let totalLogs = 0
    for (const { habit, config } of createdHabits) {
        const logs = buildLogs(config);
        if (!logs.length) continue
        const docs = logs.map((l) => ({
            userId: user._id,
            habitId: habit._id,
            completedDate: l.completedDate
        }))
        await HabitLog.insertMany(docs, { ordered: false }).catch(() => { })
        totalLogs += docs.length
    }

    const today = todayKey()
    const todayDoneHabits = createdHabits.slice(0, 4).map((c) => c.habit)
    for (const h of todayDoneHabits) {
        await HabitLog.updateOne(
            { userId: user._id, habitId: h._id, completedDate: today },
            { $setOnInsert: { userId: user._id, completedDate: today } },
            { upsert: true }
        )
    }

    console.log(`\nSeed complete`)
    console.log(`User: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
    console.log(`Habits: ${createdHabits.length}`);
    console.log(`Logs: ~${totalLogs}`);
    await mongoose.disconnect()
}

run().catch(async (err) => {
    console.error("Seed failed", err);
    await mongoose.disconnect()
    process.exit(1)
})