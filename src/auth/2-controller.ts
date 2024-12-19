import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../utils";
import type { User } from "@prisma/client";
import type { RequestHandler, RouteParameters } from "express-serve-static-core";
import { NoTokenError } from "./error";

declare global {
    namespace Express {
        interface Request {
            user: Pick<User, "id" | "name" | "email" | "createdAt" | "updatedAt">,
        }
    }
}

//#region dependencies
export interface SigninService {
    (name: string, email: string, plainTextPassword: string): Promise<{
        token_refresh: string;
        token_access: string;
        id: string;
        email: string;
        name: string;
    }>
}

export interface SignoffService {
    (email: string, plainTextPassword: string): Promise<void>
}
export interface LoginService {
    (email: string, plainTextPassword: string): Promise<{
        token_refresh: string;
        token_access: string;
        id: string;
        email: string;
        name: string;
    }>
}
export interface RefreshService {
    (token: string): Promise<{
        token_refresh: string;
        token_access: string;
        id: string;
        email: string;
        name: string;
    }>
}
export interface AccessService {
    (token: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>
}
//#endregion

export async function signin(
    signin: SigninService,
    req: Request,
    res: Response,
) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        name: z.string().min(1),
        password: z.string().min(1),
    }));
    res.json(await signin(body.name, body.email, body.password));
}

export async function signoff(
    signoff: SignoffService,
    req: Request,
    res: Response,
) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        password: z.string().min(1),
    }));
    await signoff(body.email, body.password);
    res.json({});
}

export async function login(login: LoginService, req: Request, res: Response) {
    const body = validate(req.body, z.object({
        email: z.string().min(1).email(),
        password: z.string().min(1),
    }));
    res.json(await login(body.email, body.password));
}

export async function refresh(refresh: RefreshService, req: Request, res: Response) {
    const authorization = req.headers.authorization || "";
    if (
        !authorization.toUpperCase().startsWith("BEARER ") ||
        authorization.length <= 7
    ) {
        throw new NoTokenError();
    }
    const token = authorization.substring(7);
    res.json(await refresh(token));

}

export function middleware(access: AccessService): RequestHandler<RouteParameters<string>> {
    return async (req, res, next) => {
        const authorization = req.headers.authorization || "";
        if (
            !authorization.toUpperCase().startsWith("BEARER ") ||
            authorization.length <= 7
        ) {
            throw new NoTokenError();
        }
        const token = authorization.substring(7);
    
        req.user = await access(token);
        
        next();
    };
}
