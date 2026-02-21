//express does not catch async errors automatically
//they must be forwarded onto next(err)

import type { Request, Response, NextFunction } from "express";

export function asyncHandler (
    fn: (req: Request, res: Response, next: NextFunction)=> Promise<any>
) {
    return function (req: Request, res: Response, next: NextFunction) {
        fn(req, res, next).catch(next)
    }
}







