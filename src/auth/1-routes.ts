import { Router, Request, Response } from "express";
import { catchApiExceptions as api } from "../error";
import { controller as defaultController } from "./2-controller";

//#region dependencies
export interface Controller {
    (req: Request, res: Response): void;
}
//#endregion

export function routes(controller: {
    signin: Controller,
    signoff: Controller,
    login: Controller,
    refresh: Controller,
} = defaultController()) {
    const routes = Router();

    routes.post("/signin", api(controller.signin));
    routes.post("/signoff", api(controller.signoff));
    routes.post("/login", api(controller.login));
    routes.post("/refresh", api(controller.refresh));

    return routes;
}
