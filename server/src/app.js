import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
import codeforcesRoutes from "./routes/codeforces.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import cors from "cors";

dotenv.config();
const app = express();


app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(express.json());
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to CodeTrack API");
});

export default app;