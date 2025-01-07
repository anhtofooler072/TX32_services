import { Schema, model, Document } from "mongoose";
import { ObjectId } from "mongodb";
import collections from "~/constants/collections";

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

const Project = model<IProject>(collections.PROJECT, ProjectSchema);

export default Project;
