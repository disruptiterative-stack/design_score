import { Project } from "../entities/Project";
import { IProjectRepository } from "../ports/IProjectRepository";

export class ProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  /**
   * Crear un nuevo proyecto
   */
  async createProject(project: Project) {
    if (!project.name || project.name.trim() === "") {
      throw new Error("El nombre del proyecto es requerido");
    }

    if (!project.admin_id) {
      throw new Error("El admin_id es requerido");
    }

    return await this.projectRepository.createProject(project);
  }

  /**
   * Obtener proyecto por ID
   */
  async getProjectById(projectId: string) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }

    return await this.projectRepository.findById(projectId);
  }

  /**
   * Obtener proyecto por ID con sus productos
   */
  async getProjectByIdWithProducts(projectId: string) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }

    return await this.projectRepository.findByIdWithProducts(projectId);
  }

  /**
   * Obtener todos los proyectos de un administrador
   */
  async getProjectsByAdminId(adminId: string) {
    if (!adminId) {
      throw new Error("El ID del administrador es requerido");
    }

    return await this.projectRepository.findByAdminId(adminId);
  }

  /**
   * Actualizar un proyecto
   */
  async updateProject(projectId: string, updates: Partial<Project>) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }

    if (updates.name !== undefined && updates.name.trim() === "") {
      throw new Error("El nombre del proyecto no puede estar vacío");
    }

    return await this.projectRepository.updateProject(projectId, updates);
  }

  /**
   * Eliminar un proyecto (y sus productos, views, view_products en cascada)
   */
  async deleteProject(projectId: string) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }

    return await this.projectRepository.deleteProject(projectId);
  }
}
