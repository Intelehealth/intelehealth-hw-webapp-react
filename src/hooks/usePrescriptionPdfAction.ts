import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getVisitPrescriptionData,
  type PrescriptionData,
} from '../services/visit-prescription.service';
import { showToast } from '../services/toast';
import {
  POPUP_BLOCKED_MESSAGE,
  TAB_CLOSED_MESSAGE,
  TabClosedError,
} from '../utils/pdf-window';
import { describeError } from '../utils/safe-error';
import { openPendingWindow } from '../utils/visit-prescription-pdf';

export type PdfOperation = 'print' | 'share' | 'download';

/**
 * Print and Share hand a tab to the PDF step, opened in the click. Download
 * saves a file and needs no tab.
 */
const PENDING_MESSAGE: Partial<Record<PdfOperation, string>> = {
  print: 'Preparing your prescription...',
  share: 'Opening WhatsApp...',
};

const FAILURE_MESSAGE: Record<PdfOperation, string> = {
  print: 'Failed to print prescription PDF',
  share: 'Failed to share prescription PDF',
  download: 'Failed to download prescription PDF',
};

/**
 * Runs a Print, Share or Download of a visit's prescription PDF, shared by
 * every screen that offers them.
 *
 * - One operation at a time. The guard is checked before a tab is opened, so a
 *   double click opens nothing extra and fetches nothing twice.
 * - For Print and Share the tab is opened here, synchronously inside the
 *   click, so the pop-up blocker allows it; it is handed to the action and
 *   closed again unless the action succeeds and takes it over.
 * - Cancelled when the component unmounts, and when `visitId` changes while
 *   the component stays mounted (a route parameter change): no request
 *   result, print, download or tab outlives the visit it was started for, and
 *   the buttons are free again for the new visit.
 * - Resolves true when the action completed, and false when there was nothing
 *   to do (already running, pop-up blocked, tab closed, cancelled); the user
 *   has already been told where that matters. Rejects only on a real failure,
 *   after logging the safe details of the error.
 */
export function usePrescriptionPdfAction(visitId: string) {
  const [pdfOp, setPdfOp] = useState<PdfOperation | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // True until the component really unmounts. It starts true because a fast
  // click can arrive before the effect below has run for the first time.
  const mountedRef = useRef(true);
  const visitIdRef = useRef(visitId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // React StrictMode (development) runs this cleanup and then the setup
      // again straight away. Aborting here would cancel an operation that a
      // fast click had just started, so abort only if the component is still
      // unmounted once the setup has had its chance to run.
      queueMicrotask(() => {
        if (!mountedRef.current) abortRef.current?.abort();
      });
    };
  }, []);

  // The page can stay mounted while its visit changes (browser Back/Forward
  // between two prescriptions). Whatever was running belongs to the old visit,
  // so stop it and free the buttons. The comparison also keeps StrictMode's
  // repeat of this effect, where nothing has changed, from cancelling anything.
  useEffect(() => {
    if (visitIdRef.current === visitId) return;
    visitIdRef.current = visitId;
    abortRef.current?.abort();
    abortRef.current = null;
    setPdfOp(null);
  }, [visitId]);

  const run = useCallback(
    async (
      op: PdfOperation,
      action: (
        pdfData: PrescriptionData,
        signal: AbortSignal,
        win: Window | null
      ) => Promise<void>
    ): Promise<boolean> => {
      if (abortRef.current) return false;
      let win: Window | null = null;
      const pendingMessage = PENDING_MESSAGE[op];
      if (pendingMessage !== undefined) {
        win = openPendingWindow(pendingMessage);
        if (!win) {
          showToast('Error', POPUP_BLOCKED_MESSAGE, 'error');
          return false;
        }
      }
      const controller = new AbortController();
      const { signal } = controller;
      // also true between a real unmount and the abort above
      const cancelled = () => signal.aborted || !mountedRef.current;
      abortRef.current = controller;
      setPdfOp(op);
      let handedOff = false;
      try {
        const pdfData = await getVisitPrescriptionData(visitId, signal);
        if (cancelled()) return false;
        // writing into a closed tab is a silent no-op, so say what happened
        if (win?.closed) throw new TabClosedError();
        await action(pdfData, signal, win);
        handedOff = true;
      } catch (err) {
        if (cancelled()) return false;
        if (err instanceof TabClosedError) {
          showToast('Error', TAB_CLOSED_MESSAGE, 'error');
          return false;
        }
        console.error(FAILURE_MESSAGE[op], describeError(err));
        throw new Error(FAILURE_MESSAGE[op]);
      } finally {
        if (!handedOff) win?.close();
        // a cancelled operation must not clear the guard of one started since
        if (abortRef.current === controller) abortRef.current = null;
        if (!cancelled()) setPdfOp(null);
      }
      // reached only when the action ran; false if the user left meanwhile
      return !cancelled();
    },
    [visitId]
  );

  return { pdfOp, run };
}
