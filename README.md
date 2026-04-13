# ProCita 💈

App de gestión de citas para barberías, salones y centros de uñas.

## Cómo subir a Vercel

### Opción 1: Desde GitHub (recomendado)

1. Crea un repositorio en github.com
2. Sube estos archivos
3. En Vercel: "Add New Project" → conecta tu repo → Deploy

### Opción 2: Con Vercel CLI

```bash
npm install -g vercel
vercel
```

## Estructura del proyecto

```
procita/
├── public/
│   ├── manifest.json   # PWA config
│   └── sw.js           # Service Worker
├── src/
│   ├── App.jsx         # App completa
│   ├── main.jsx        # Entry point
│   ├── supabase.js     # Conexión BD
│   └── index.css       # Estilos
├── index.html
├── package.json
└── vite.config.js
```

## Tecnologías

- React + Vite
- Supabase (base de datos)
- PWA instalable en Android e iOS
