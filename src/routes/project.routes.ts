import { Router } from "express";
import projectController from "~/controllers/project.controller";
import projectMiddlewares from "~/middlewares/project.middlewares";
import { accessTokenValidation } from "~/middlewares/user.middlewares";
import { ProjectQuerySchema } from "~/models/schemas/project.schema";
import { wrapRequestHandler } from "~/utils/wrapHandler";

const projectRouters = Router();

/*
Description: Get all projects for current user
Method: GET
*/
// có thể viết 1 middleware riêng để rate limit cho tất cả các route liên quan đến project
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
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectById)
);

/*
Description: Update a project - only leader/creator can update
Method: PATCH
Path: /:project_id
Body: { title?: string, description?: string, key?: string }
*/
projectRouters.patch(
  "/:projectId",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  projectMiddlewares.validateUpdateProject,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(projectController.updateProjectById)
);

/*
Description: Delete a project - only leader/creator can delete
Method: DELETE  
Path: /:project_id
*/
// sau khi xóa project thì cần xóa tất cả các task, conversation, attachment, activity liên quan. Hiện tại chỉ xử lý xóa project thì xóa các participant, log.
projectRouters.delete(
  "/:projectId",
  accessTokenValidation,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(projectController.deleteProjectById)
);

/*
Description: Get project activity logs
Method: GET
Path: /:project_id/activities
*/
// cần chỉnh sửa để lấy chi tiết hơn các hoạt động của project
projectRouters.get(
  "/:projectId/activities",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectActivities)
);

/*
Description: Get project participants
Method: GET
Path: /:projectId/participants
*/
projectRouters.get(
  "/:projectId/participants",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectParticipants)
);

/*
Description: Add participant to project - only leader/creator can add
Method: POST
Path: /:projectId/participants
*/
projectRouters.post(
  "/:projectId/participants",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  projectMiddlewares.validateAddParticipantToProject,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(projectController.addProjectParticipant)
);

/*
Description: Update participant role - only leader/creator can update
Method: PATCH
Path: /:projectId/participants
*/
projectRouters.patch(
  "/:projectId/participants",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  projectMiddlewares.validateUpdateParticipantRole,
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(projectController.updateProjectParticipantRole)
);

/*
Description: Leave/Remove participant from project
Method: DELETE
Path: /:projectId/participants
*/
projectRouters.delete(
  "/:projectId/participants",
  accessTokenValidation,
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.removeProjectParticipant)
);

export default projectRouters;
