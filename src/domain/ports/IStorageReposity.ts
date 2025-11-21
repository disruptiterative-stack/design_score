export interface IStorageRepository {
  uploadFile(
    filePath: string,
    file: File
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }>;
  uploadBuffer(
    filePath: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }>;
  uploadBuffersBatch(
    uploads: Array<{
      filePath: string;
      buffer: Buffer;
      contentType?: string;
    }>
  ): Promise<
    Array<{
      filePath: string;
      ok: boolean;
      data: { fullPath: string; path: string } | null;
      error: string | null;
    }>
  >;
  deleteFile(filePath: string): Promise<{
    ok: boolean;
    error: string | null;
  }>;
  deleteFiles(filePaths: string[]): Promise<{
    ok: boolean;
    error: string | null;
  }>;
  listFiles(folderPath: string): Promise<{
    ok: boolean;
    data: { name: string; id: string }[] | null;
    error: string | null;
  }>;
  deleteFolder(folderPath: string): Promise<{
    ok: boolean;
    error: string | null;
  }>;
  getFileUrl(filePath: string): Promise<{ url: string | null }>;
}
