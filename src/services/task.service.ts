import { CreateTaskReqBody, UpdateTaskReqBody } from "~/models/requests/task.request";
import databaseServices from "./database.service";
import { ObjectId } from "mongodb";
import Task, { ITask, PriorityLevel, TaskStatus, TaskType } from "~/models/schemas/task.schema";
import collections from "~/constants/collections";
import activityService from "./activity.service";
import { ErrorWithStatus } from "~/utils/errors.util";
import { PROJECTS_MESSAGES, TASKS_MESSAGES } from "~/constants/messages";
import HTTP_STATUS_CODES from "~/core/statusCodes";

class TaskService {
    private async updateParentTaskProgress(parentTaskId: ObjectId) {
        // Get all non-deleted subtasks of the parent
        const subtasks = await databaseServices.tasks.find({
            parentTask: parentTaskId,
            deleted: { $ne: true }
        }).toArray();

        if (subtasks.length === 0) {
            return;
        }

        // Calculate average progress
        const totalProgress = subtasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const averageProgress = Math.round(totalProgress / subtasks.length);

        // Update parent task progress
        await databaseServices.tasks.updateOne(
            { _id: parentTaskId },
            {
                $set: {
                    progress: averageProgress,
                    updated_at: new Date()
                }
            }
        );

        // Get the updated parent task to check if it also has a parent
        const parentTask = await databaseServices.tasks.findOne({ _id: parentTaskId });

        // Recursively update ancestor tasks if they exist
        if (parentTask && parentTask.parentTask) {
            await this.updateParentTaskProgress(parentTask.parentTask);
        }
    }

    private async isLeaderOrCreator(projectId: ObjectId, userId: string): Promise<void> {
        const project = await databaseServices.projects.findOne({
            _id: projectId,
            deleted: { $ne: true },
        });

        if (!project) {
            throw new ErrorWithStatus({
                message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
                status: HTTP_STATUS_CODES.NOT_FOUND,
            });
        }

        const participant = await databaseServices.participants.findOne({
            project_id: projectId,
            user_id: new ObjectId(userId),
            status: "active",
            deleted: false,
        });

        if (!participant || (project.creator.toString() !== userId && participant.role !== "leader")) {
            throw new ErrorWithStatus({
                message: PROJECTS_MESSAGES.UNAUTHORIZED_ACTION,
                status: HTTP_STATUS_CODES.FORBIDDEN,
            });
        }
    }

    async findTasks(query = {}) {
        return databaseServices.tasks
            .find({
                ...query,
                deleted: { $ne: true },
            })
            .toArray();
    }

    async checkTaskExist(id: string): Promise<boolean> {
        const task = await databaseServices.tasks.findOne({
            _id: new ObjectId(id),
        });
        return !!task;
    }

    async createTaskInProject(payload: CreateTaskReqBody) {
        const {
            title,
            description,
            project_id,
            creator,
            type,
            assignee,
            priority,
            dueDate,
        } = payload;

        const task = new Task({
            _id: new ObjectId(),
            title,
            description,
            project_id: new ObjectId(project_id),
            creator: new ObjectId(creator),
            type,
            assignee: assignee && assignee.trim() ? new ObjectId(assignee) : null,  // Add null check
            status: TaskStatus.TODO,
            priority,
            progress: 0,
            dueDate: dueDate ? new Date(dueDate) : null,
            parentTask: null,
            ancestors: [],
            level: 0,
            hasChildren: false,
            childCount: 0,
            created_at: new Date(),
            updated_at: new Date(),
            deleted: false,
            deletedAt: null,
        });

        const result = await databaseServices.tasks.insertOne(task);

        const creator_info = await databaseServices.users.findOne(
            { _id: new ObjectId(creator) },
            { projection: { username: 1, email: 1, avatar_url: 1 } }
        );

        await activityService.logActivity({
            projectId: project_id,
            entity: 'Task',
            action: "CREATE",
            modifiedBy: {
                _id: new ObjectId(creator),
                username: creator_info?.username || "",
                email: creator_info?.email || "",
                avatar_url: creator_info?.avatar_url || "",
            },
            changes: {
                taskId: { from: null, to: result.insertedId.toString() }
            },
            detail: `created task ${title}`,
        });

        return result
    }

