"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGO_URI);
        logger_1.logger.info(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Error: ${error.message}`);
        }
        else {
            logger_1.logger.error('An unknown error occurred');
        }
        process.exit(1);
    }
};
exports.default = connectDB;
