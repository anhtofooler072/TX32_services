import { Schema, model, Document } from "mongoose";
import { ObjectId } from "mongodb";
import collections from "~/constants/collections";

const TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    default: "",
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
  creator: {
    type: ObjectId,
    ref: collections.USER,
    required: true,
  },
  type: {
    type: String,
    enum: ["Task", "Subtask", "Bug", "Epic", "Story"],
    required: true,
  },
  assignee: {
    type: ObjectId,
    ref: collections.USER,
    required: true,
  },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Completed"],
    default: "To Do",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  progress: { type: Number, min: 0, max: 100 },
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
  parentTask: ObjectId;
  creator: ObjectId;
  type: string;
  assignee: ObjectId;
  status: string;
  priority: string;
  progress: number;
  dueDate: Date;
  created_at: Date;
  updated_at: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

const Task = model<ITask>(collections.TASK, TaskSchema);

export default Task;
