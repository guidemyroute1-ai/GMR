import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export async function uploadToSupabase(uri: string, mimeType: string, fileName: string, folder = 'listing-images') {
  const bucket =
    folder.includes('document') || folder.includes('docs')
      ? 'partner-documents'
      : folder.includes('avatar') || folder.includes('profile')
        ? 'avatars'
        : 'listing-images';

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const { error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
      contentType: mimeType || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading file:', err);
    throw err;
  }
}
