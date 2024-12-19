import { AppError, CONFLICT, FORBIDDEN, NOT_FOUND } from "../error";

export class GroupByIdNotFoundError extends AppError {
    constructor(description?: string) {
        super(NOT_FOUND, "GroupByIdNotFound", description);
    }
}

export class NotGroupOwnerError extends AppError {
    constructor(description?: string) {
        super(FORBIDDEN, "NotGroupOwnerError", description);
    }
}

export class GroupAlreadyDrawnError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "GroupAlreadyDrawnError", description);
    }
}

export class AlreadyInGroupError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "AlreadyInGroupError", description);
    }
}

export class NotInGroupError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "NotInGroupError", description);
    }
}

export class NotEnoughMembersToDrawError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "NotEnoughMembersToDrawError", description);
    }
}

export class GroupNotDrawnError extends AppError {
    constructor(description?: string) {
        super(NOT_FOUND, "GroupNotDrawnError", description);
    }
}
