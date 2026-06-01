// Import all physicalExamAssets images statically so Vite bundles them
export const physExamAssets: Record<string, string> = import.meta.glob(
  '../assets/physicalExamAssets/*.{jpg,jpeg,png,mp4}',
  { eager: true, import: 'default' }
) as Record<string, string>;

export function getJobAidUrl(fileName: string): string | undefined {
  const key = Object.keys(physExamAssets).find(k =>
    k.includes(`/${fileName}.`)
  );
  return key ? physExamAssets[key] : undefined;
}

/**
 * Media type derived from the ACTUAL bundled asset's extension, not the FHIR
 * `job-aid-type` extension — which can disagree with the file (e.g. a pallor
 * reference declared "video" while the bundled asset is a .jpg, making the UI
 * render a <video> for an image). Resolving from the same matched asset as
 * getJobAidUrl keeps the element and the source consistent.
 */
export function getJobAidType(fileName: string): 'image' | 'video' | undefined {
  const key = Object.keys(physExamAssets).find(k =>
    k.includes(`/${fileName}.`)
  );
  if (!key) return undefined;
  return /\.mp4$/i.test(key) ? 'video' : 'image';
}
