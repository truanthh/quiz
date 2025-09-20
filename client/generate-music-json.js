import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import NodeID3 from "node-id3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути к папкам
const musicDir = path.join(__dirname, "public", "music");
const postersDir = path.join(__dirname, "public", "posters");
const outputFile = path.join(__dirname, "tracks.json");

// Создаем папку для постеров если её нет
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

async function extractMetadataFromFile(filePath, filename) {
  try {
    // Читаем ID3 теги из MP3 файла
    const tags = NodeID3.read(filePath);

    // Извлекаем обложку если есть
    let posterPath = "/posters/default.jpg";
    if (tags.image && tags.image.imageBuffer) {
      const posterFilename = `poster_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const posterFullPath = path.join(postersDir, posterFilename);

      // Сохраняем обложку в папку posters
      fs.writeFileSync(posterFullPath, tags.image.imageBuffer);
      posterPath = `/posters/${posterFilename}`;

      console.log(`💾 Сохранена обложка: ${posterFilename}`);
    }

    return {
      artist: tags.artist || "Unknown Artist",
      title: tags.title || filename.replace(/\.mp3$/i, ""),
      album: tags.album || "",
      year: tags.year || "",
      genre: tags.genre || "",
      posterPath: posterPath,
    };
  } catch (error) {
    console.error(`❌ Ошибка чтения метаданных ${filename}:`, error.message);

    // Возвращаем fallback данные если не удалось прочитать теги
    return {
      artist: "Unknown Artist",
      title: filename.replace(/\.mp3$/i, ""),
      album: "",
      year: "",
      genre: "",
      posterPath: "/posters/default.jpg",
    };
  }
}

async function generateMusicLibrary() {
  console.log("🔍 Сканирую папку с музыкой...");
  console.log("Папка:", musicDir);

  if (!fs.existsSync(musicDir)) {
    console.error("❌ Папка music не существует!");
    console.log("Создайте папку: client/public/music/");
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(musicDir);
    const mp3Files = files.filter(
      (file) => file.toLowerCase().endsWith(".mp3") && !file.startsWith("."),
    );

    console.log(`🎵 Найдено MP3 файлов: ${mp3Files.length}`);

    if (mp3Files.length === 0) {
      console.log("ℹ️  Положите MP3 файлы в папку client/public/music/");
      process.exit(0);
    }

    const tracks = [];

    // Обрабатываем каждый файл асинхронно
    for (const filename of mp3Files) {
      const filePath = path.join(musicDir, filename);
      console.log(`📖 Читаю метаданные: ${filename}`);

      const metadata = await extractMetadataFromFile(filePath, filename);

      tracks.push({
        artist: metadata.artist,
        name: metadata.title,
        album: metadata.album,
        year: metadata.year,
        genre: metadata.genre,
        src: `/music/${filename}`,
        posterImg: metadata.posterPath,
        filename: filename,
      });
    }

    const musicLibrary = {
      generated: new Date().toISOString(),
      totalTracks: tracks.length,
      tracks: tracks,
    };

    fs.writeFileSync(outputFile, JSON.stringify(musicLibrary, null, 2));

    console.log("✅ Готово!");
    console.log(`📁 JSON файл создан: client/public/music-library.json`);

    // Статистика
    const withPosters = tracks.filter(
      (track) => track.posterImg !== "/posters/default.jpg",
    ).length;
    console.log(`🎶 Треков с обложками: ${withPosters}/${tracks.length}`);

    console.log("\n📋 Список треков:");
    tracks.forEach((track, index) => {
      const posterStatus =
        track.posterImg !== "/posters/default.jpg" ? "🎨" : "⚪";
      console.log(
        `${index + 1}. ${posterStatus} ${track.artist} - ${track.name}`,
      );
    });
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    process.exit(1);
  }
}

// Запускаем генерацию
generateMusicLibrary();
