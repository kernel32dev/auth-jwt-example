import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../utils";
import type { User } from "@prisma/client";
import { RequestHandler, RouteParameters } from "express-serve-static-core";
import * as service from "./3-service";
import { NoTokenError } from "./error";

declare global {
    namespace Express {
        interface Request {
            user: Pick<User, "id" | "name" | "email" | "createdAt" | "updatedAt">,
        }
    }
}

export async function signin(req: Request, res: Response) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        name: z.string().min(1),
        password: z.string().min(1),
    }));
    await service.signin(body.name, body.email, body.password);
}

export async function signoff(req: Request, res: Response) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        password: z.string().min(1),
    }));
    await service.signoff(body.email, body.password);
}

export async function login(req: Request, res: Response) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        password: z.string().min(1),
    }));
    await service.login(body.email, body.password);
}

export async function refresh(req: Request, res: Response) {
    const authorization = req.headers.authorization || "";
    if (
        !authorization.toUpperCase().startsWith("BEARER ") ||
        authorization.length <= 7
    ) {
        throw new NoTokenError();
    }
    const token = authorization.substring(7);
    await service.refresh(token);

}

export const authMiddleware: RequestHandler<RouteParameters<string>> = async (req, res, next) => {
    const authorization = req.headers.authorization || "";
    if (
        !authorization.toUpperCase().startsWith("BEARER ") ||
        authorization.length <= 7
    ) {
        throw new NoTokenError();
    }
    const token = authorization.substring(7);

    req.user = await service.access(token);
    
    next();
}