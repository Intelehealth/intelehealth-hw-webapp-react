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

export type PdfOperation = 'print' | 'share';

const PENDING_MESSAGE: Record<PdfOperation, string> = {
  print: 'Preparing your prescription...',
  share: 'Opening WhatsApp...',
};

const FAILURE_MESSAGE: Record<PdfOperation, string> = {
  print: 'Failed to print prescription PDF',
  share: 'Failed to share prescription PDF',
};

/**
 * Runs a Print or Share of a visit's prescription PDF, shared by every screen
 * that offers them.
 *
 * - One operation at a time. The guard is checked before a tab is opened, so a
 *   double click opens nothing extra and fetches nothing twice.
 * - The tab is opened here, synchronously inside the click, so the pop-up
 *   blocker allows it; it is handed to the action and closed again unless the
 *   action succeeds and takes it over.
 * - Cancelled when the component unmounts: no request result, print or tab
 *   survives the screen, and nothing is reported afterwards.
 * - Resolves true when the action completed, and false when there was nothing
 *   to do (already running, pop-up blocked, tab closed, cancelled); the user
 *   has already been told where that matters. Rejects only on a real failure,
 *   after logging the safe details of the error.
 */
export function usePrescriptionPdfAction(visitId: string) {
  const [pdfOp, setPdfOp] = useState<PdfOperation | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(
    async (
      op: PdfOperation,
      action: (
        pdfData: PrescriptionData,
        signal: AbortSignal,
        win: Window
      ) => Promise<void>
    ): Promise<boolean> => {
      if (abortRef.current) return false;
      const win = openPendingWindow(PENDING_MESSAGE[op]);
      if (!win) {
        showToast('Error', POPUP_BLOCKED_MESSAGE, 'error');
        return false;
      }
      const controller = new AbortController();
      const { signal } = controller;
      abortRef.current = controller;
      setPdfOp(op);
      let handedOff = false;
      try {
        const pdfData = await getVisitPrescriptionData(visitId, signal);
        if (signal.aborted) return false;
        // writing into a closed tab is a silent no-op, so say what happened
        if (win.closed) throw new TabClosedError();
        await action(pdfData, signal, win);
        handedOff = true;
      } catch (err) {
        if (signal.aborted) return false;
        if (err instanceof TabClosedError) {
          showToast('Error', TAB_CLOSED_MESSAGE, 'error');
          return false;
        }
        console.error(FAILURE_MESSAGE[op], describeError(err));
        throw new Error(FAILURE_MESSAGE[op]);
      } finally {
        if (!handedOff) win.close();
        abortRef.current = null;
        if (!signal.aborted) setPdfOp(null);
      }
      // reached only when the action ran; false if the user left meanwhile
      return !signal.aborted;
    },
    [visitId]
  );

  return { pdfOp, run };
}
