/**
 * Express Router configuration for project-related endpoints.
 * 
 * @module ProjectRoutes
 * 
 * The router handles the following categories of endpoints:
 * 
 * 1. Project Core Operations:
 *    - GET / - Retrieve all projects for current user (rate limited)
 *    - POST /create - Create a new project
 *    - GET /:projectId - Get project by ID
 *    - PATCH /:projectId - Update project details (leader/creator only)
 *    - DELETE /:projectId - Delete project (leader/creator only)
 * 
 * 2. Project Activity Operations:
 *    - GET /:projectId/activities - Get project activity logs
 * 
 * 3. Project Participant Operations:
 *    - GET /:projectId/participants - Get project participants
 *    - POST /:projectId/participants - Add participant (leader/creator only)
 *    - PATCH /:projectId/participants - Update participant role (leader/creator only)
 *    - DELETE /:projectId/participants - Remove/Leave participant
 * 
 * 4. Project Task Operations:
 *    - POST /:projectId/tasks - Create new task
 *    - GET /:projectId/tasks - Get all tasks
 *    - GET /:projectId/tasks/:taskId - Get specific task
 *    - PATCH /:projectId/tasks/:taskId - Update task
 *    - DELETE /:projectId/tasks/:taskId - Delete task (leader/creator only)
 * 
 * @remarks
 * - All routes require valid access token (accessTokenValidation middleware)
 * - Project-specific routes check for project existence and user access
 * - Some operations are restricted to project leaders/creators
 * - Project deletion cascades to related entities (participants, logs)
 * 
 * @todo
 * - Implement invite system routes (currently commented out)
 * - Enhance activity logging details
 * - Implement subtask routes
 */


import { Router } from "express";
import projectController from "~/controllers/project.controller";
import taskController from "~/controllers/task.controller";
import projectMiddlewares from "~/middlewares/project.middlewares";
import { validateCreateSubTask, validateCreateTask, validateUpdateTask, verifyTaskExists } from "~/middlewares/task.middlewares";
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
 * ============================================================================
 * IMPORTANT: Middleware to verify project existence and user access
 * Applied to all routes with :projectId parameter
 * ============================================================================
 */
projectRouters.use("/:projectId",
  wrapRequestHandler(projectMiddlewares.verifyProjectExists),
  wrapRequestHandler(projectMiddlewares.verifyUserProjectAccess)
);


/*
Description: Get project by ID
Method: GET
Params: id
*/
projectRouters.get(
  "/:projectId",
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
  wrapRequestHandler(projectController.getProjectParticipants)
);

/*
Description: Add participant to project - only leader/creator can add
Method: POST
Path: /:projectId/participants
*/
projectRouters.post(
  "/:projectId/participants",
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
  wrapRequestHandler(projectController.removeProjectParticipant)
);

/*
 * -------------------------------- Project invite routes --------------------------------
 */

// projectRouters.post(
//   "/:projectId/invite",
//   projectMiddlewares.validateInviteParticipant,
//   wrapRequestHandler(projectController.inviteParticipant)
// );

// projectRouters.post(
//   "/:projectId/accept-invite",
//   wrapRequestHandler(projectController.acceptProjectInvitation)
// );

// projectRouters.post(
//   "/:projectId/decline-invite",
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
  validateCreateTask,
  wrapRequestHandler(taskController.createTaskInProject)
);

/*
Description: Get all tasks in project
Method: GET
Path: /:projectId/tasks
*/
// Bổ sung lấy tất cả các task trong project, bao gồm cả subtask
projectRouters.get(
  "/:projectId/tasks",
  wrapRequestHandler(taskController.getTasksByProject)
);


/*
 * ============================================================================
 * IMPORTANT: Middleware to verify task existence for all task-specific routes
 * Applied to all routes with :taskId parameter
 * ============================================================================
 */
projectRouters.use("/:projectId/tasks/:taskId", wrapRequestHandler(verifyTaskExists));

/*
Description: Get task by ID in project
Method: GET
Path: /:projectId/tasks/:taskId
*/
projectRouters.get(
  "/:projectId/tasks/:taskId",
  wrapRequestHandler(taskController.getTaskById)
);

/*
Description: Update task in project 
Method: PATCH
Path: /:projectId/tasks/:taskId
*/
projectRouters.patch(
  "/:projectId/tasks/:taskId",
  validateUpdateTask,
  wrapRequestHandler(taskController.updateTaskById)
);

/*
Description: Delete task in project
Method: DELETE
Path: /:projectId/tasks/:taskId
*/
projectRouters.delete(
  "/:projectId/tasks/:taskId",
  wrapRequestHandler(
    projectMiddlewares.checkProjectPermissions(["leader", "creator"])
  ),
  wrapRequestHandler(taskController.deleteTaskById)
);

/*
 * -------------------------------- Project subtask routes --------------------------------
 */

/*
Description: Create a new subtask in task
Method: POST
*/
projectRouters.post("/:projectId/tasks/:taskId/subtasks",
  validateCreateSubTask,
  wrapRequestHandler(taskController.createSubTask)
);

/*
Description: Get all subtasks in task
Method: GET
*/
projectRouters.get("/:projectId/tasks/:taskId/subtasks",
  wrapRequestHandler(taskController.getSubTasks)
);

/*
Description: Move task to another task
Method: POST
*/
// projectRouters.post("/:projectId/tasks/:taskId/move",
//     validateMoveTask,
//     wrapRequestHandler(taskController.moveTask)
// );


export default projectRouters;
