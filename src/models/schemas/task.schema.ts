import { Schema, model, Document } from "mongoose";
import { ObjectId } from "mongodb";
import collections from "~/constants/collections";

export enum TaskType {
  TASK = "Task",
  SUBTASK = "Subtask",
  BUG = "Bug",
  EPIC = "Epic",
  STORY = "Story"
}

export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed"
}

export enum PriorityLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  URGENT = "Urgent"
}

const TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  project_id: {
    type: ObjectId,
    ref: collections.PROJECT,
    required: true,
  },
  parentTask: {
    type: ObjectId,
    ref: collections.TASK,
    default: null,
  },
  ancestors: [{
    type: ObjectId,
    ref: collections.TASK,
    index: true
  }],
  level: {
    type: Number,
    default: 0,
    index: true
  },
  hasChildren: {
    type: Boolean,
    default: false
  },
  childCount: {
    type: Number,
    default: 0
  },
  creator: {
    type: ObjectId,
    ref: collections.USER,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(TaskType),
    required: true
  },
  assignee: {
    type: ObjectId,
    ref: collections.USER,
  },
  status: {
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO
  },
  priority: {
    type: String,
    enum: Object.values(PriorityLevel),
    default: PriorityLevel.MEDIUM
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dueDate: { type: Date },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export interface ITask extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  project_id: ObjectId;
  parentTask: ObjectId | null;
  ancestors: ObjectId[];
  level: number;
  hasChildren: boolean;
  childCount: number;
  creator: ObjectId;
  type: TaskType;
  assignee: ObjectId;
  status: TaskStatus;
  priority: PriorityLevel;
  progress: number;
  dueDate: Date;
  deleted?: boolean;
  deletedAt?: Date;
  created_at: Date;
  updated_at: Date;
}

const Task = model<ITask>(collections.TASK, TaskSchema);

export default Task;
