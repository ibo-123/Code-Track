import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
import codeforcesRoutes from "./routes/codeforces.route.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to CodeTrack API");
});

export default app;