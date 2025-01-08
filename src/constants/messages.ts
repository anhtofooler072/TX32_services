export const USERS_MESSAGES = {
  VALIDATION_ERROR: "Validation error",
  NAME_REQUIRED: "Name is required",
  NAME_MUST_BE_STRING: "Name must be a string",
  NAME_LENGTH: "Name must be between 1 and 100 characters long",
  USERNAME_INVALID: "Username is invalid",
  EMAIL_ALREADY_EXIST: "Email is already exist",
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Email is invalid",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MUST_BE_STRING: "Password must be a string",
  PASSWORD_LENGTH: "Password must be at least 6 characters long",
  PASSWORD_MUST_BE_STRONG:
    " Password must be at least 6 characters long, contain at least one uppercase letter, one lowercase letter, one number and one symbol",
  CONFIRM_PASSWORD_REQUIRED: "Confirm password is required",
  CONFIRM_PASSWORD_MUST_BE_MATCH: "Confirm password must match with password",
  EMAIL_OR_PASSWORD_IS_INCORRECT: "Email or password is incorrect",
  LOGIN_SUCCESSFULLY: "Login successfully",
  REGISTER_SUCCESSFULLY: "Register successfully",
  REGISTER_FAILED: "Register failed",
  LOGOUT_FAILED: "Logout failed",
  INVALID_USER: "Invalid user",
  // verify email
  USER_NOT_VERIFIED: "User not verified",
  EMAIL_ALREADY_VERIFIED_BEFORE: "Email already verified before",
  RESEND_VERIFY_EMAIL_SUCCESSFULLY: "Resend verify email successfully",
  //accessToken
  ACCESS_TOKEN_REQUIRED: "Access token is required",
  ACCESS_TOKEN_IS_INVALID: "Access token is invalid",
  //refreshToken
  REFRESH_TOKEN_REQUIRED: "Refresh token is required",
  REFRESH_TOKEN_MUST_BE_STRING: "Refresh token must be a string",
  REFRESH_TOKEN_IS_INVALID: "Refresh token is invalid",
  REFRESH_TOKEN_SUCCESSFULLY: "Refresh token successfully",
  REFRESH_TOKEN_NOT_FOUND: "Refresh token not found",
  REFRESH_TOKEN_EXPIRED: "Refresh token expired",
  //logout
  USED_REFRESH_TOKEN_OR_NOT_EXIST: "Used refresh token or not exist",
  LOGOUT_SUCCESSFULLY: "Logout successfully",
  //Email verification
  EMAIL_VERIFICATION_TOKEN_REQUIRED: "Email verification token is required",
  EMAIL_VERIFICATION_TOKEN_MUST_BE_STRING:
    "Email verification token must be a string",
  EMAIL_ALREADY_VERIFIED: "Email already verified",
  USER_NOT_FOUND: "User not found",
  EMAIL_VERIFIED_SUCCESSFULLY: "Email verified successfully",
  EMAIL_NOT_EXIST: "Email not exist. Please register",
  // Update me
  BIO_MUST_BE_STRING: "Bio must be a string",
  BIO_LENGTH: "Bio must be between 1 and 110 characters long",
  UPDATE_ME_SUCCESSFULLY: "Update me successfully",
  // Forgot password , reset password , verify forgot password , change password
  CHECK_EMAIL_TO_RESET_PASSWORD: "Check your email to reset password",
  FORGOT_PASSWORD_TOKEN_REQUIRED: "Forgot password token is required",
  FORGOT_PASSWORD_TOKEN_IS_INVALID: "Forgot password token is invalid",
  VERIFY_FORGOT_PASSWORD_SUCCESSFULLY: "Verify forgot password successfully",
  RESET_PASSWORD_SUCCESSFULLY: "Reset password successfully",
  OLD_PASSWORD_INCORRECT: "Old password is incorrect",
  CHANGE_PASSWORD_SUCCESSFULLY: "Change password successfully",
  // get me
  GET_ME_SUCCESSFULLY: "Get me successfully",
  // get user
  GET_USER_SUCCESSFULLY: "Get user successfully",
  SEARCH_USER_SUCCESSFULLY: "Search user successfully",
} as const;

