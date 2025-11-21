"use server";
import { User } from "@/src/domain/entities/User";

export interface IAuthResponse {
  user: User;
  session: any;
}

export interface IAuthRepository {
  signUp(email: string, password: string): Promise<IAuthResponse>;
  signIn(email: string, password: string): Promise<IAuthResponse>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
