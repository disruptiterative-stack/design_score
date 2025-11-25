# Debug: Verificar Public Key

## Pasos para verificar en Supabase:

1. Ve a tu proyecto en Supabase
2. Abre el **Table Editor**
3. Selecciona la tabla `projects`
4. Busca tu proyecto y verifica:
   - ✅ ¿El campo `public_key` existe?
   - ✅ ¿Qué valor tiene? (debe ser: `06abb44219d9efe7`)
   - ✅ ¿El campo `is_public` está en `true`?

## Consulta SQL para verificar:

```sql
SELECT
  project_id,
  name,
  public_key,
  is_public,
  admin_id
FROM projects
WHERE public_key = '06abb44219d9efe7';
```

## Si el proyecto no tiene `public_key`:

Ejecuta esto para actualizar el proyecto (reemplaza `TU_PROJECT_ID` con el UUID del proyecto):

```sql
UPDATE projects
SET
  public_key = '06abb44219d9efe7',
  is_public = true
WHERE project_id = 'TU_PROJECT_ID';
```

## Alternativa: Ver todos los proyectos públicos

```sql
SELECT
  project_id,
  name,
  public_key,
  is_public
FROM projects
WHERE is_public = true;
```
