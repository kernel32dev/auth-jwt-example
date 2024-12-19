import cors from "cors";
import express from "express";
import * as auth from "./auth";
import * as group from "./group";
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
app.post("/me", (req, res) => {
    res.json(req.user);
});
app.use(
    group.routes.routes(
        group.controller.listGroup.bind(null,
            group.service.listGroup.bind(null,
                group.repository.listGroup,
            )
        ),
        group.controller.createGroup.bind(null,
            group.service.createGroup.bind(null,
                group.repository.createGroup,
            )
        ),
        group.controller.getGroup.bind(null,
            group.service.getGroup.bind(null,
                group.repository.getGroup,
            )
        ),
        group.controller.updateGroup.bind(null,
            group.service.updateGroup.bind(null,
                group.repository.getOwnerIdAndDrawDate,
                group.repository.updateGroup,
                group.repository.getGroup,
            )
        ),
        group.controller.deleteGroup.bind(null,
            group.service.deleteGroup.bind(null,
                group.repository.getOwnerIdAndDrawDate,
                group.repository.deleteGroup,
            )
        ),
        group.controller.joinGroup.bind(null,
            group.service.joinGroup.bind(null,
                group.repository.getOwnerIdAndDrawDate,
                group.repository.isMember,
                group.repository.createMemberRelationship,
            )
        ),
        group.controller.leaveGroup.bind(null,
            group.service.leaveGroup.bind(null,
                group.repository.getOwnerIdAndDrawDate,
                group.repository.deleteMember,
            )
        ),
        group.controller.drawGroup.bind(null,
            group.service.drawGroup.bind(null,
                group.repository.getOwnerIdAndDrawDate,
                group.repository.listMemberIdsOfGroup,
                group.repository.updateMemberFriend,
                group.repository.updateDrawDate,
            )
        ),
    )
);

app.listen(port, () => {
    console.log(`Escutando na porta ${port}`);
});
