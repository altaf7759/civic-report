import { apiRequest } from "./queryClient";

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  const result = await response.json();
  return result.url;
}

export async function getStates() {
  const response = await fetch('/api/states', {
    credentials: 'include',
  });
  return response.json();
}

export async function getCities(state: string) {
  const response = await fetch(`/api/cities/${state}`, {
    credentials: 'include',
  });
  return response.json();
}
