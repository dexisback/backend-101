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




//express does not automatically catch rejected promise (fxck u)
// so, the error escapes, your error middleware does NOT run, server may crash
//we want this, router.get("/", controller.top)
//and if controller.top throws error, we want error to go automatically to next(err)
//this way we are able to catch errors
