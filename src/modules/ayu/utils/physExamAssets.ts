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
