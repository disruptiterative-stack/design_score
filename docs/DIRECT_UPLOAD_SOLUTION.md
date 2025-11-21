# 🚀 Solución: Subida de Archivos Grandes en Vercel

## Problema Original

Error al subir archivos en producción (Vercel):
- **Error**: "Request Entity Too Large" o errores de parseo JSON
- **Causa**: Vercel Free tiene un límite de 4.5MB para el body de solicitudes HTTP
- **Impacto**: No se pueden subir archivos ZIP mayores a 4.5MB

## Solución Implementada

### Arquitectura Nueva: Subida Directa a Supabase Storage

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Cliente   │────1───▶│ Supabase Storage │         │ Vercel Function │
│  (Browser)  │         │   (hasta 500MB)  │         │   (Procesador)  │
└─────────────┘         └──────────────────┘         └─────────────────┘
       │                         │                            ▲
       │                         │                            │
       └────────────2────────────┴────────────────3───────────┘
                         
Flujo:
1. Cliente sube ZIP directo a Supabase Storage (sin pasar por Vercel)
2. Cliente notifica a Vercel la ubicación del archivo
3. Vercel descarga y procesa el archivo desde Supabase
```

### Cambios Realizados

#### 1. Nuevo Hook: `useDirectUpload`
**Archivo**: `src/hooks/useDirectUpload.ts`

- Sube archivos directamente a Supabase Storage
- Evita el límite de 4.5MB de Vercel
- Límite nuevo: 500MB (Supabase Storage)

#### 2. Nueva Ruta API: `/api/upload/process`
**Archivo**: `src/app/api/upload/process/route.ts`

- Procesa archivos que ya están en Supabase Storage
- Descarga, extrae y procesa imágenes
- Retorna progreso via Server-Sent Events (SSE)

#### 3. Componentes Actualizados

Todos los componentes ahora usan `useDirectUpload` en lugar de `useProductUpload`:

- ✅ `src/components/create-project/ProductSelectionSection.tsx`
- ✅ `src/components/edit-project/ProductSelectionModal.tsx`
- ✅ `src/app/dashboard/page.tsx`
- ✅ `src/components/dashboard/UploadProgressModal.tsx`

#### 4. Mejoras en Manejo de Errores

**Archivo**: `src/hooks/useDirectUpload.ts`

```typescript
// Manejo robusto de respuestas no-JSON
try {
  const errorData = await response.json();
  errorMessage = errorData.error || errorMessage;
} catch {
  try {
    const errorText = await response.text();
    errorMessage = errorText || `Error ${response.status}`;
  } catch {
    errorMessage = `Error ${response.status}: ${response.statusText}`;
  }
}
```

#### 5. Nuevas Fases de Progreso

- `uploading-zip`: Subiendo archivo a Supabase Storage
- `processing`: Procesando archivo desde storage
- `downloading`: Descargando archivo en el servidor
- `extracting`: Extrayendo imágenes del ZIP
- `uploading-images`: Subiendo imágenes procesadas
- `updating-product`: Actualizando información del producto
- `complete`: Proceso completado

## Configuración de Vercel

**Archivo**: `vercel.json`

```json
{
  "functions": {
    "src/app/api/upload/route.ts": {
      "memory": 3008,
      "maxDuration": 300
    }
  }
}
```

## Ventajas de la Nueva Solución

1. ✅ **Sin límites de Vercel**: Evita el límite de 4.5MB
2. ✅ **Archivos grandes**: Hasta 500MB (límite de Supabase)
3. ✅ **Mejor UX**: Progreso en tiempo real con más detalle
4. ✅ **Más robusto**: Manejo de errores mejorado
5. ✅ **Escalable**: Funciona en Vercel Free y Pro

## Flujo Completo

### 1. Usuario Selecciona Archivo ZIP
```typescript
const zipFile = files[0]; // archivo.zip (puede ser hasta 500MB)
```

### 2. Subida Directa a Supabase
```typescript
const zipPath = `temp/${adminId}/${productId}/${Date.now()}_${zipFile.name}`;
await supabase.storage.from("files").upload(zipPath, zipFile);
// Progreso: 10-30%
```

### 3. Llamada a API para Procesar
```typescript
fetch("/api/upload/process", {
  method: "POST",
  body: JSON.stringify({ zipPath, product_id, admin_id })
});
// Body pequeño (JSON) - sin límites
```

### 4. Servidor Procesa Archivo
```typescript
// Descargar de Supabase Storage
const { data } = await supabase.storage.from("files").download(zipPath);

// Extraer imágenes
const { imageFiles } = await processZipFile(buffer);

// Subir imágenes procesadas
await uploadService.uploadImages(imageFiles, storagePath);
// Progreso: 30-100% via SSE
```

### 5. Limpieza
```typescript
// Eliminar archivo temporal
await supabase.storage.from("files").remove([zipPath]);
```

## Testing

### Local
```bash
npm run dev
# Sube un archivo ZIP de cualquier tamaño (hasta 500MB)
```

### Producción (Vercel)
```bash
vercel --prod
# Funciona igual que local
```

## Rollback

Si necesitas volver a la versión anterior:

1. Cambiar imports en componentes:
```typescript
// De:
import { useDirectUpload } from "@/src/hooks/useDirectUpload";

// A:
import { useProductUpload } from "@/src/hooks/useProductUpload";
```

2. Cambiar hook en componentes:
```typescript
// De:
const { uploadState, uploadProduct, startUpload } = useDirectUpload();

// A:
const { uploadState, uploadProduct, startUpload } = useProductUpload();
```

## Monitoreo

Ver logs en Vercel:
```bash
vercel logs
```

Buscar:
- `📤 [Upload] Subiendo archivo a Supabase Storage...`
- `🔄 [Process] Descargando archivo desde storage...`
- `✅ [Process] Proceso completado`

## Próximos Pasos (Opcional)

1. **Compresión**: Comprimir imágenes antes de subir
2. **Chunks**: Subir archivos muy grandes en partes
3. **Resumen**: Validar ZIP antes de subir
4. **Cache**: Cachear archivos procesados

## Soporte

Si encuentras problemas:
1. Revisa los logs del navegador (Consola de DevTools)
2. Revisa los logs de Vercel
3. Verifica que Supabase Storage esté configurado correctamente
4. Asegúrate de tener permisos en el bucket `files`

