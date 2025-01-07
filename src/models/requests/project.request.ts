import { ObjectId } from "mongodb";

export interface ProjectReqBody {
  title: string;
  description: string;
  creator: string;
  key: string;
  created_at?: Date;
  updated_at?: Date;
  participants?: string[];
}
