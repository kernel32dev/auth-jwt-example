import cors from "cors";
import express from "express";
import * as auth from "./auth";
import { routes as groupRoutes } from "./group/1-routes";
import { catchApiExceptions } from "./error";

const port = 8080;
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(auth.routes.routes(
    auth.controller.signin.bind(null, 
        auth.service.signin.bind(null,
            auth.repository.userWithEmailExists,
            auth.service.jwtSignService,
            auth.service.genPasswordSalt,
            auth.service.hashPassword,
        )
    ),
    auth.controller.signoff.bind(null, 
        auth.service.signoff.bind(null,
            auth.repository.getUserByEmail,
            auth.repository.deleteUser,
            auth.service.hashPassword,
        )
    ),
    auth.controller.login.bind(null,
        auth.service.login.bind(null,
            auth.repository.getUserByEmail,
            auth.service.jwtSignService,
            auth.service.hashPassword,
        )
    ),
    auth.controller.refresh.bind(null,
        auth.service.refresh.bind(null,
            auth.service.jwtVerify,
        )
    ),
));
app.use(catchApiExceptions(auth.controller.middleware(
    auth.service.access.bind(null,
        auth.service.jwtVerify
    )
)));
app.use(groupRoutes);

app.listen(port, () => {
    console.log(`Escutando na porta ${port}`);
});
