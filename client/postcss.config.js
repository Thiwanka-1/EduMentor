import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
  plugins: {
    "@tailwindcss/postcss": {},  // v4 plugin
    autoprefixer: {},
  },
}; 