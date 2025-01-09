"use strict";

import { Collection, Db, MongoClient } from "mongodb";
import collections from "~/constants/collections";
import { envConfig } from "~/constants/config";
import { ILogingProjectActivity } from "~/models/schemas/loging_project_activity.schema";
import { IParticipant } from "~/models/schemas/participant.schema";
import { IProject } from "~/models/schemas/project.schema";
import { ITask } from "~/models/schemas/task.schema";
import { IToken } from "~/models/schemas/token.schema";
import { IUser } from "~/models/schemas/user.schema";

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@final-semester.pmo5t.mongodb.net/${envConfig.dbName}?retryWrites=true&w=majority&appName=final-semester`;

class DatabaseServices {
  private client: MongoClient;
  private db: Db;

  public getClient() {
    return this.client;
  }

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(envConfig.dbName);
  }

  async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      );
    } catch (error) {
      console.log("Error connecting to the database", error);
      throw error;
    }
  }

  get users(): Collection<IUser> {
    return this.db.collection(collections.USER);
  }

  get tokens(): Collection<IToken> {
    return this.db.collection(collections.TOKEN);
  }

  get projects(): Collection<IProject> {
    return this.db.collection(collections.PROJECT);
  }

  get participants(): Collection<IParticipant> {
    return this.db.collection(collections.PARTICIPANT);
  }

  get activities(): Collection<ILogingProjectActivity> {
    return this.db.collection(collections.LOGING_PROJECT_ACTIVITY);
  }

  get tasks(): Collection<ITask> {
    return this.db.collection(collections.TASK);
  }
}
const databaseServices = new DatabaseServices();
export default databaseServices;
