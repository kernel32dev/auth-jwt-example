import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db";
import { getEnv } from "../utils";
import * as repository from "./4-repository";
import { BadCredentialsError, EmailAlreadyUsedError, InvalidTokenError } from "./error";
import { pbkdf2, randomBytes } from "node:crypto";

//#region constants

const refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 30; // 30 dias
const accessTokenMaxAgeSeconds = 60 * 60 * 24; // 1 dia

const refreshToken = z.object({
    type: z.string().refine((x) => x == "refresh", 'type deve ser "refresh"'),
    user: z.string().min(1),
});

const accessToken = z.object({
    type: z.string().refine((x) => x == "access", 'type deve ser "access"'),
    id: z.string().min(1),
    email: z.string().min(1),
    name: z.string().min(1),
    createdAt: z.string().transform(Date),
    updatedAt: z.string().transform(Date),
});

const jwtSecret = getEnv("JWT_SECRET");

const passwordHashingConfig = {
    pepper: getEnv("PASSWORD_PEPPER"),
    iterations: 10000,
    keyLength: 64,
    digest: "sha512",
};

//#endregion

export async function signin(
    name: string,
    email: string,
    plainTextPassword: string,
) {
    if (await repository.userWithEmailExists(email)) {
        throw new EmailAlreadyUsedError();
    }

    const passwordSalt = genPasswordSalt();
    const password = await hashPassword(plainTextPassword, passwordSalt);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            passwordSalt,
        },
    });

    const tokens = await signTokens(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function signoff(
    email: string,
    plainTextPassword: string,
): Promise<void> {
    const user = await repository.getUserByEmail(email);
    if (!user) throw new BadCredentialsError();

    const password = await hashPassword(plainTextPassword, user.passwordSalt);
    if (user.password != password) throw new BadCredentialsError();
}

export async function login(
    email: string,
    plainTextPassword: string,
) {
    const user = await repository.getUserByEmail(email);
    if (!user) throw new BadCredentialsError();

    const password = await hashPassword(plainTextPassword, user.passwordSalt);
    if (user.password != password) throw new BadCredentialsError();

    const tokens = await signTokens(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function refresh(token: string) {
    const [verifyErr, payload] = await jwtVerifiy(token);

    const parsed = refreshToken.safeParse(payload);

    if (verifyErr || !parsed.success) {
        throw new InvalidTokenError();
    }

    const user = await prisma.user.findUnique({
        where: {
            id: parsed.data.user,
        },
    });

    if (!user) {
        throw new InvalidTokenError();
    }

    const tokens = await signTokens(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function access(token: string) {
    
    const [verifyErr, payload] = await jwtVerifiy(token);

    const parsed = accessToken.safeParse(payload);

    if (verifyErr || !parsed.success) {
        if (verifyErr) console.warn(verifyErr);
        if (!parsed.success) console.warn(parsed.error);
        throw new InvalidTokenError();
    }

    return {
        id: parsed.data.id,
        email: parsed.data.email,
        name: parsed.data.name,
        createdAt: new Date(parsed.data.createdAt),
        updatedAt: new Date(parsed.data.updatedAt),
    };
}

//#region jwt

async function signTokens(user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    const accessTokenData = {
        type: "access",
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    } satisfies z.input<typeof accessToken>;

    const refreshTokenData = {
        type: "refresh",
        user: user.id,
    } satisfies z.input<typeof refreshToken>

    const token_refresh = jwtSign(refreshTokenData, { expiresIn: refreshTokenMaxAgeSeconds });
    const token_access = jwtSign(accessTokenData, { expiresIn: accessTokenMaxAgeSeconds });
    return {
        token_refresh: await token_refresh,
        token_access: await token_access,
    };
}

function jwtVerifiy(token: string) {
    return new Promise<
        [jwt.VerifyErrors, null] | [null, string | jwt.JwtPayload]
    >((resolve) => {
        jwt.verify(token, jwtSecret, (err, payload) => {
            if (err) {
                resolve([err, null]);
                return;
            }
            if (payload === undefined) {
                resolve([
                    new jwt.JsonWebTokenError("jwt verification failed with no error"),
                    null,
                ]);
                return;
            }
            resolve([null, payload]);
        });
    });
}

function jwtSign(payload: string | Buffer | object, options: jwt.SignOptions) {
    return new Promise<string>((resolve, reject) => {
        jwt.sign(payload, jwtSecret, options, (err, token) => {
            if (err) {
                reject(err);
                return;
            }
            if (token === undefined) {
                reject(new Error("jwt signing failed with no error"));
                return;
            }
            resolve(token);
        });
    });
}

//#endregion

//#region password hashing

export function genPasswordSalt(): string {
    return randomBytes(8).toString("base64url");
}

export function hashPassword(
    plainText: string,
    passwordSalt: string
): Promise<string> {
    const {
        pepper: passwordPepper,
        iterations,
        keyLength,
        digest,
    } = passwordHashingConfig;
    const salt = Buffer.concat([
        Buffer.from(passwordPepper),
        Buffer.from(passwordSalt),
    ]);
    return new Promise((resolve, reject) => {
        pbkdf2(
            plainText,
            salt,
            iterations,
            keyLength,
            digest,
            (err, derivedKey) => {
                if (!err) {
                    resolve(derivedKey.toString("base64url"));
                } else {
                    reject(err);
                }
            }
        );
    });
}

//#endregion
