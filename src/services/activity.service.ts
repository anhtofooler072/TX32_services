import { ObjectId } from "mongodb";
import LogingProjectActivity from "~/models/schemas/loging_project_activity.schema";
import databaseServices from "~/services/database.service";

interface LogActivityParams {
  projectId: string; // ID của project
  entity: string; // Loại thực thể (project, task, participant, ...)
  action: "CREATE" | "UPDATE" | "DELETE"; // Hành động thực hiện
  changes: Record<string, { from: any; to: any }>; // Thay đổi chi tiết
  detail: string; // Chi tiết hoạt động
  modifiedBy: object; // Người thực hiện hành động
}

class ActivityService {
  async logActivity({
    projectId,
    entity,
    action,
    modifiedBy,
    changes,
    detail,
  }: LogActivityParams): Promise<void> {
    const activity = new LogingProjectActivity({
      project_id: new ObjectId(projectId),
      entity,
      action,
      modifiedBy,
      changes,
      detail,
      createdAt: new Date(),
    });

    await databaseServices.activities.insertOne(activity);
  }
}

const activityService = new ActivityService();
export default activityService;
