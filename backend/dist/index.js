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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
// Base route for sanity check
app.get('/', (req, res) => {
    res.json({ message: 'OKR & Balanced Scorecard API is running.' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
