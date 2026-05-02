import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import ticketsRouter from "./tickets.js";
import clientsRouter from "./clients.js";
import sitesRouter from "./sites.js";
import employeesRouter from "./employees.js";
import vendorsRouter from "./vendors.js";
import contactsRouter from "./contacts.js";
import jobsRouter from "./jobs.js";
import usersRouter from "./users.js";
import tagsRouter from "./tags.js";
import dashboardRouter from "./dashboard.js";
import notificationsRouter from "./notifications.js";
import automationRouter from "./automation.js";
import attachmentsRouter from "./attachments.js";
import webhooksRouter from "./webhooks.js";
import simulateRouter from "./simulate.js";

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
router.use(notificationsRouter);
router.use(automationRouter);
router.use(attachmentsRouter);
router.use(webhooksRouter);
router.use(simulateRouter);

export default router;
