import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import clientsRouter from "./clients";
import sitesRouter from "./sites";
import employeesRouter from "./employees";
import vendorsRouter from "./vendors";
import contactsRouter from "./contacts";
import jobsRouter from "./jobs";
import usersRouter from "./users";
import tagsRouter from "./tags";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ticketsRouter);
router.use(clientsRouter);
router.use(sitesRouter);
router.use(employeesRouter);
router.use(vendorsRouter);
router.use(contactsRouter);
router.use(jobsRouter);
router.use(usersRouter);
router.use(tagsRouter);
router.use(dashboardRouter);

export default router;