    async getTaskById(taskId: string) {
        const result = await databaseServices.tasks
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(taskId),
                        deleted: { $ne: true }
                    }
                },
                // Get assignee details
                {
                    $lookup: {
                        from: collections.USER,
                        localField: 'assignee',
                        foreignField: '_id',
                        as: 'assignee',
                        pipeline: [{
                            $project: {
                                _id: 1,
                                username: 1,
                                email: 1,
                                avatar_url: 1
                            }
                        }]
                    }
                },
                {
                    $unwind: {
                        path: '$assignee',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Get parent task details
                {
                    $lookup: {
                        from: collections.TASK,
                        localField: 'parentTask',
                        foreignField: '_id',
                        as: 'parentTask',
                        pipeline: [{
                            $project: {
                                _id: 1,
                                title: 1,
                                status: 1,
                                priority: 1
                            }
                        }]
                    }
                },
                {
                    $unwind: {
                        path: '$parentTask',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Get ancestor tasks
                {
                    $lookup: {
                        from: collections.TASK,
                        localField: 'ancestors',
                        foreignField: '_id',
                        as: 'ancestors',
                        pipeline: [{
                            $project: {
                                _id: 1,
                                title: 1,
                                status: 1
                            }
                        }]
                    }
                },
                // Get subtasks
                {
                    $lookup: {
                        from: 'Task',
                        let: { taskId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$parentTask', '$$taskId']
                                    },
                                    deleted: { $ne: true }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    status: 1,
                                    priority: 1,
                                    progress: 1,
                                    assignee: 1,
                                    dueDate: 1
                                }
                            },
                            { $sort: { created_at: -1 } }
                        ],
                        as: 'subtasks'
                    }
                }
            ]).toArray();

        return result[0];
    }

    async getTasksByProject(projectId: string) {
        return databaseServices.tasks
            .aggregate([
                {
                    $match: {
                        project_id: new ObjectId(projectId),
                        deleted: { $ne: true }
                    }
                },
                // Join with users for creator
                {
                    $lookup: {
                        from: collections.USER,
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    username: 1,
                                    email: 1,
                                    avatar_url: 1
                                }
                            }
                        ]
                    }
                },
                // Unwind creator array to object
                {
                    $unwind: '$creator'
                },
                // Join with users for assignee if exists
                {
                    $lookup: {
                        from: collections.USER,
                        localField: 'assignee',
                        foreignField: '_id',
                        as: 'assignee',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    username: 1,
                                    email: 1,
                                    avatar_url: 1
                                }
                            }
                        ]
                    }
                },
                // Unwind assignee array to object or null
                {
                    $unwind: {
                        path: '$assignee',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Join with tasks for parent task if exists
                {
                    $lookup: {
                        from: collections.TASK,
                        localField: 'parentTask',
                        foreignField: '_id',
                        as: 'parentTask',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    status: 1,
                                    priority: 1
                                }
                            }
                        ]
                    }
                },
                // Unwind parentTask array to object or null
                {
                    $unwind: {
                        path: '$parentTask',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Sort by created date descending
                {
                    $sort: { created_at: -1 }
                }
            ]).toArray();
    }

    async updateTaskById(taskId: string, userId: string, updateData: UpdateTaskReqBody) {
        const existingTask = await databaseServices.tasks.findOne({
            _id: new ObjectId(taskId),
            deleted: { $ne: true }
        });

        if (!existingTask) {
            throw new ErrorWithStatus({
                message: TASKS_MESSAGES.TASK_NOT_FOUND,
                status: HTTP_STATUS_CODES.NOT_FOUND
            })
        }

        const updateFields: Partial<ITask> = {
            updated_at: new Date(),
        };

        Object.keys(updateData).forEach(key => {
            if (key !== 'assignee' && key !== 'dueDate') {
                (updateFields as any)[key] = (updateData as any)[key];
            }
        });

        if (updateData.assignee) {
            if (typeof updateData.assignee === 'string') {
                updateFields.assignee = new ObjectId(String(updateData.assignee));
            } else if (typeof updateData.assignee === 'object' && '_id' in updateData.assignee) {
                updateFields.assignee = new ObjectId(String((updateData.assignee as any)._id));
            }
        }

        if (updateData.dueDate) {
            updateFields.dueDate = new Date(updateData.dueDate);
        }

        if (updateData.progress !== undefined) {
            updateFields.progress = updateData.progress;
        }


        const updateResult = await databaseServices.tasks.findOneAndUpdate(
            { _id: new ObjectId(taskId) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        if (!updateResult) {
            throw new Error('Failed to update task');
        }

        if (updateData.progress !== undefined && existingTask.parentTask) {
            await this.updateParentTaskProgress(existingTask.parentTask);
        }

        // Log activity
        const modifiedBy = await databaseServices.users.findOne(
            { _id: new ObjectId(userId) },
            { projection: { username: 1, email: 1, avatar_url: 1 } }
        );

        await activityService.logActivity({
            projectId: existingTask.project_id.toString(),
            entity: 'Task',
            action: "UPDATE",
            modifiedBy: {
                _id: new ObjectId(userId),
                username: modifiedBy?.username || "",
                email: modifiedBy?.email || "",
                avatar_url: modifiedBy?.avatar_url || "",
            },
            changes: {
                taskId: { from: taskId, to: taskId }
            },
            detail: `updated task ${updateResult?.title || ''}`,
        });

        return this.getTaskById(taskId);
    }

    async deleteTaskById(taskId: string, userId: string) {
        const task = await databaseServices.tasks.findOne({
            _id: new ObjectId(taskId),
            deleted: { $ne: true },
        });

        if (!task) {
            throw new ErrorWithStatus({
                message: TASKS_MESSAGES.TASK_NOT_FOUND,
                status: HTTP_STATUS_CODES.NOT_FOUND,
            });
        }

        await this.isLeaderOrCreator(task.project_id, userId);

        const result = await databaseServices.tasks.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { deleted: true, deletedAt: new Date() } }
        );

        if (!result.modifiedCount) {
            throw new ErrorWithStatus({
                message: TASKS_MESSAGES.FAILED_TO_DELETE_TASK,
                status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            });
        }

        if (task.parentTask) {
            const remainingSubtasks = await databaseServices.tasks.countDocuments({
                parentTask: task.parentTask,
                deleted: { $ne: true },
            });

            await databaseServices.tasks.updateOne(
                { _id: task.parentTask },
                {
                    $set: {
                        hasChildren: remainingSubtasks > 0,
                        childCount: remainingSubtasks,
                    },
                }
            );
        }

        // Ghi log hoạt động
        await activityService.logActivity({
            projectId: task.project_id.toString(),
            entity: "task",
            action: "DELETE",
            modifiedBy: {
                _id: new ObjectId(userId),
                username: "",
                email: "",
                avatar_url: "",
            },
            changes: {
                taskId: { from: taskId, to: null },
            },
            detail: `Deleted task`,
        });

        return {
            taskId,
            message: TASKS_MESSAGES.DELETE_TASK_SUCCESSFULLY,
        };
    }

    // async updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
    //     const task = await databaseServices.tasks.findOne({
    //         _id: new ObjectId(taskId),
    //         deleted: { $ne: true },
    //     });

    //     if (!task) {
    //         throw new ErrorWithStatus({
    //             message: TASKS_MESSAGES.TASK_NOT_FOUND,
    //             status: HTTP_STATUS_CODES.NOT_FOUND,
    //         });
    //     }

    //     const updateResult = await databaseServices.tasks.findOneAndUpdate(
    //         { _id: new ObjectId(taskId) },
    //         { $set: { status, updated_at: new Date() } },
    //         { returnDocument: 'after' }
    //     );

    //     if (!updateResult) {
    //         throw new ErrorWithStatus({
    //             message: TASKS_MESSAGES.FAILED_TO_UPDATE_TASK_STATUS,
    //             status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    //         });
    //     }

    //     // Log activity
    //     const modifiedBy = await databaseServices.users.findOne(
    //         { _id: new ObjectId(userId) },
    //         { projection: { username: 1, email: 1, avatar_url: 1 } }
    //     );

    //     await activityService.logActivity({
    //         projectId: task.project_id.toString(),
    //         entity: 'Task',
    //         action: "UPDATE",
    //         modifiedBy: {
    //             _id: new ObjectId(userId),
    //             username: modifiedBy?.username || "",
    //             email: modifiedBy?.email || "",
    //             avatar_url: modifiedBy?.avatar_url || "",
    //         },
    //         changes: {
    //             taskId: { from: taskId, to: taskId }
    //         },
    //         detail: `updated task ${updateResult?.title || ''}`,
    //     });

    //     return this.getTaskById(taskId);
    // }

    // async moveTask(taskId: string, newParentId: string) {
    //     const session = await databaseServices.client.startSession();

    //     try {
    //         await session.withTransaction(async () => {
    //             const [task, newParent] = await Promise.all([
    //                 databaseServices.tasks.findOne({ _id: new ObjectId(taskId) }),
    //                 databaseServices.tasks.findOne({ _id: new ObjectId(newParentId) }),
    //             ]);

    //             if (!task || !newParent) {
    //                 throw new Error("Task or new parent not found");
    //             }

    //             // Update old parent
    //             if (task.parentTask) {
    //                 const oldParentUpdate = {
    //                     $inc: { childCount: -1 },
    //                 };

    //                 const oldParentSiblings = await databaseServices.tasks
    //                     .find({
    //                         parentTask: task.parentTask,
    //                         _id: { $ne: new ObjectId(taskId) },
    //                         deleted: { $ne: true },
    //                     })
    //                     .toArray();

    //                 if (oldParentSiblings.length === 0) {
    //                     oldParentUpdate["$set"] = { hasChildren: false };
    //                 }

    //                 await databaseServices.tasks.updateOne(
    //                     { _id: task.parentTask },
    //                     oldParentUpdate,
    //                     { session }
    //                 );
    //             }

    //             // Update task and its descendants
    //             const descendants = await databaseServices.tasks
    //                 .find({
    //                     ancestors: new ObjectId(taskId),
    //                     deleted: { $ne: true },
    //                 })
    //                 .toArray();

    //             const levelDiff = newParent.level + 1 - task.level;
    //             const newAncestors = [...newParent.ancestors, new ObjectId(newParentId)];

    //             // Update the task
    //             await databaseServices.tasks.updateOne(
    //                 { _id: new ObjectId(taskId) },
    //                 {
    //                     $set: {
    //                         parentTask: new ObjectId(newParentId),
    //                         ancestors: newAncestors,
    //                         level: newParent.level + 1,
    //                     },
    //                 },
    //                 { session }
    //             );

    //             // Update all descendants
    //             for (const descendant of descendants) {
    //                 await databaseServices.tasks.updateOne(
    //                     { _id: descendant._id },
    //                     {
    //                         $set: {
    //                             level: descendant.level + levelDiff,
    //                             ancestors: [
    //                                 ...newAncestors,
    //                                 ...descendant.ancestors.slice(task.ancestors.length),
    //                             ],
    //                         },
    //                     },
    //                     { session }
    //                 );
    //             }

    //             // Update new parent
    //             await databaseServices.tasks.updateOne(
    //                 { _id: new ObjectId(newParentId) },
    //                 {
    //                     $inc: { childCount: 1 },
    //                     $set: { hasChildren: true },
    //                 },
    //                 { session }
    //             );
    //         });
    //     } finally {
    //         await session.endSession();
    //     }

    //     return this.getTaskById(taskId);
    // }


    // async getTaskWithChildren(taskId: string) {
    //     const [task, children] = await Promise.all([
    //         databaseServices.tasks.findOne({
    //             _id: new ObjectId(taskId),
    //             deleted: { $ne: true },
    //         }),
    //         databaseServices.tasks.find({
    //             parentTask: new ObjectId(taskId),
    //             deleted: { $ne: true },
    //         }).toArray(),
    //     ]);

    //     if (!task) {
    //         throw new Error("Task not found");
    //     }

    //     return {
    //         ...task,
    //         children,
    //     };
    // }



    // async getAssignedTasks(userId: string) {
    //     return databaseServices.tasks
    //         .find({
    //             assignee: new ObjectId(userId),
    //             deleted: { $ne: true },
    //         })
    //         .sort({ created_at: -1 })
    //         .toArray();
    // }

    /* 
    * -------------------------------- Project subtask controller --------------------------------
    */
    async createSubTask(payload: CreateTaskReqBody) {
        const parentTaskId = payload.parent_task;
        const parentTask = await databaseServices.tasks.findOne({
            _id: new ObjectId(parentTaskId),
        });

        if (!parentTask) {
            throw new Error("Parent task not found");
        }

        if (parentTask.type === TaskType.SUBTASK) {
            throw new Error("Cannot create a subtask under another subtask");
        }

        const {
            title,
            description,
            project_id,
            creator,
            assignee,
            priority,
            dueDate,
        } = payload;

        const subtask = new Task({
            _id: new ObjectId(),
            title,
            description,
            project_id: new ObjectId(project_id),
            creator: new ObjectId(creator),
            type: TaskType.SUBTASK,
            assignee: assignee ? new ObjectId(assignee) : null,
            status: TaskStatus.TODO,
            priority,
            progress: 0,
            dueDate: dueDate ? new Date(dueDate) : null,
            parentTask: new ObjectId(parentTaskId),
            ancestors: [...parentTask.ancestors, new ObjectId(parentTaskId)],
            level: parentTask.level + 1,
            hasChildren: false,
            childCount: 0,
            created_at: new Date(),
            updated_at: new Date(),
            deleted: false,
            deletedAt: null,
        });

        // Tạo subtask mới
        await databaseServices.tasks.insertOne(subtask);

        // Cập nhật parent task
        await databaseServices.tasks.updateOne(
            { _id: new ObjectId(parentTaskId) },
            {
                $set: { hasChildren: true },
                $inc: { childCount: 1 },
            });


        // Log hoạt động
        await activityService.logActivity({
            projectId: project_id,
            entity: "Task",
            action: "CREATE",
            modifiedBy: { _id: new ObjectId(creator) },
            changes: {
                taskId: { from: null, to: subtask._id.toString() },
                parentTaskId: { from: null, to: parentTaskId },
            },
            detail: `created subtask ${title} under task ${parentTaskId}`,
        });

        return subtask;
    }

    async getSubTasks(taskId: string) {
        return databaseServices.tasks
            .find({
                parentTask: new ObjectId(taskId),
                deleted: { $ne: true },
            })
            .toArray();
    }

}

export default new TaskService();