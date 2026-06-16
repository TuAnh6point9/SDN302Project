import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { IUser } from "../models/User";

export const signToken = (user: IUser): string => {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };
  return jwt.sign({ userId: user._id, role: user.role }, env.jwtSecret, options);
};
