"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const objective_routes_1 = __importDefault(require("./routes/objective.routes"));
const keyresult_routes_1 = __importDefault(require("./routes/keyresult.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const bsc_routes_1 = __importDefault(require("./routes/bsc.routes"));
const causal_routes_1 = __importDefault(require("./routes/causal.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const initiative_routes_1 = __importDefault(require("./routes/initiative.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const bulkUpload_routes_1 = __importDefault(require("./routes/bulkUpload.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/objectives', objective_routes_1.default);
app.use('/api/key-results', keyresult_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/bsc', bsc_routes_1.default);
app.use('/api', causal_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/initiatives', initiative_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/bulk-upload', bulkUpload_routes_1.default);
// Base route for sanity check
app.get('/', (req, res) => {
    res.json({ message: 'OKR & Balanced Scorecard API is running.' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
