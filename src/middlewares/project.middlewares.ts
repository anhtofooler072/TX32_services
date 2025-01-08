import { checkSchema, ParamSchema } from "express-validator";
import { PROJECTS_MESSAGES } from "~/constants/messages";
import databaseServices from "~/services/database.service";
import usersService from "~/services/users.service";
import { validate } from "~/utils/validations.util";
import { ObjectId } from "mongodb";
import { TokenPayload } from "~/models/requests/user.request";
import { Request, Response, NextFunction } from "express";
import { IProject } from "~/models/schemas/project.schema";
import { ErrorWithStatus } from "~/utils/errors.util";
import HTTP_STATUS_CODES from "~/core/statusCodes";
import { AnyZodObject, ZodError } from "zod";
import rateLimit from "express-rate-limit";
import REASON_PHRASES from "~/core/reasonPhrases";
import { NAME_REGEXP } from "~/helpers/regex";
declare module "express-serve-static-core" {
  interface Request {
    project?: IProject;
  }
}

class ProjectMiddleware {
  private titleSchema: ParamSchema = {
    notEmpty: {
      errorMessage:
        PROJECTS_MESSAGES.TITLE_REQUIRED || "Project title is required",
    },
    isString: {
      errorMessage:
        PROJECTS_MESSAGES.TITLE_MUST_BE_STRING ||
        "Project title must be a string",
    },
    isLength: {
      options: { min: 1, max: 200 },
      errorMessage:
        PROJECTS_MESSAGES.TITLE_LENGTH ||
        "Project title length must be between 1 and 200 characters",
    },
    trim: true,
  };

  private descriptionSchema: ParamSchema = {
    optional: true,
    isString: {
      errorMessage:
        PROJECTS_MESSAGES.DESCRIPTION_MUST_BE_STRING ||
        "Project description must be a string",
    },
    isLength: {
      options: { max: 1000 },
      errorMessage:
        PROJECTS_MESSAGES.DESCRIPTION_LENGTH ||
        "Project description cannot exceed 1000 characters",
    },
    trim: true,
  };

  private creatorSchema: ParamSchema = {
    notEmpty: {
      errorMessage:
        PROJECTS_MESSAGES.CREATOR_REQUIRED || "Project creator is required",
    },
    custom: {
      options: async (value) => {
        const userExists = await usersService.checkUserExistById(value);
        if (!userExists) {
          throw new Error(
            PROJECTS_MESSAGES.CREATOR_NOT_FOUND || "Creator not found"
          );
        }
        return true;
      },
    },
  };

  private participantsSchema: ParamSchema = {
    optional: true,
    isArray: {
      errorMessage:
        PROJECTS_MESSAGES.PARTICIPANTS_MUST_BE_ARRAY ||
        "Participants must be an array",
    },
    custom: {
      options: async (participants) => {
        if (!Array.isArray(participants)) {
          throw new Error(
            PROJECTS_MESSAGES.PARTICIPANTS_INVALID ||
            "Participants must be an array"
          );
        }

        const users = await databaseServices.users
          .find({
            _id: { $in: participants.map((id: string) => new ObjectId(id)) },
          })
          .toArray();

        // Nếu số lượng user_id không bằng số lượng participants thì trả về lỗi
        if (users.length !== participants.length) {
          throw new Error(
            PROJECTS_MESSAGES.PARTICIPANT_NOT_FOUND || "Participant not found"
          );
        }

        return true;
      },
    },
  };

  private keySchema: ParamSchema = {
    notEmpty: {
      errorMessage: PROJECTS_MESSAGES.KEY_REQUIRED || "Project key is required",
    },
    isString: {
      errorMessage:
        PROJECTS_MESSAGES.KEY_MUST_BE_STRING || "Project key must be a string",
    },
    isLength: {
      options: { min: 1, max: 30 },
      errorMessage:
        PROJECTS_MESSAGES.KEY_LENGTH ||
        "Project key length must be between 1 and 30 characters",
    },
    trim: true,
  };

  public createProjectValidation = validate(
    checkSchema(
      {
        title: this.titleSchema,
        description: this.descriptionSchema,
        creator: this.creatorSchema,
        key: this.keySchema,
        participants: this.participantsSchema,
      },
      ["body"]
    )
  );

  validateUpdateProject = validate(
    checkSchema({
      title: {
        optional: true,
        isString: {
          errorMessage: 'Title must be string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: 'Title length must be between 1 and 50 characters'
        }
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Description must be string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 500 },
          errorMessage: 'Description length must be between 1 and 500 characters'
        }
      },
      key: {
        optional: true,
        isString: {
          errorMessage: 'Key must be string'
        },
        trim: true,
        isLength: {
          options: { min: 2, max: 10 },
          errorMessage: 'Key length must be between 2 and 10 characters'
        },
        matches: {
          options: /^[A-Z0-9\-_]+$/,
          errorMessage: 'Key must contain only uppercase letters and numbers'
        },
        custom: {
          options: async (value, { req }) => {
            if (!value) return true
            const project = await databaseServices.projects.findOne({
              key: value,
              _id: {
                $ne: req.params?.project_id ? new ObjectId(String(req.params.project_id)) : undefined
              }
            })
            if (project) {
              throw new Error('Key already exists')
            }
            return true
          }
        }
      }
    })
  )

  async verifyUserProjectAccess(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const projectId = req.params.projectId;
    const { user_id } = req.decoded_authorization as TokenPayload;

    const project = await databaseServices.projects.findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
        status: HTTP_STATUS_CODES.NOT_FOUND,
      });
    }

    const participant = await databaseServices.participants.findOne({
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(user_id),
      status: "active",
    });

    if (!participant) {
      throw new ErrorWithStatus({
        message: PROJECTS_MESSAGES.USER_NOT_PARTICIPANT,
        status: HTTP_STATUS_CODES.FORBIDDEN,
      });
    }

    req.project = project;
    return next();
  }

  createRateLimiter({ windowMs, max }: { windowMs?: number; max?: number }) {
    return rateLimit({
      windowMs: windowMs || 15 * 60 * 1000,
      max: max || 100,
      message: {
        status: "error",
        message: PROJECTS_MESSAGES.TOO_MANY_REQUESTS,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return (req.decoded_authorization as TokenPayload).user_id;
      },
    });
  }

  validateProjectQuery(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedQuery = await schema.parseAsync(req.query);
        req.query = validatedQuery;
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          throw new ErrorWithStatus({
            message: error.errors[0].message,
            status: HTTP_STATUS_CODES.BAD_REQUEST,
          });
        }
        throw error;
      }
    };
  }

  checkProjectPermissions(allowedRoles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { user_id } = req.decoded_authorization as TokenPayload
      const { project_id } = req.params

      const project = await databaseServices.participants.findOne({
        project_id: new ObjectId(project_id),
        user_id: new ObjectId(user_id),
        role: { $in: allowedRoles }
      })

      if (!project) {
        throw new ErrorWithStatus({
          message: REASON_PHRASES.FORBIDDEN,
          status: HTTP_STATUS_CODES.FORBIDDEN
        })
      }

      next()
    }
  }
}

export default new ProjectMiddleware();
