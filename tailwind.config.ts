import type { Config } from "tailwindcss";

// Tailwind solo se aplica al marketplace: `content` apunta a sus rutas y
// componentes, y `preflight` queda desactivado para no pisar los estilos
// heredados de la plataforma de aprendizaje (app/globals.css).
const config: Config = {
  content: [
    "./app/marketplace/**/*.{ts,tsx}",
    "./components/marketplace/**/*.{ts,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        campo: {
          50: "#f2f8f1",
          100: "#e0efdd",
          200: "#c2dfbe",
          300: "#95c78e",
          400: "#63a75c",
          500: "#428a3d",
          600: "#316e2d",
          700: "#285726",
          800: "#224622",
          900: "#1d3a1e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
