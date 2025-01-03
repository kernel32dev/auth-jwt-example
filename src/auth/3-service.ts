import jsonwebtoken from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db";
import { getEnv } from "../utils";
import { BadCredentialsError, EmailAlreadyUsedError, InvalidTokenError } from "./error";
import { pbkdf2, randomBytes } from "node:crypto";
import { repository as defaultRepository } from "./4-repository";

//#region dependencies
export interface UserWithEmailExistsRepository {
    (email: string): Promise<boolean>
}
export interface GetUserByIdRepository {
    (id: string): Promise<{
        id: string,
        email: string,
        name: string,
        password: string,
        passwordSalt: string,
        createdAt: Date,
        updatedAt: Date,
    } | null>
}
export interface GetUserByEmailRepository {
    (email: string): Promise<{
        id: string,
        email: string,
        name: string,
        password: string,
        passwordSalt: string,
        createdAt: Date,
        updatedAt: Date,
    } | null>
}
export interface DeleteUserRepository {
    (userId: string): Promise<void>
}
export interface JwtSignService {
    (user: {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }): Promise<{
        token_refresh: string;
        token_access: string;
    }>
}
export interface JwtVerifyService {
    (token: string): Promise<unknown>
}
export interface passwordHashService {
    (plainText: string, salt: string): Promise<string>
}
export interface PasswordSaltService {
    (): Promise<string>
}
//#endregion

export function service(
    repository: {
        userWithEmailExists: UserWithEmailExistsRepository,
        getUserById: GetUserByIdRepository,
        getUserByEmail: GetUserByEmailRepository,
        deleteUser: DeleteUserRepository,
    } = defaultRepository,
    jwt: {
        jwtSign: JwtSignService,
        jwtVerify: JwtVerifyService,
    } = jwtService,
    password: {
        passwordHash: passwordHashService,
        passwordSalt: PasswordSaltService,
    } = passwordService,
) {
    return {
        signin: signin.bind(null, repository.userWithEmailExists, jwt.jwtSign, password.passwordSalt, password.passwordHash),
        signoff: signoff.bind(null, repository.getUserByEmail, repository.deleteUser, password.passwordHash),
        login: login.bind(null, repository.getUserByEmail, jwt.jwtSign, password.passwordHash),
        refresh: refresh.bind(null, repository.getUserById, jwt.jwtVerify),
        access: access.bind(null, jwt.jwtVerify),
    }
}

export const jwtService = {
    jwtSign,
    jwtVerify,
};

export const passwordService = {
    passwordHash,
    passwordSalt,
};

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

const passwordHashConfig = {
    pepper: getEnv("PASSWORD_PEPPER"),
    iterations: 10000,
    keyLength: 64,
    digest: "sha512",
};

//#endregion

export async function signin(
    userWithEmailExists: UserWithEmailExistsRepository,
    jwtSign: JwtSignService,
    genPasswordSalt: PasswordSaltService,
    hashPassword: passwordHashService,
    name: string,
    email: string,
    plainTextPassword: string,
) {
    if (await userWithEmailExists(email)) {
        throw new EmailAlreadyUsedError();
    }

    const passwordSalt = await genPasswordSalt();
    const password = await hashPassword(plainTextPassword, passwordSalt);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            passwordSalt,
        },
    });

    const tokens = await jwtSign(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function signoff(
    getUserByEmail: GetUserByEmailRepository,
    deleteUser: DeleteUserRepository,
    hashPassword: passwordHashService,
    email: string,
    plainTextPassword: string,
): Promise<void> {
    const user = await getUserByEmail(email);
    if (!user) throw new BadCredentialsError();

    const password = await hashPassword(plainTextPassword, user.passwordSalt);
    if (user.password != password) throw new BadCredentialsError();

    await deleteUser(user.id);
}

export async function login(
    getUserByEmail: GetUserByEmailRepository,
    jwtSignService: JwtSignService,
    hashPassword: passwordHashService,
    email: string,
    plainTextPassword: string,
) {
    const user = await getUserByEmail(email);
    if (!user) throw new BadCredentialsError();

    const password = await hashPassword(plainTextPassword, user.passwordSalt);
    if (user.password != password) throw new BadCredentialsError();

    const tokens = await jwtSignService(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function refresh(getUserById: GetUserByIdRepository, jwtVerify: JwtVerifyService, token: string) {
    const payload = await jwtVerify(token);

    const parsed = refreshToken.safeParse(payload);
    if (!parsed.success) {
        throw new InvalidTokenError();
    }
    const user = await getUserById(parsed.data.user);

    if (!user) {
        throw new InvalidTokenError();
    }

    const tokens = await jwtSign(user);
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
    };
}

export async function access(jwtVerify: JwtVerifyService, token: string) {

    const payload = await jwtVerify(token);

    const parsed = accessToken.safeParse(payload);
    if (!parsed.success) {
        console.warn(parsed.error);
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

export async function jwtSign(user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}): Promise<{
    token_refresh: string;
    token_access: string;
}> {
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
    function jwtSign(payload: string | Buffer | object, options: jsonwebtoken.SignOptions) {
        return new Promise<string>((resolve, reject) => {
            jsonwebtoken.sign(payload, jwtSecret, options, (err, token) => {
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
}

export function jwtVerify(token: string) {
    return new Promise<unknown>((resolve, reject) => {
        jsonwebtoken.verify(token, jwtSecret, (err, payload) => {
            if (err || payload === undefined) {
                reject(new InvalidTokenError());
                return;
            }
            if (typeof payload == "string") {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    reject(new InvalidTokenError());
                    return;
                }
            }
            resolve(payload);
        });
    });
}

//#endregion

//#region password hashing

export async function passwordSalt(): Promise<string> {
    return randomBytes(8).toString("base64url");
}

export function passwordHash(plainText: string, salt: string): Promise<string> {
    const {
        pepper: passwordPepper,
        iterations,
        keyLength,
        digest,
    } = passwordHashConfig;
    const fullSalt = Buffer.concat([
        Buffer.from(passwordPepper),
        Buffer.from(salt),
    ]);
    return new Promise((resolve, reject) => {
        pbkdf2(
            plainText,
            fullSalt,
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
