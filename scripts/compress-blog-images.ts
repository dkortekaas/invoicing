/**
 * Compresses images in public/blog for better PageSpeed.
 * Run as part of build (e.g. prebuild) to resize and compress JPEG/PNG/WebP.
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const BLOG_IMAGES_DIR = path.join(process.cwd(), "public", "blog");
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const PNG_COMPRESSION_LEVEL = 9;
const WEBP_QUALITY = 82;

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

async function compressImage(filePath: string): Promise<{ saved: number }> {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const originalSize = stat.size;

  const pipeline = sharp(filePath)
    .resize(MAX_WIDTH, undefined, { fit: "inside", withoutEnlargement: true });

  const tempPath = `${filePath}.tmp-${Date.now()}`;

  try {
    if (ext === ".jpg" || ext === ".jpeg") {
      await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tempPath);
    } else if (ext === ".png") {
      await pipeline.png({ compressionLevel: PNG_COMPRESSION_LEVEL }).toFile(tempPath);
    } else if (ext === ".webp") {
      await pipeline.webp({ quality: WEBP_QUALITY }).toFile(tempPath);
    } else {
      return { saved: 0 };
    }

    const newStat = fs.statSync(tempPath);
    if (newStat.size < originalSize) {
      fs.renameSync(tempPath, filePath);
      return { saved: originalSize - newStat.size };
    }
    fs.unlinkSync(tempPath);
    return { saved: 0 };
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

async function main() {
  if (!fs.existsSync(BLOG_IMAGES_DIR)) {
    console.log("No public/blog directory, skipping image compression.");
    return;
  }

  const files = fs.readdirSync(BLOG_IMAGES_DIR).filter((f) => IMAGE_EXT.test(f));
  if (files.length === 0) {
    console.log("No images to compress in public/blog.");
    return;
  }

  console.log(`Compressing ${files.length} image(s) in public/blog...`);
  let totalSaved = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_IMAGES_DIR, file);
    try {
      const { saved } = await compressImage(filePath);
      totalSaved += saved;
      if (saved > 0) {
        console.log(`  ${file}: saved ${(saved / 1024).toFixed(1)} KB`);
      }
    } catch (err) {
      console.error(`  ${file}: failed`, err);
      process.exit(1);
    }
  }

  if (totalSaved > 0) {
    console.log(`Done. Total saved: ${(totalSaved / 1024).toFixed(1)} KB`);
  } else {
    console.log("Done. Images already optimized or no size reduction.");
  }
}

main();
