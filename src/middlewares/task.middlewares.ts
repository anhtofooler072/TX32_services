// src/middlewares/task.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { checkSchema, Schema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { PROJECTS_MESSAGES, TASKS_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS_CODES from '~/core/statusCodes';
import { ITask, PriorityLevel, TaskStatus, TaskType } from '~/models/schemas/task.schema';
import databaseServices from '~/services/database.service';
import projectService from '~/services/project.service';
import taskService from '~/services/task.service';
import usersService from '~/services/user.service';
import { ErrorWithStatus } from '~/utils/errors.util';
import { validate } from '~/utils/validations.util';

declare module "express-serve-static-core" {
    interface Request {
        task?: ITask;
    }
}

// Schema validation cho tạo task mới
const createTaskSchema: Schema = {
    title: {
        trim: true,
        notEmpty: {
            errorMessage: "Title is required",
        },
        isLength: {
            options: { min: 1, max: 255 },
            errorMessage: "Title must be between 1 and 255 characters",
        },
    },
    type: {
        notEmpty: {
            errorMessage: "Task type is required",
        },
        isIn: {
            options: [Object.values(TaskType)],
            errorMessage: "Invalid task type",
        },
    },
    assignee: {
        optional: true,
        custom: {
            options: async (value, { req }) => {
                // Kiểm tra user có tồn tại hay không
                const userExists = await usersService.checkUserExistById(value);
                if (!userExists) {
                    throw new Error(USERS_MESSAGES.USER_NOT_FOUND);
                }

                if (!req.params || !req.params.projectId) {
                    throw new Error(PROJECTS_MESSAGES.PROJECT_ID_REQUIRED);
                }
                const projectId = req.params.projectId;

                const hasAccess = await projectService.checkUserAccessToProject(value, projectId);
                if (!hasAccess) {
                    throw new Error(PROJECTS_MESSAGES.USER_NOT_PARTICIPANT);
                }

                return true;
            },
        },
    },
    status: {
        optional: true,
        isIn: {
            options: [Object.values(TaskStatus)],
            errorMessage: "Invalid status",
        },
    },
    priority: {
        optional: true,
        isIn: {
            options: [Object.values(PriorityLevel)],
            errorMessage: "Invalid priority level",
        },
    },
    progress: {
        optional: true,
        isInt: {
            options: { min: 0, max: 100 },
            errorMessage: "Progress must be between 0 and 100",
        },
    },
    dueDate: {
        optional: true,
        isISO8601: {
            errorMessage: "Invalid date format",
        },
    },
};

// Middleware validations
export const validateCreateTask = validate(checkSchema(createTaskSchema));

export const validateUpdateTask = validate(checkSchema({
    ...createTaskSchema,
    title: { ...createTaskSchema.title, optional: true },
    type: { ...createTaskSchema.type, optional: true },
    assignee: { ...createTaskSchema.assignee, optional: true },
    creator: {
        custom: {
            options: () => {
                throw new Error("Updating creator is not allowed");
            },
        },
    },
}));

export const verifyTaskExists = async (req: Request, res: Response, next: NextFunction) => {
    const taskId = req.params.taskId;
    const task = await databaseServices.tasks.findOne({
        _id: new ObjectId(taskId),
        deleted: false,
    });

    if (!task) {
        throw new ErrorWithStatus({
            message: TASKS_MESSAGES.TASK_NOT_FOUND,
            status: HTTP_STATUS_CODES.NOT_FOUND
        });
    }

    req.task = task;
    next();
};

// Middleware kiểm tra khi tạo subtask
export const validateCreateSubTask = validate(checkSchema({
    ...createTaskSchema,
    parent_task: {
        notEmpty: {
            errorMessage: "Parent task is required",
        },
        custom: {
            options: async (value, { req }) => {
                // Kiểm tra task cha có tồn tại hay không
                const parentTask = await taskService.getTaskById(value);

                if (!parentTask || parentTask.deleted) {
                    throw new Error("Parent task does not exist or has been deleted");
                }

                // Task cha không được là Subtask
                if (parentTask.type === TaskType.SUBTASK) {
                    throw new Error("Parent task cannot be a subtask");
                }

                // Task cha phải thuộc cùng một project
                if (!req.params?.projectId || parentTask.project_id.toString() !== req.params.projectId) {
                    throw new Error("Parent task must belong to the same project");
                }

                return true;
            },
        },
    },
    type: {
        optional: true,
        custom: {
            options: (value) => {
                if (value !== TaskType.SUBTASK) {
                    throw new Error("Type must be Subtask");
                }
                return true;
            },
        },
    },
}));

// // Middleware kiểm tra khi di chuyển task sang parent khác
// export const validateMoveTask = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const taskId = req.params.taskId;
//         const newParentId = req.body.newParentId;

//         // Kiểm tra task không thể là parent của chính nó
//         if (taskId === newParentId) {
//             throw new ErrorWithStatus({
//                 message: 'Task cannot be its own parent',
//                 status: HTTP_STATUS_CODES.BAD_REQUEST
//             });
//         }

//         const [task, newParent] = await Promise.all([
//             taskService.getTaskById(new ObjectId(taskId)),
//             taskService.getTaskById(new ObjectId(newParentId))
//         ]);

//         // Kiểm tra tồn tại
//         if (!task || !newParent) {
//             throw new ErrorWithStatus({
//                 message: 'Task or new parent not found',
//                 status: HTTP_STATUS_CODES.NOT_FOUND
//             });
//         }

//         // Kiểm tra project phải giống nhau
//         if (!task.project_id.equals(newParent.project_id)) {
//             throw new ErrorWithStatus({
//                 message: 'Cannot move task to different project',
//                 status: HTTP_STATUS_CODES.BAD_REQUEST
//             });
//         }

//         // Kiểm tra không tạo circular dependency
//         if (newParent.ancestors.includes(task._id)) {
//             throw new ErrorWithStatus({
//                 message: 'Moving this task would create a circular dependency',
//                 status: HTTP_STATUS_CODES.BAD_REQUEST
//             });
//         }

//         next();
//     } catch (error) {
//         next(error);
//     }
// };

