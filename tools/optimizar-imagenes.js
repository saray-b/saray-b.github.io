/* Optimiza las imágenes de un proyecto: PNG/JPG -> WebP (tamaño completo y versión de 720 px para móvil)
   y actualiza src/data/img-dims.json, que usa el sitio para reservar espacio y elegir el tamaño.

   Uso (una vez: npm install -D sharp):
     node tools/optimizar-imagenes.js public/assets/mi-proyecto

   Después usa en src/data/projects.json las rutas con la extensión .webp (por ejemplo "/assets/mi-proyecto/pantalla.webp").
   Los PNG/JPG originales no se borran: muévelos fuera de la carpeta del sitio cuando quieras. */
const fs = require("fs");
const path = require("path");
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("Falta sharp: ejecuta  npm install -D sharp");
  process.exit(1);
}

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error("Indica la carpeta: node tools/optimizar-imagenes.js public/assets/mi-proyecto");
  process.exit(1);
}
const dimsFile = path.join(__dirname, "..", "src", "data", "img-dims.json");

(async () => {
  const dims = fs.existsSync(dimsFile) ? JSON.parse(fs.readFileSync(dimsFile, "utf8")) : {};
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => /\.(png|jpe?g)$/i.test(x))) {
    const name = f.replace(/\.[^.]+$/, "");
    const src = path.join(dir, f);
    const meta = await sharp(src).metadata();
    dims[name] = [meta.width, meta.height];
    await sharp(src).webp({ quality: 80, effort: 5 }).toFile(path.join(dir, name + ".webp"));
    if (meta.width > 800) await sharp(src).resize({ width: 720 }).webp({ quality: 80, effort: 5 }).toFile(path.join(dir, name + "-720.webp"));
    n++;
  }
  fs.writeFileSync(dimsFile, JSON.stringify(dims) + "\n");
  console.log(n + " imágenes optimizadas en " + dir);
})();
