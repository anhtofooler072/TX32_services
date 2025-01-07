import { checkSchema, ParamSchema } from 'express-validator';
import { PROJECTS_MESSAGES } from '~/constants/messages';
import databaseServices from '~/services/database.service';
import usersService from '~/services/users.service';
import { validate } from '~/utils/validations.util';
import { ObjectId } from 'mongodb'

class ProjectMiddleware {
    private titleSchema: ParamSchema = {
        notEmpty: {
            errorMessage: PROJECTS_MESSAGES.TITLE_REQUIRED || 'Project title is required',
        },
        isString: {
            errorMessage: PROJECTS_MESSAGES.TITLE_MUST_BE_STRING || 'Project title must be a string',
        },
        isLength: {
            options: { min: 1, max: 200 },
            errorMessage: PROJECTS_MESSAGES.TITLE_LENGTH || 'Project title length must be between 1 and 200 characters',
        },
        trim: true,
    };

    private descriptionSchema: ParamSchema = {
        optional: true,
        isString: {
            errorMessage: PROJECTS_MESSAGES.DESCRIPTION_MUST_BE_STRING || 'Project description must be a string',
        },
        isLength: {
            options: { max: 1000 },
            errorMessage: PROJECTS_MESSAGES.DESCRIPTION_LENGTH || 'Project description cannot exceed 1000 characters',
        },
        trim: true,
    };

    private creatorSchema: ParamSchema = {
        notEmpty: {
            errorMessage: PROJECTS_MESSAGES.CREATOR_REQUIRED || 'Project creator is required',
        },
        custom: {
            options: async (value) => {
                const userExists = await usersService.checkUserExistById(value);
                if (!userExists) {
                    throw new Error(PROJECTS_MESSAGES.CREATOR_NOT_FOUND || 'Creator not found');
                }
                return true;
            },
        },
    };

    private participantsSchema: ParamSchema = {
        optional: true,
        isArray: {
            errorMessage: PROJECTS_MESSAGES.PARTICIPANTS_MUST_BE_ARRAY || 'Participants must be an array',
        },
        custom: {
            options: async (participants) => {
                if (!Array.isArray(participants)) {
                    throw new Error(PROJECTS_MESSAGES.PARTICIPANTS_INVALID || 'Participants must be an array');
                }

                // for (const participant of participants) {
                //     const { email, role } = participant;

                //     // Check email
                //     if (!email) {
                //         throw new Error(PROJECTS_MESSAGES.PARTICIPANT_EMAIL_REQUIRED || 'Email is required for each participant');
                //     }   
                //     const user = await databaseServices.users.findOne({ email });
                //     if (!user) {
                //         throw new Error(
                //             `${PROJECTS_MESSAGES.PARTICIPANT_USER_NOT_FOUND || 'Participant not found'}: ${email}`
                //         );
                //     }

                //     // Check role (optional)
                //     if (role && !['leader', 'staff'].includes(role)) {
                //         throw new Error(
                //             `${PROJECTS_MESSAGES.PARTICIPANT_ROLE_INVALID || 'Invalid participant role'}: ${role}`
                //         );
                //     }
                // }

                const users = await databaseServices.users
                    .find({
                        _id: { $in: participants.map((id: string) => new ObjectId(id)) }
                    })
                    .toArray()

                // Nếu số lượng user_id không bằng số lượng participants thì trả về lỗi
                if (users.length !== participants.length) {
                    throw new Error(PROJECTS_MESSAGES.PARTICIPANT_NOT_FOUND || 'Participant not found');
                }

                // kiểm tra role của participant có hợp lệ không (nếu có)
                // for (const participant of participants) {
                //     const { role } = participant;
                //     if (role && !['leader', 'staff'].includes(role)) {
                //         throw new Error(
                //             `${PROJECTS_MESSAGES.PARTICIPANT_ROLE_INVALID || 'Invalid participant role'}: ${role}`
                //         );
                //     }
                // }

                return true;
            },
        },
    };

    public createProjectValidation = validate(
        checkSchema(
            {
                title: this.titleSchema,
                description: this.descriptionSchema,
                creator: this.creatorSchema,
                participants: this.participantsSchema,
            },
            ['body']
        )
    );
}

export default new ProjectMiddleware();
