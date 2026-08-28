# Helikon.IA — desarrollo visual local

El proyecto usa Next.js. El contenedor local instala las dependencias y expone el puerto 3000.

Ejecuta:

```bash
npm run dev
```

Abre el puerto reenviado **3000**. Next.js proporciona recarga automática durante el desarrollo, por lo que los cambios de interfaz se reflejan en el navegador sin desplegar en Vercel.

Las variables de entorno reales deben permanecer fuera del repositorio.

La rama de despliegue se mantiene sincronizada con `main` para evitar servir una versión antigua del proyecto.
