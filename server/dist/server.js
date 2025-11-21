"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var dotenv_1 = __importDefault(require("dotenv"));
var db_1 = __importDefault(require("./config/db"));
// Load env vars
dotenv_1.default.config();
// Connect to database
(0, db_1.default)();
var app = (0, express_1.default)();
// Body parser
app.use(express_1.default.json());
app.get('/', function (req, res) {
    res.send('API is running...');
});
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("Server running in ".concat(process.env.NODE_ENV, " mode on port ").concat(PORT));
});
