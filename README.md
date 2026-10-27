# Mi DAM — aplicación web

Aplicación React + Vite para gestionar módulos de DAM, exámenes, notas ponderadas y objetivos. Supabase proporciona autenticación y almacenamiento en la nube; Vercel publica la web.

## Antes de empezar

Necesitas cuentas gratuitas en:
- GitHub: https://github.com
- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com

**Importante:** este repositorio/proyecto todavía no está publicado. Para que funcione con tu cuenta, tienes que crear los servicios y configurar las variables de entorno indicadas abajo. No compartas contraseñas ni claves privadas.

## 1. Crear la base de datos

1. Entra en Supabase y crea un proyecto nuevo.
2. Abre **SQL Editor → New query**.
3. Copia y ejecuta todo el contenido de `supabase/schema.sql`.
4. En **Project Settings → API** (o Connect), copia la **Project URL** y la clave pública **anon/publishable**. No uses nunca `service_role` en el frontend.
5. En **Authentication → URL Configuration**, añade la URL local durante desarrollo y, después, tu dominio de Vercel a Site URL y Redirect URLs, según corresponda. Por ejemplo, `http://localhost:5173` y `https://TU-PROYECTO.vercel.app`.
6. En Authentication > Providers, comprueba que Email está activado. Para una app pública, configura la confirmación de correo y el proveedor SMTP si necesitas una entrega fiable de mensajes.

## 2. Ejecutar en tu ordenador

Instala Node.js LTS desde https://nodejs.org y Git desde https://git-scm.com.

En la carpeta del proyecto:

```bash
npm install
```

Copia `.env.example` como `.env` y rellena los valores de Supabase:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
```

Después ejecuta:

```bash
npm run dev
```

Abre la dirección local que Vite indique (normalmente `http://localhost:5173`).

## 3. Publicar gratis en Vercel

1. Sube esta carpeta a un repositorio nuevo en GitHub. No subas el archivo `.env`; ya está excluido mediante `.gitignore`.
2. Entra en Vercel y elige **Add New → Project**. Importa el repositorio.
3. Vercel debería detectar Vite automáticamente. Comando de build: `npm run build`; directorio de salida: `dist`.
4. En **Environment Variables**, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de tu proyecto.
5. Pulsa Deploy.
6. Copia la URL pública que Vercel te proporcione.
7. Vuelve a Supabase > Authentication > URL Configuration y configura esa URL como Site URL y Redirect URL.
8. Prueba el registro, la confirmación por correo (si está activada), el inicio de sesión, la creación de una asignatura, guardar notas, cerrar sesión y entrar desde otro dispositivo.

Cada vez que subas cambios al repositorio conectado, Vercel podrá desplegarlos automáticamente.

## Seguridad y limitaciones

- Las notas se guardan en Supabase y están protegidas mediante Row Level Security (RLS); cada usuario solo puede consultar y modificar sus propios registros.
- La clave `anon`/publishable está diseñada para uso en el cliente, pero **RLS debe permanecer activado**. Nunca pongas una clave `service_role` en el navegador ni en variables `VITE_`.
- El plan gratuito de Supabase puede pausar proyectos con poca actividad y no sustituye a una estrategia de copias de seguridad. Exporta periódicamente tus notas con el botón CSV.
- La media global actual es una media ponderada de las evaluaciones registradas. Para calcular la nota oficial final, configura pesos acordes con los criterios de tu profesor.
- La lista de asignaturas iniciales se muestra como guía en esta documentación; crea tus módulos reales en la app. No se crean automáticamente en la base de datos.
- La aplicación no se ha desplegado automáticamente desde este paquete. La publicación requiere que el propietario cree las cuentas, configure Supabase y conecte el repositorio a Vercel.

## Archivos

- `src/App.jsx`: interfaz, autenticación y operaciones de notas.
- `src/styles.css`: diseño adaptable a móvil y ordenador.
- `supabase/schema.sql`: tablas, índices, restricciones y políticas RLS.
- `.env.example`: plantilla de configuración (sin credenciales reales).
