import { Request, Response } from "express";
import { TASKS_MESSAGES } from "~/constants/messages";
import { CREATED, OK } from "~/core/succes.response";
import { TokenPayload } from "~/models/requests/user.request";
import taskService from "~/services/task.service";

class TaskController {
    /*
     * -------------------------------- Project task controller --------------------------------
    */

    createTaskInProject = async (req: Request, res: Response) => {
        const { user_id } = req.decoded_authorization as TokenPayload;
        const projectId = req.params.projectId;
        const taskData = { ...req.body, project_id: projectId, creator: user_id };
        const result = await taskService.createTaskInProject(taskData);
        new CREATED({
            message: TASKS_MESSAGES.CREATE_TASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    getTasksByProject = async (req: Request, res: Response) => {
        const result = await taskService.getTasksByProject(req.params.projectId);
        new OK({
            message: TASKS_MESSAGES.GET_TASKS_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    getTaskById = async (req: Request, res: Response) => {
        const result = await taskService.getTaskById(req.params.taskId);
        new OK({
            message: TASKS_MESSAGES.GET_TASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    updateTaskById = async (req: Request, res: Response) => {
        const { user_id } = req.decoded_authorization as TokenPayload;
        const result = await taskService.updateTaskById(req.params.taskId, user_id, req.body);
        new OK({
            message: TASKS_MESSAGES.UPDATE_TASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    deleteTaskById = async (req: Request, res: Response) => {
        const { user_id } = req.decoded_authorization as TokenPayload;
        const result = await taskService.deleteTaskById(req.params.taskId, user_id);
        new OK({
            message: TASKS_MESSAGES.DELETE_TASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    /*
     * -------------------------------- Project subtask controller --------------------------------
     */

    createSubTask = async (req: Request, res: Response) => {
        const { user_id } = req.decoded_authorization as TokenPayload;
        const parentId = req.params.taskId;
        const projectId = req.params.projectId;
        const taskData = { ...req.body, project_id: projectId, parent_task: parentId, creator: user_id };
        const result = await taskService.createSubTask(taskData);
        new CREATED({
            message: TASKS_MESSAGES.CREATE_SUBTASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };

    getSubTasks = async (req: Request, res: Response) => {
        const result = await taskService.getSubTasks(req.params.taskId);
        new OK({
            message: TASKS_MESSAGES.GET_SUBTASKS_OF_TASK_SUCCESSFULLY,
            metadata: result,
        }).send(res);
    };
}

export default new TaskController();