import { Router, Request, Response } from "express";
import { catchApiExceptions as api } from "../error";

//#region dependencies
export interface Controller {
    (req: Request, res: Response): void;
}
//#endregion

export function routes(
    signin: Controller,
    signoff: Controller,
    login: Controller,
    refresh: Controller,
) {
    const routes = Router();

    routes.post("/signin", api(signin));
    routes.post("/signoff", api(signoff));
    routes.post("/login", api(login));
    routes.post("/refresh", api(refresh));

    return routes;
}