export const PROJECTS_MESSAGES = {
  // project
  GET_ALL_PROJECTS_SUCCESSFULLY: "Get all projects successfully",

  TITLE_REQUIRED: "Title is required",
  TITLE_MUST_BE_STRING: "Title must be a string",
  TITLE_LENGTH: "Title length must be between 1 and 200 characters",
  DESCRIPTION_MUST_BE_STRING: "Description must be a string",
  DESCRIPTION_LENGTH: "Description cannot exceed 1000 characters",
  CREATOR_REQUIRED: "Creator is required",
  CREATOR_NOT_FOUND: "Creator not found",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_ALREADY_EXIST: "Project already exist",
  PROJECT_ID_REQUIRED: "Project ID is required",
  CREATE_PROJECT_SUCCESSFULLY: "Create project successfully",
  GET_PROJECT_SUCCESSFULLY: "Get project successfully",
  GET_PROJECTS_SUCCESSFULLY: "Get projects successfully",
  UPDATE_PROJECT_SUCCESSFULLY: "Update project successfully",
  DELETE_PROJECT_SUCCESSFULLY: "Delete project successfully",
  ADD_PARTICIPANT_SUCCESSFULLY: "Add participant successfully",
  REMOVE_PARTICIPANT_SUCCESSFULLY: "Remove participant successfully",
  PARTICIPANT_NOT_FOUND: "Participant not found",
  PARTICIPANT_ALREADY_EXIST: "Participant already exist",
  ADD_ATTACHMENT_SUCCESSFULLY: "Add attachment successfully",
  REMOVE_ATTACHMENT_SUCCESSFULLY: "Remove attachment successfully",
  ATTACHMENT_NOT_FOUND: "Attachment not found",
  ATTACHMENT_ALREADY_EXIST: "Attachment already exist",
  ADD_COMMENT_SUCCESSFULLY: "Add comment successfully",
  REMOVE_COMMENT_SUCCESSFULLY: "Remove comment successfully",
  COMMENT_NOT_FOUND: "Comment not found",
  COMMENT_ALREADY_EXIST: "Comment already exist",
  GET_COMMENTS_SUCCESSFULLY: "Get comments successfully",
  GET_COMMENT_SUCCESSFULLY: "Get comment successfully",
  UPDATE_COMMENT_SUCCESSFULLY: "Update comment successfully",
  DELETE_COMMENT_SUCCESSFULLY: "Delete comment successfully",
  GET_PARTICIPANTS_SUCCESSFULLY: "Get participants successfully",
  GET_PARTICIPANT_SUCCESSFULLY: "Get participant successfully",
  GET_ATTACHMENTS_SUCCESSFULLY: "Get attachments successfully",
  GET_ATTACHMENT_SUCCESSFULLY: "Get attachment successfully",
  GET_PARTICIPANT_ATTACHMENTS_SUCCESSFULLY:
    "Get participant attachments successfully",
  GET_PARTICIPANT_ATTACHMENT_SUCCESSFULLY:
    "Get participant attachment successfully",
  GET_PARTICIPANT_COMMENTS_SUCCESSFULLY:
    "Get participant comments successfully",
  GET_PARTICIPANT_COMMENT_SUCCESSFULLY: "Get participant comment successfully",
  GET_PARTICIPANT_PARTICIPANTS_SUCCESSFULLY:
    "Get participant participants successfully",
  GET_PARTICIPANT_PARTICIPANT_SUCCESSFULLY:
    "Get participant participant successfully",
  GET_PARTICIPANT_PROJECTS_SUCCESSFULLY:
    "Get participant projects successfully",

  PARTICIPANTS_MUST_BE_ARRAY: "Participants must be an array",
  PARTICIPANTS_INVALID: "Participants must be an array",
  PARTICIPANT_EMAIL_REQUIRED: "Email is required for each participant",
  PARTICIPANT_USER_NOT_FOUND: "Participant not found",
  PARTICIPANT_ROLE_INVALID: "Participant role is invalid",
  USER_NOT_PARTICIPANT: "User is not a participant",

  // key
  KEY_REQUIRED: "Key is required",
  KEY_MUST_BE_STRING: "Key must be a string",
  KEY_LENGTH: "Key length must be between 1 and 100 characters",

  TOO_MANY_REQUESTS: "Too many requests",
} as const;
