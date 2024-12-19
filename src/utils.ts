import type { ZodType, ZodTypeDef } from "zod";
import { BAD_REQUEST, StatusException } from "./error";

export function getEnv(name: string): string {
    const value = process.env[name];
    if (!value)
        throw new Error(`a variável de ambiente ${name}, não foi configurada`);
    return value;
}

export function validate<A, B extends ZodTypeDef, C>(data: unknown, validator: ZodType<A, B, C>): A {
    const result = validator.safeParse(data);
    if (!result.success) {
        console.error(result.error);
        throw new StatusException(BAD_REQUEST, {
            error: "ZodError",
            description: "ocorreu um erro ao validar o request com zod",
            zod: result.error.errors,
        });
    }
    return result.data;
}
