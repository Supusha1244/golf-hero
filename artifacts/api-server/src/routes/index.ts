import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import scoresRouter from "./scores";
import subscriptionsRouter from "./subscriptions";
import charitiesRouter from "./charities";
import drawsRouter from "./draws";
import prizesRouter from "./prizes";
import winnersRouter from "./winners";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(scoresRouter);
router.use(subscriptionsRouter);
router.use(charitiesRouter);
router.use(drawsRouter);
router.use(prizesRouter);
router.use(winnersRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
