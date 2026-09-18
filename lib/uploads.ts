export async function imageFileToDataUrl(file: File) {
  const allowed = ['image/png','image/jpeg','image/webp'];
  if(!allowed.includes(file.type)) throw new Error('Only PNG, JPG/JPEG, and WEBP images are allowed.');
  if(file.size > 2 * 1024 * 1024) throw new Error('Image must be 2 MB or smaller.');
  return await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=()=>reject(new Error('Unable to read image.')); r.readAsDataURL(file); });
}
