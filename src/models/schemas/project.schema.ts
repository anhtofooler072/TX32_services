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
  deleted: {
    type: Boolean,
    default: false,
  },
  hasBeenModified: {
    type: Boolean,
    default: false,
  },
  revisionHistory: [
    {
      modifiedAt: {
        type: Date,
        required: true,
      },
      modifiedBy: {
        _id: ObjectId,
        username: String,
        email: String,
        avatar_url: String,
      },
      changes: {
        type: Map,
        of: {
          type: {
            from: Schema.Types.Mixed,
            to: Schema.Types.Mixed,
          },
        },
      },
      changeDescription: {
        type: String,
        required: true,
      },
    },
  ],
  deletedAt: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

// interface IRevisionHistory {
//   modifiedAt: Date;
//   modifiedBy: {
//     _id: ObjectId;
//     username: string;
//     email: string;
//     avatar_url: string;
//   };
//   changes: Record<string, { from: any; to: any }>;
//   changeDescription: string;
// }

export interface IProject extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  creator: ObjectId;
  key: string;
  deleted?: boolean;
  hasBeenModified?: boolean;
  revisionHistory?: Array<{
    modifiedAt: Date;
    modifiedBy: {
      _id: ObjectId;
      username: string;
      email: string;
      avatar_url: string;
    };
    changes: Record<string, { from: any; to: any }>;
    changeDescription: string;
  }>;
  deletedAt?: Date;
  created_at: Date;
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
  sortBy: z.enum(["name", "key", "lead"]).optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
});

const Project = model<IProject>(collections.PROJECT, ProjectSchema);

export type ProjectQueryType = z.infer<typeof ProjectQuerySchema>;
export default Project;
