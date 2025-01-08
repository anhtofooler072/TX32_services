import { Router } from "express";
import projectController from "~/controllers/project.controller";
import projectMiddlewares from "~/middlewares/project.middlewares";
import { accessTokenValidation } from "~/middlewares/user.middlewares";
import { ProjectQuerySchema } from "~/models/schemas/project.schema";
import { wrapRequestHandler } from "~/utils/wrapHandler";

const projectRouters = Router();

/*
Description: Get all projects the authenticated user is participating in
Method: GET
*/
projectRouters.get(
    "/",
    accessTokenValidation,
    projectMiddlewares.createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20,
    }),
    projectMiddlewares.validateProjectQuery(ProjectQuerySchema),
    wrapRequestHandler(projectController.getAllParticipatingProjects)
);

/*
Description: This route is used to create a new project
Method: POST
Body: { "name": "string", "description": "string", "due_date": ISO08601}
*/
projectRouters.post(
    "/create",
    accessTokenValidation,
    projectMiddlewares.createProjectValidation,
    wrapRequestHandler(projectController.createNewProject)
);

/*
Description: Get project by ID
Method: GET
Params: id
*/
projectRouters.get(
    "/:projectId",
    accessTokenValidation,
    wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
    wrapRequestHandler(projectController.getProjectById)
);

export default projectRouters;
