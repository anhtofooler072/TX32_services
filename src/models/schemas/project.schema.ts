import { Schema, model, Document } from "mongoose";
import { ObjectId } from "mongodb";
import collections from "~/constants/collections";
import { z } from "zod";

const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    default: "",
  },
  creator: {
    type: ObjectId,
    ref: collections.USER,
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export interface IProject extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  creator: ObjectId;
  key: string;
  created_at: Date;
  updated_at: Date;
}

export const ProjectQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  limit: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  status: z.enum(["active", "archived", "all"]).optional(),
  sortBy: z.enum(["created_at", "updated_at", "name"]).optional(),
  search: z.string().optional(),
  role: z.enum(["owner", "member", "all"]).optional(),
});

const Project = model<IProject>(collections.PROJECT, ProjectSchema);

export type ProjectQueryType = z.infer<typeof ProjectQuerySchema>;
export default Project;
