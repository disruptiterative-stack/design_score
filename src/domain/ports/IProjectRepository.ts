import { Project } from "../entities/Project";

export interface IProjectRepository {
  // Project CRUD
  createProject(
    project: Project
  ): Promise<{ project: Project | null; ok: boolean; error: string | null }>;
  findById(projectId: string): Promise<Project | null>;
  findByIdWithProducts(projectId: string): Promise<Project | null>;
  findByAdminId(adminId: string): Promise<Project[]>;
  updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<{ project: Project | null; ok: boolean; error: string | null }>;
  deleteProject(
    projectId: string
  ): Promise<{ ok: boolean; error: string | null }>;
}
