import cors from "cors";
import express from "express";
import { routes as authRoutes } from "./auth/1-routes";
import { authMiddleware } from "./auth/2-controller";
import { routes as groupRoutes } from "./group/1-routes";
import { catchApiExceptions } from "./error";

const port = 8080;
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(authRoutes);
app.use(catchApiExceptions(authMiddleware));
app.use(groupRoutes);

app.listen(port, () => {
    console.log(`Escutando na porta ${port}`);
});
