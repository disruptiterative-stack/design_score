import { User } from "../entities/User";
import { IAuthRepository, IAuthResponse } from "../ports/IAuthRepository";

export class AuthUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}
  async signIn(email: string, password: string): Promise<IAuthResponse> {
    if (!email || !password) {
      throw new Error("Email and password must be provided");
    }
    return await this.authRepository.signIn(email, password);
  }

  async signOut() {
    await this.authRepository.signOut();
  }

  async signUp(email: string, password: string): Promise<IAuthResponse> {
    if (!email || !password) {
      throw new Error("Email and password must be provided");
    }
    return this.authRepository.signUp(email, password);
  }

  async getCurrentUser(): Promise<User | null> {
    const user = await this.authRepository.getCurrentUser();
    return user;
  }
}
