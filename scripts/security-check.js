#!/usr/bin/env node
/**
 * Script de verificación de seguridad antes del build de producción
 * Ejecuta varias comprobaciones para asegurar que el proyecto esté listo para producción
 */

const fs = require("fs");
const path = require("path");

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let errors = 0;
let warnings = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  errors++;
  log(`❌ ERROR: ${message}`, colors.red);
}

function warning(message) {
  warnings++;
  log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// 1. Verificar que exista .env.local o variables de entorno
function checkEnvironmentVariables() {
  info("Verificando variables de entorno...");

  const envPath = path.join(process.cwd(), ".env.local");
  const envExists = fs.existsSync(envPath);

  if (!envExists && process.env.NODE_ENV !== "production") {
    warning(
      "No se encontró archivo .env.local (esto es normal en desarrollo local)"
    );
  }

  // Verificar variables críticas solo en producción
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];

  // Solo validar en producción o si existe .env.local
  if (process.env.NODE_ENV === "production" || envExists) {
    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        warning(`Variable de entorno recomendada: ${varName}`);
      }
    });
  } else {
    info("Modo desarrollo: saltando verificación de variables de entorno");
  }

  // Verificar que no haya claves privadas expuestas
  const dangerousVars = ["SUPABASE_SERVICE_ROLE_KEY", "PRIVATE_KEY"];
  dangerousVars.forEach((varName) => {
    const publicVarName = `NEXT_PUBLIC_${varName}`;
    if (process.env[publicVarName]) {
      error(
        `Variable sensible expuesta como pública: ${publicVarName} (no debe tener prefijo NEXT_PUBLIC_)`
      );
    }
  });

  success("Verificación de variables de entorno completada");
}

// 2. Verificar que no haya console.log en producción
function checkConsoleLogs() {
  info("Verificando console.log innecesarios...");

  const srcPath = path.join(process.cwd(), "src");
  let consoleCount = 0;

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        const content = fs.readFileSync(filePath, "utf8");
        const matches = content.match(/console\.(log|debug|info|warn)/g);
        if (matches) {
          consoleCount += matches.length;
        }
      }
    });
  }

  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
  }

  if (consoleCount > 50) {
    warning(
      `Se encontraron ${consoleCount} console.log/debug/info. Considera usar un logger en producción.`
    );
  } else {
    success(`Console.log encontrados: ${consoleCount} (aceptable)`);
  }
}

// 3. Verificar configuración de seguridad
function checkSecurityConfig() {
  info("Verificando configuración de seguridad...");

  const nextConfigPath = path.join(process.cwd(), "next.config.ts");

  if (!fs.existsSync(nextConfigPath)) {
    error("No se encontró next.config.ts");
    return;
  }

  const content = fs.readFileSync(nextConfigPath, "utf8");

  // Verificar headers de seguridad importantes
  const securityHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Content-Security-Policy",
    "Strict-Transport-Security",
  ];

  securityHeaders.forEach((header) => {
    if (!content.includes(header)) {
      warning(`Header de seguridad no encontrado en next.config.ts: ${header}`);
    }
  });

  // Verificar que poweredByHeader esté deshabilitado
  if (!content.includes("poweredByHeader: false")) {
    warning(
      'Considera agregar "poweredByHeader: false" en next.config.ts para mayor seguridad'
    );
  }

  success("Verificación de configuración de seguridad completada");
}

// 4. Verificar que .gitignore esté correctamente configurado
function checkGitignore() {
  info("Verificando .gitignore...");

  const gitignorePath = path.join(process.cwd(), ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    error("No se encontró archivo .gitignore");
    return;
  }

  const content = fs.readFileSync(gitignorePath, "utf8");

  const requiredPatterns = [".env.local", "node_modules", ".next"];

  requiredPatterns.forEach((pattern) => {
    if (!content.includes(pattern)) {
      error(`Patrón importante faltante en .gitignore: ${pattern}`);
    }
  });

  success("Verificación de .gitignore completada");
}

// 5. Verificar que no haya secretos hardcodeados
function checkHardcodedSecrets() {
  info("Verificando secretos hardcodeados...");

  const srcPath = path.join(process.cwd(), "src");
  const suspiciousPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi,
  ];

  let foundSecrets = false;

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        const content = fs.readFileSync(filePath, "utf8");

        suspiciousPatterns.forEach((pattern) => {
          if (pattern.test(content)) {
            warning(`Posible secreto hardcodeado en: ${filePath}`);
            foundSecrets = true;
          }
        });
      }
    });
  }

  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
  }

  if (!foundSecrets) {
    success("No se encontraron secretos hardcodeados obvios");
  }
}

// 6. Verificar dependencias de seguridad
function checkDependencies() {
  info("Verificando dependencias...");

  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    error("No se encontró package.json");
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Verificar que no haya dependencias con vulnerabilidades conocidas
  info(
    "Recomendación: Ejecuta 'npm audit' para verificar vulnerabilidades conocidas"
  );

  success("Verificación de dependencias completada");
}

// Ejecutar todas las verificaciones
function runSecurityChecks() {
  log(
    "\n🔒 Iniciando verificación de seguridad para producción...\n",
    colors.blue
  );

  checkEnvironmentVariables();
  checkConsoleLogs();
  checkSecurityConfig();
  checkGitignore();
  checkHardcodedSecrets();
  checkDependencies();

  log("\n" + "=".repeat(60), colors.cyan);

  if (errors > 0) {
    log(`\n❌ Verificación FALLIDA: ${errors} errores encontrados`, colors.red);
    log("Por favor, corrige los errores antes de hacer deploy a producción.\n");
    process.exit(1);
  } else if (warnings > 0) {
    log(
      `\n⚠️  Verificación completada con ${warnings} advertencias`,
      colors.yellow
    );
    log(
      "Considera revisar las advertencias antes de hacer deploy a producción.\n"
    );
    process.exit(0);
  } else {
    log(
      "\n✅ Verificación EXITOSA: Todo listo para producción!\n",
      colors.green
    );
    process.exit(0);
  }
}

// Ejecutar
runSecurityChecks();
