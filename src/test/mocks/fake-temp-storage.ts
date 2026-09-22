import { vi } from 'vitest';

export interface FakeAsset {
  id: number;
  name: string;
  parent_id: string;
  data: { questionId?: string; comment?: string };
  file_path: string;
}

/**
 * In-memory stand-in for the temp-storage backend (MindmapPortalApi), covering
 * only the endpoints the Physical Exam image flow uses: upload an asset, list a
 * visit's assets, delete an asset.
 *
 * Wire it up in a test file with
 *
 *   vi.mock('<path>/services/mindmap', async () => {
 *     const { fakeTempStorage } = await import('<path>/test/mocks/fake-temp-storage');
 *     return { MindmapPortalApi: fakeTempStorage.api };
 *   });
 *
 * and import `fakeTempStorage` normally to inspect or steer it.
 */
export const fakeTempStorage = {
  nextId: 1,
  assets: [] as FakeAsset[],
  /** When set, uploads wait for it before the asset is created. */
  uploadGate: undefined as Promise<void> | undefined,
  /** When set, deletes wait for it before the asset is removed. */
  deleteGate: undefined as Promise<void> | undefined,
  /** Number of upcoming uploads that should fail. */
  failUploads: 0,
  /** Simulates the backend being unreachable for deletes. */
  failDeletes: false,

  /** Back to an empty backend with no gates or failures; clears call history. */
  reset() {
    this.nextId = 1;
    this.assets = [];
    this.uploadGate = undefined;
    this.deleteGate = undefined;
    this.failUploads = 0;
    this.failDeletes = false;
    this.api.post.mockClear();
    this.api.get.mockClear();
    this.api.delete.mockClear();
  },

  api: {
    post: vi.fn(async (_url: string, form: FormData) => {
      if (fakeTempStorage.uploadGate) await fakeTempStorage.uploadGate;
      if (fakeTempStorage.failUploads > 0) {
        fakeTempStorage.failUploads -= 1;
        throw new Error('upload failed');
      }
      const id = fakeTempStorage.nextId++;
      const name = (form.get('file') as File).name;
      const asset: FakeAsset = {
        id,
        name,
        parent_id: String(form.get('parent_id')),
        data: JSON.parse(String(form.get('data'))),
        file_path: `http://cdn/${id}/${name}`,
      };
      fakeTempStorage.assets.push(asset);
      return { success: true, message: 'ok', data: asset };
    }),
    get: vi.fn(async (url: string) => {
      const parent = /^\/temp-storage\/visit\/(.+)\/children$/.exec(url)![1];
      return {
        success: true,
        message: 'ok',
        data: fakeTempStorage.assets.filter(a => a.parent_id === parent),
      };
    }),
    delete: vi.fn(async (url: string) => {
      if (fakeTempStorage.deleteGate) await fakeTempStorage.deleteGate;
      if (fakeTempStorage.failDeletes) throw new Error('network down');
      const id = Number(url.split('/').pop());
      fakeTempStorage.assets = fakeTempStorage.assets.filter(a => a.id !== id);
      return { success: true, message: 'ok', data: null };
    }),
  },
};
