import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAyuJsonList } from '../../../reducers/ayu.reducer';
import type { RootState } from '../../../store/store';
import { fetchAyuJsonList } from '../services/ayu.service';
import type { AyuJsonItem } from '../../ayu-library/types/ayu-json.types';
import { safeJsonParse } from '../../ayu-library/utils/json.utils';

export function useAyuJsonList(keyName: string) {
  const dispatch = useDispatch();

  const ayuState = useSelector((state: RootState) => state.ayu);

  const list = ayuState?.list ?? [];
  const storedKey = ayuState?.keyName;

  useEffect(() => {
    if (storedKey === keyName && list.length > 0) return;

    async function load() {
      const response = await fetchAyuJsonList(keyName);

      // response is AyuApiResponse
      const parsedList: AyuJsonItem[] = response.data
        .map((item): AyuJsonItem | null => {
          const parsed = safeJsonParse(item.json);

          if (parsed === null) {
            return null;
          }

          return {
            id: item.id,
            name: item.name,
            keyName: item.keyName,
            isActive: item.isActive,
            json: parsed,
          };
        })
        .filter((item): item is AyuJsonItem => item !== null);
      dispatch(setAyuJsonList(keyName, parsedList));
    }

    load();
  }, [keyName, storedKey, list.length, dispatch]);

  return list;
}
