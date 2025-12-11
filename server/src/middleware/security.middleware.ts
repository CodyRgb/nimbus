import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize object by removing keys that start with '$' or contain '.'
 * This is a recursive function that modifies the object in-place.
 */
const clean = (obj: any): any => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key) || key.includes('.')) {
                delete obj[key];
            } else {
                clean(obj[key]);
            }
        }
    }
    return obj;
};

/**
 * Middleware to sanitize data against NoSQL query injection
 * Compatible with Express 5 (does not reassign req.query)
 */
export const mongoSanitize = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) clean(req.body);
    if (req.query) clean(req.query);
    if (req.params) clean(req.params);
    next();
};
