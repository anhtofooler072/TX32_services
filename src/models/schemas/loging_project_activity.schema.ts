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
    enum: ["project", "task", "participant", "attachment"], // Loại đối tượng
  },
  entity_id: {
    type: ObjectId,
    required: false, // Có thể không bắt buộc (ví dụ: nếu là project-level log)
  },
  action: {
    type: String,
    required: true,
    enum: ["CREATE", "UPDATE", "DELETE", "ADD", "REMOVE"], // Các hành động hỗ trợ
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
      from: { type: Schema.Types.Mixed }, // Giá trị cũ
      to: { type: Schema.Types.Mixed }, // Giá trị mới
    }),
    required: false,
  },
  detail: {
    type: String,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
});

export interface ILogingProjectActivity extends Document {
  project_id: ObjectId;
  entity: string; // "project", "task", "participant",...
  entity_id?: ObjectId; // ID đối tượng liên quan
  action: string; // "CREATE", "UPDATE", "DELETE",...
  modifiedBy: {
    _id: ObjectId;
    username: string;
    email: string;
    avatar_url: string;
  };
  changes?: Record<string, { from: any; to: any }>; // Chi tiết thay đổi
  detail: string;
  createdAt: Date;
}

const LogingProjectActivity = model<ILogingProjectActivity>(
  collections.LOGING_PROJECT_ACTIVITY,
  LogingProjectActivitySchema
);

export default LogingProjectActivity;
