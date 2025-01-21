import { Router } from "express";
import projectController from "~/controllers/project.controller";
import projectMiddlewares from "~/middlewares/project.middlewares";
import { validateCreateTask, validateUpdateTask, verifyTaskExists } from "~/middlewares/task.middlewares";
import { accessTokenValidation } from "~/middlewares/user.middlewares";
import { ProjectQuerySchema } from "~/models/schemas/project.schema";
import { wrapRequestHandler } from "~/utils/wrapHandler";

const projectRouters = Router();

projectRouters.use(accessTokenValidation);

/*
 * -------------------------------- Project core routes --------------------------------
 */

/*
Description: Get all projects for current user
Method: GET
*/
// có thể viết 1 middleware riêng để rate limit cho tất cả các route liên quan đến project
projectRouters.get(
  "/",
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
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(projectController.deleteProjectById)
);

/*
 * -------------------------------- Project activity routes --------------------------------
 */

/*
Description: Get project activity logs
Method: GET
Path: /:project_id/activities
*/
// cần chỉnh sửa để lấy chi tiết hơn các hoạt động của project
projectRouters.get(
  "/:projectId/activities",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getProjectActivities)
);

/*
 * -------------------------------- Project participant routes --------------------------------
 */

/*
Description: Get project participants
Method: GET
Path: /:projectId/participants
*/
projectRouters.get(
  "/:projectId/participants",
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
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  projectMiddlewares.validateAddParticipantToProject,
  wrapRequestHandler(projectController.addProjectParticipant)
);

/*
Description: Update participant role - only leader/creator can update
Method: PATCH
Path: /:projectId/participants
*/
projectRouters.patch(
  "/:projectId/participants",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  projectMiddlewares.validateUpdateParticipantRole,
  wrapRequestHandler(projectController.updateProjectParticipantRole)
);

/*
Description: Leave/Remove participant from project
Method: DELETE
Path: /:projectId/participants
*/
projectRouters.delete(
  "/:projectId/participants",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.removeProjectParticipant)
);

/*
 * -------------------------------- Project invite routes --------------------------------
 */

// projectRouters.post(
//   "/:projectId/invite",
//   wrapRequestHandler(projectMiddlewares.verifyProjectExists),
//   projectMiddlewares.validateInviteParticipant,
//   wrapRequestHandler(projectController.inviteParticipant)
// );

// projectRouters.post(
//   "/:projectId/accept-invite",
//   wrapRequestHandler(projectMiddlewares.verifyProjectExists),
//   wrapRequestHandler(projectController.acceptProjectInvitation)
// );

// projectRouters.post(
//   "/:projectId/decline-invite",
//   wrapRequestHandler(projectMiddlewares.verifyProjectExists),
//   wrapRequestHandler(projectController.declineProjectInvitation)
// );

/*
 * -------------------------------- Project task routes --------------------------------
 */

/*
Description: Create a new task in project
Method: POST
Path: /:projectId/tasks
*/
projectRouters.post(
  "/:projectId/tasks",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  validateCreateTask,
  wrapRequestHandler(projectController.createTaskInProject)
);

/*
Description: Get all tasks in project
Method: GET
Path: /:projectId/tasks
*/
projectRouters.get(
  "/:projectId/tasks",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getTasksByProject)
);


// kiểm tra task có tồn tại không 
projectRouters.use("/:projectId/tasks/:taskId", wrapRequestHandler(verifyTaskExists));

/*
Description: Get task by ID in project
Method: GET
Path: /:projectId/tasks/:taskId
*/
projectRouters.get(
  "/:projectId/tasks/:taskId",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.getTaskById)
);

/*
Description: Update task in project 
Method: PATCH
Path: /:projectId/tasks/:taskId
*/
projectRouters.patch(
  "/:projectId/tasks/:taskId",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  validateUpdateTask,
  wrapRequestHandler(projectController.updateTaskById)
);

/*
Description: Delete task in project
Method: DELETE
Path: /:projectId/tasks/:taskId
*/
projectRouters.delete(
  "/:projectId/tasks/:taskId",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess),
  wrapRequestHandler(projectController.deleteTaskById)
);

export default projectRouters;
