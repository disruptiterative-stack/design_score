# Guía de Solución de Problemas

## Error: "Unexpected token 'R', 'Request En'... is not valid JSON"

### Descripción del Problema

Este error ocurre cuando intentas subir un proyecto/producto y el servidor devuelve una respuesta que no es JSON válido (generalmente texto plano o HTML).

### Causas Comunes

1. **Archivo demasiado grande** (Causa más común)

   - Límite configurado: 100MB
   - El error puede aparecer como "Request Entity Too Large" o error 413
   - Vercel tiene límites de 4.5MB para API Routes en el plan gratuito

2. **Archivo ZIP corrupto**

   - El archivo ZIP no se puede leer correctamente
   - Formato incorrecto o compresión dañada

3. **Timeout del servidor**
   - La subida toma demasiado tiempo
   - Límite: 300 segundos (5 minutos)

### Soluciones

#### ✅ Solución 1: Reducir el tamaño del archivo

**Opción A: Comprimir las imágenes**

```bash
# Usar herramientas como ImageOptim, TinyPNG, o comandos:
mogrify -resize 50% *.jpg
mogrify -quality 85% *.jpg
```

**Opción B: Reducir la cantidad de imágenes**

- Divide tu producto en varios productos más pequeños
- Sube las imágenes en múltiples lotes

**Opción C: Usar formatos más eficientes**

- Convierte JPG/PNG a WebP (reduce hasta 30% el tamaño)

```bash
cwebp input.jpg -q 80 -o output.webp
```

#### ✅ Solución 2: Verificar el archivo ZIP

```bash
# Probar el archivo ZIP
unzip -t archivo.zip

# Re-comprimir si está corrupto
unzip archivo.zip
zip -r archivo_nuevo.zip carpeta/
```

#### ✅ Solución 3: Aumentar límites (Solo para deploy propio)

Si tienes tu propio servidor o plan Vercel Pro, puedes aumentar los límites:

**En `next.config.ts`:**

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "100mb", // Ya configurado
  },
}
```

**En `vercel.json`:**

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

**Variables de entorno:**

```bash
MAX_FILE_SIZE=104857600  # 100MB en bytes
```

### Mejoras Implementadas

Las siguientes mejoras ya están implementadas en el código:

1. ✅ **Manejo robusto de errores** - Detecta y muestra mensajes claros
2. ✅ **Validación de tamaño** - Verifica antes de procesar
3. ✅ **Validación de integridad** - Verifica que el ZIP sea válido
4. ✅ **Límite de tiempo extendido** - 5 minutos para subidas grandes
5. ✅ **Mensajes de error informativos** - Indica la causa exacta

### Verificación de Límites Actuales

Para verificar los límites configurados en tu instancia:

1. **Tamaño máximo de archivo**: 100MB (configurado en `.env`)
2. **Tiempo máximo de procesamiento**: 300 segundos (5 minutos)
3. **Memoria asignada**: 3008MB
4. **Máximo de archivos en ZIP**: 10,000 archivos

### Logs y Debugging

Si el problema persiste, revisa los logs:

**En el navegador (Consola de DevTools):**

```
❌ Error en upload: [mensaje de error]
```

**En el servidor (Vercel Logs o consola local):**

```
❌ [upload-rar-stream] Error procesando archivo
```

### Contacto de Soporte

Si ninguna de estas soluciones funciona, reporta el error con:

- Tamaño del archivo ZIP
- Número de imágenes en el ZIP
- Logs de la consola del navegador
- Screenshot del error

## Otros Errores Comunes

### Error: "Usuario no autenticado"

**Solución:** Vuelve a iniciar sesión

### Error: "No se proporcionó archivo"

**Solución:** Asegúrate de seleccionar un archivo antes de hacer clic en "Subir"

### Error: "Solo se permiten archivos .zip"

**Solución:** Convierte tu archivo RAR/7z a ZIP

### Error: "El archivo ZIP está vacío"

**Solución:** Verifica que tu ZIP contenga archivos
