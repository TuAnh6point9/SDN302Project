import { IUser } from "../models/User";

export const serializeAuth = (user: IUser, token: string) => ({
  token,
  user: user.toJSON()
});
