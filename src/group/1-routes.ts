import { Router, Request, Response } from "express";
import { catchApiExceptions as api } from "../error";
import { controller as defaultController } from "./2-controller";

//#region dependencies
export interface Controller {
    (req: Request, res: Response): Promise<void>;
}
export interface ControllerWithGroupId {
    (req: Request<{ group_id: string }>, res: Response): Promise<void>;
}
//#endregion

export function routes(controller: {
    listGroup: Controller,
    createGroup: Controller,
    getGroup: ControllerWithGroupId,
    updateGroup: ControllerWithGroupId,
    deleteGroup: ControllerWithGroupId,
    joinGroup: ControllerWithGroupId,
    leaveGroup: ControllerWithGroupId,
    drawGroup: ControllerWithGroupId,
} = defaultController()) {
    const routes = Router();

    routes.get("/group", api(controller.listGroup));
    routes.post("/group", api(controller.createGroup));
    routes.get("/group/:group_id", api(controller.getGroup));
    routes.put("/group/:group_id", api(controller.updateGroup));
    routes.delete("/group/:group_id", api(controller.deleteGroup));

    routes.post("/group/:group_id/join", api(controller.joinGroup));
    routes.post("/group/:group_id/leave", api(controller.leaveGroup));
    routes.post("/group/:group_id/draw", api(controller.drawGroup));

    return routes;
}
