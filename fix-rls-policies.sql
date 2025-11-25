-- ==================================================
-- 🔧 CORRECCIÓN DE POLÍTICAS RLS PARA ACCESO PÚBLICO
-- ==================================================

-- ❌ ELIMINAR LAS POLÍTICAS ANTIGUAS INCORRECTAS
DROP POLICY IF EXISTS "Public read project" ON projects;
DROP POLICY IF EXISTS "Public read views for project" ON views;
DROP POLICY IF EXISTS "Public read products for project" ON products;
DROP POLICY IF EXISTS "Public read view_products" ON view_products;
DROP POLICY IF EXISTS "Public read project_products" ON project_products;

-- También eliminar políticas con otros nombres posibles
DROP POLICY IF EXISTS "Public projects are readable by anyone" ON projects;
DROP POLICY IF EXISTS "Views of public projects are readable by anyone" ON views;
DROP POLICY IF EXISTS "Products of public projects are readable by anyone" ON products;
DROP POLICY IF EXISTS "View products of public projects are readable by anyone" ON view_products;
DROP POLICY IF EXISTS "Project products of public projects are readable by anyone" ON project_products;

-- ✅ CREAR NUEVAS POLÍTICAS CORRECTAS PARA ACCESO PÚBLICO

-- 1️⃣ PROJECTS: Permitir lectura pública cuando is_public = true
CREATE POLICY "Public projects readable"
  ON projects
  FOR SELECT
  USING (is_public = TRUE);

-- 2️⃣ VIEWS: Permitir lectura de vistas de proyectos públicos
CREATE POLICY "Public views readable"
  ON views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.project_id = views.project_id
        AND p.is_public = TRUE
    )
  );

-- 3️⃣ PRODUCTS: Permitir lectura de productos en proyectos públicos
CREATE POLICY "Public products readable"
  ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM project_products pp
      JOIN projects p ON p.project_id = pp.project_id
      WHERE pp.product_id = products.product_id
        AND p.is_public = TRUE
    )
  );

-- 4️⃣ VIEW_PRODUCTS: Permitir lectura de relaciones en proyectos públicos
CREATE POLICY "Public view_products readable"
  ON view_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM views v
      JOIN projects p ON p.project_id = v.project_id
      WHERE v.view_id = view_products.view_id
        AND p.is_public = TRUE
    )
  );

-- 5️⃣ PROJECT_PRODUCTS: Permitir lectura de relaciones en proyectos públicos
CREATE POLICY "Public project_products readable"
  ON project_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.project_id = project_products.project_id
        AND p.is_public = TRUE
    )
  );

-- ==================================================
-- ✅ VERIFICACIÓN - Ejecuta estas consultas para probar
-- ==================================================

-- 1. Verificar que el proyecto existe y es público
-- SELECT 
--   project_id,
--   name,
--   public_key,
--   is_public
-- FROM projects
-- WHERE public_key = '06abb44219d9efe7';

-- 2. Verificar vistas del proyecto (reemplaza el project_id)
-- SELECT 
--   view_id,
--   idx,
--   name
-- FROM views
-- WHERE project_id = 'TU_PROJECT_ID_AQUI'
-- ORDER BY idx;

-- 3. Verificar productos de una vista (reemplaza el view_id)
-- SELECT 
--   vp.view_id,
--   p.product_id,
--   p.name
-- FROM view_products vp
-- JOIN products p ON p.product_id = vp.product_id
-- WHERE vp.view_id = 'TU_VIEW_ID_AQUI';

