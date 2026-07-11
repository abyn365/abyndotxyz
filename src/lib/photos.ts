import { kv } from "./kv";
import {
  isS3Enabled,
  uploadFile,
  downloadFileAsJson,
  deleteFile
} from "./s3";

export interface Photo {
  id: string;
  url: string;
  description: string;
  aspectRatio: number;
  tags?: string[];
  createdAt: number;
  blurDataUrl?: string;
}

const INDEX_PATH = "photos/index.json";

export async function getPhotos(): Promise<Photo[]> {
  let index: Photo[] = [];
  
  if (isS3Enabled()) {
    try {
      const s3Index = await downloadFileAsJson<Photo[]>(INDEX_PATH);
      if (s3Index) index = s3Index;
    } catch {
      index = [];
    }
  } else {
    index = (await kv.get<Photo[]>("photos:index")) || [];
  }

  // Sort newest first
  return index.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  const photos = await getPhotos();
  return photos.find((p) => p.id === id) || null;
}

export async function savePhoto(photo: Photo): Promise<void> {
  const photos = await getPhotos();
  const existingIndex = photos.findIndex((p) => p.id === photo.id);
  
  if (existingIndex > -1) {
    photos[existingIndex] = photo;
  } else {
    photos.push(photo);
  }

  if (isS3Enabled()) {
    await uploadFile(INDEX_PATH, JSON.stringify(photos), "application/json");
  } else {
    await kv.set("photos:index", photos);
  }
}

export async function deletePhoto(id: string): Promise<void> {
  const photos = await getPhotos();
  const filteredPhotos = photos.filter((p) => p.id !== id);

  if (isS3Enabled()) {
    await uploadFile(INDEX_PATH, JSON.stringify(filteredPhotos), "application/json");
  } else {
    await kv.set("photos:index", filteredPhotos);
  }
}
