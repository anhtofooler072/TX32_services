import { Schema, model, Document } from "mongoose";
import { ObjectId } from "mongodb";
import collections from "~/constants/collections";

const LogingProjectActivitySchema = new Schema({
  project_id: {
    type: ObjectId,
    ref: collections.PROJECT,
    required: true,
  },
  entity: {
    type: String,
    required: true,
    enum: ["project", "task", "participant", "attachment"],
  },
  entity_id: {
    type: ObjectId,
    required: false, // Có thể không bắt buộc (ví dụ: nếu là project-level log)
  },
  action: {
    type: String,
    required: true,
    enum: ["CREATE", "UPDATE", "DELETE", "ADD", "REMOVE"],
  },
  modifiedBy: {
    _id: ObjectId,
    username: String,
    email: String,
    avatar_url: String,
  },
  changes: {
    type: Map,
    of: new Schema({
      from: { type: Schema.Types.Mixed },
      to: { type: Schema.Types.Mixed },
    }),
    required: false,
  },
  detail: {
    type: String,
    default: "",
  },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export interface ILogingProjectActivity extends Document {
  project_id: ObjectId;
  entity: string;
  entity_id?: ObjectId;
  action: string;
  modifiedBy: {
    _id: ObjectId;
    username: string;
    email: string;
    avatar_url: string;
  };
  changes?: Record<string, { from: any; to: any }>;
  detail: string;
  createdAt: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

const LogingProjectActivity = model<ILogingProjectActivity>(
  collections.LOGING_PROJECT_ACTIVITY,
  LogingProjectActivitySchema
);

export default LogingProjectActivity;
