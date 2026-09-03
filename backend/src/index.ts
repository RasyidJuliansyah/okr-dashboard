import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import objectiveRoutes from "./routes/objective.routes";
import keyResultRoutes from "./routes/keyresult.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import bscRoutes from "./routes/bsc.routes";
import causalRoutes from "./routes/causal.routes";
import userRoutes from "./routes/user.routes";
import initiativeRoutes from "./routes/initiative.routes";
import departmentRoutes from "./routes/department.routes";
import bulkUploadRoutes from "./routes/bulkUpload.routes";
import annualKeyResultRoutes from "./routes/annualKeyResult.routes";
import notificationRoutes from "./routes/notification.routes";
import kpiRoutes from "./routes/kpi.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
  }),
);
app.options("*", cors({ origin: true, credentials: true }));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/objectives", objectiveRoutes);
app.use("/api/key-results", keyResultRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bsc", bscRoutes);
app.use("/api", causalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/initiatives", initiativeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/bulk-upload", bulkUploadRoutes);
app.use("/api/annual-key-results", annualKeyResultRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/kpis", kpiRoutes);

// Base route for sanity check
app.get("/", (req, res) => {
  res.json({ message: "OKR & Balanced Scorecard API is running." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
