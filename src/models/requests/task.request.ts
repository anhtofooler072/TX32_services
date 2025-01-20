import { PriorityLevel, TaskStatus, TaskType } from "../schemas/task.schema";

export interface CreateTaskReqBody {
    title: string;
    description?: string;
    project_id: string;
    creator: string;
    parentTask?: string;
    type: TaskType;
    assignee?: string;
    status?: TaskStatus;
    priority?: PriorityLevel;
    dueDate?: Date;
}

export interface UpdateTaskReqBody {
    title?: string;
    description?: string;
    type?: TaskType;
    assignee?: object;
    status?: TaskStatus;
    priority?: PriorityLevel;
    progress?: number;
    dueDate?: Date;
}
