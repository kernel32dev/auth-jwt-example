import { AppError, CONFLICT, UNAUTHORIZED } from "../error";

export class EmailAlreadyUsedError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "EmailAlreadyUsedError", description)
    }
}

export class BadCredentialsError extends AppError {
    constructor(description?: string) {
        super(UNAUTHORIZED, "BadCredentialsError", description)
    }
}

export class NoTokenError extends AppError {
    constructor(description?: string) {
        super(UNAUTHORIZED, "NoTokenError", description)
    }
}

export class InvalidTokenError extends AppError {
    constructor(description?: string) {
        super(UNAUTHORIZED, "InvalidTokenError", description)
    }
}