# Design Score - Visualizador 3D

Plataforma de visualización 3D interactiva construida con Next.js 16 y KeyShot XR.

## 🚀 Características

- ✅ **Next.js 16** con Turbopack para builds ultra-rápidos
- ✅ **KeyShot XR** para visualización 3D interactiva
- ✅ **Supabase** para autenticación y almacenamiento
- ✅ **Upload de archivos RAR** con procesamiento automático
- ✅ **Gestión de productos** con interfaz completa
- ✅ **Optimización de imágenes** con precarga inteligente
- ✅ **Lazy loading** de componentes pesados
- ✅ **Cache agresivo** para assets estáticos
- ✅ **TypeScript** para type safety

## 📦 Optimizaciones Implementadas

### Performance

- **Lazy Loading**: Componentes 3D cargados bajo demanda
- **Image Preloading**: Sistema de caché con precarga inteligente
- **Memoization**: Componentes y cálculos memoizados
- **Bundle Splitting**: Código dividido automáticamente

### Caching

- **Static Assets**: Cache de 1 año para JS/imágenes estáticas
- **Supabase Client**: Cliente reutilizado entre peticiones
- **Image Cache**: Cache en memoria para frames 3D

### SEO & Security

- **Meta Tags**: OpenGraph y metadata optimizada
- **Security Headers**: X-Frame-Options, CSP, etc.
- **Font Display Swap**: Carga optimizada de fuentes

## 🛠️ Instalación

```bash
npm install
```

## 🔧 Variables de Entorno

Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="tu_url_supabase"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="tu_key"
NEXT_PUBLIC_SUPABASE_STORAGE_URL="url_storage"
```

## 🚀 Desarrollo

```bash
npm run dev
```

Luego accede a:

- **Página principal**: http://localhost:3000
- **Panel de upload**: http://localhost:3000/upload

## 📦 Build de Producción

```bash
npm run build
npm start
```

## 📊 Performance Metrics

- **Build Time**: ~4.5s con Turbopack
- **Bundle Size**: Optimizado con tree-shaking
- **Image Loading**: Precarga inteligente de frames adyacentes
- **Cache Hit Rate**: Alta gracias a headers optimizados

## 🏗️ Arquitectura

```
src/
├── app/                    # App router de Next.js
│   ├── actions/           # Server actions
│   │   ├── authActions.ts      # Autenticación
│   │   ├── productActions.ts   # Productos
│   │   ├── projectActions.ts   # Proyectos
│   │   └── viewActions.ts      # Vistas
│   ├── api/               # API Routes
│   │   └── upload-rar/    # Endpoint para procesar RAR
│   ├── upload/            # Página de gestión y upload
│   ├── layout.tsx         # Layout raíz con metadata
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── AuthForm.tsx            # Formulario de autenticación
│   ├── KeyShotXRViewer.tsx     # Visor 3D (lazy loaded)
│   ├── UploadRarForm.tsx       # Upload de archivos RAR
│   └── UploadFolderForm.tsx    # Upload de carpetas
├── lib/                   # Utilidades y helpers
│   ├── fileProcessing.ts       # Procesamiento en cliente
│   └── fileProcessingServer.ts # Procesamiento en servidor
├── domain/                # Lógica de negocio
│   ├── entities/          # Entidades de dominio
│   │   ├── Product.ts
│   │   ├── Project.ts
│   │   ├── View.ts
│   │   └── ViewProduct.ts
│   ├── ports/             # Interfaces de repositorios
│   │   ├── IProductRepository.ts
│   │   ├── IProjectRepository.ts
│   │   ├── IViewRepository.ts
│   │   └── IStorageRepository.ts
│   └── usecase/           # Casos de uso
│       ├── ProductUseCase.ts
│       ├── ProjectUseCase.ts
│       └── ViewUseCase.ts
└── infrastrucutre/        # Implementaciones concretas
    └── supabse/
        ├── client.ts
        ├── SupabaseProductRepository.ts
        ├── SupabaseProjectRepository.ts
        ├── SupabaseViewRepository.ts
        └── SupabaseStorageRepository.ts
```

## 🔍 Tecnologías

- **Next.js 16**: Framework React con App Router
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Estilos utility-first
- **Supabase**: Backend as a Service
- **KeyShot XR**: Visualización 3D interactiva

## � Documentación

- **[Upload RAR API](docs/API_UPLOAD_RAR.md)** - Documentación completa de la API de upload
- **[Página de Upload](docs/UPLOAD_PAGE_GUIDE.md)** - Guía de uso de la interfaz de upload
- **[README Upload](docs/README_UPLOAD_RAR.md)** - Guía general del sistema de upload

## �📝 Notas

- El proyecto usa **clean architecture** para separación de responsabilidades
- Todos los assets estáticos tienen cache agresivo (1 año)
- Las imágenes se precargan inteligentemente según navegación del usuario
- Los componentes 3D no se renderizan en servidor (ssr: false)
- La API de upload procesa archivos RAR automáticamente extrayendo constantes e imágenes

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.
