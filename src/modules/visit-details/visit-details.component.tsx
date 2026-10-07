import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import ROUTES from '../../routes/paths';
import iconPhone from '../../assets/icons/appointment/green-field-apm-phone-icon.svg';
import iconAngleRight from '../../assets/icons/appointment/icon-apm-angle-small-right.svg';
import iconCalendar from '../../assets/icons/appointment/icon-apm-calendar.svg';
import iconClock from '../../assets/icons/appointment/icon-apm-clock-time.svg';
import iconPatientPhoto from '../../assets/icons/appointment/icon-patient-image.svg';
import iconPrescriptionPlain from '../../assets/icons/appointment/icons-patient-recevied.svg';
import iconGeneralPhysician from '../../assets/icons/appointment/violet-field-apm-general-physician.svg';
import iconPrescription from '../../assets/icons/appointment/violet-field-apm-prescription.svg';
import iconVisitSummary from '../../assets/icons/appointment/violet-field-apm-visit-summary.svg';
import iconChat from '../../assets/icons/icon-chat.svg';
import iconPrint from '../../assets/icons/icon-print.svg';
import iconShare from '../../assets/icons/icon-share.svg';
import iconVisitSummaryIcon from '../../assets/icons/icon-visit-summery.svg';
import Button from '../../components/common/button.component';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import WhatsAppShareModal, {
  SHARE_FAILED_MESSAGE,
} from '../../components/modal/whatsapp-share.modal';
import {
  getVisitPrescriptionData,
  type PrescriptionData,
} from '../../services/visit-prescription.service';
import { showToast } from '../../services/toast';
import {
  POPUP_BLOCKED_MESSAGE,
  TAB_CLOSED_MESSAGE,
} from '../../utils/pdf-window-messages';
import {
  openPendingWindow,
  printVisitPrescriptionPdf,
  shareVisitPrescriptionPdf,
} from '../../utils/visit-prescription-pdf';
import { visitDetailsService } from './visit-details.service';
import type { TransformedVisitDetails } from './visit-details.types';

const PatientInfoCard: React.FC<{
  data: TransformedVisitDetails;
}> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={iconPatientPhoto}
          alt="patient"
          className="w-12 h-12 rounded-full shrink-0"
        />
        <div>
          <p className="font-semibold text-gray-800">
            {data.patientName}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {data.gender}, {data.age} years
            </span>
          </p>
          <p className="text-xs text-gray-500">ID: {data.patientIdentifier}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-1 cursor-pointer"
          onClick={() => {
            /* TODO: Implement phone action */
          }}
          aria-label="Call patient"
        >
          <img src={iconPhone} alt="phone" className="w-7 h-7" />
        </button>
        <button
          className="p-1 cursor-pointer"
          onClick={() => {
            /* TODO: Implement chat action */
          }}
          aria-label="Message patient"
        >
          <img src={iconChat} alt="chat" className="w-7 h-7" />
        </button>
      </div>
    </div>
  </div>
);

const ChiefComplaintSection: React.FC<{
  data: TransformedVisitDetails;
}> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <h3 className="text-base font-semibold text-gray-800">
      Chief Complaint: {data.chiefComplaint}
    </h3>
    {data.chiefComplaintHtml && (
      <div
        className="text-sm text-gray-600 mt-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: data.chiefComplaintHtml }}
      />
    )}
    <p className="text-xs text-gray-400 mt-1">Visit ID: {data.visitId}</p>

    <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
      <span className="flex items-center gap-1.5">
        <img src={iconCalendar} alt="" className="w-4 h-4" />
        Date:{' '}
        <span className="font-semibold text-gray-800">{data.visitDate}</span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="flex items-center gap-1.5">
        <img src={iconClock} alt="" className="w-4 h-4" />
        Time:{' '}
        <span className="font-semibold text-gray-800">{data.visitTime}</span>
      </span>
    </div>

    <div className="flex items-center gap-3 mt-4 bg-[#F5F5FA] rounded-lg p-3">
      <img src={iconGeneralPhysician} alt="" className="w-10 h-10 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {data.doctorSpeciality}
        </p>
        <p className="text-xs text-gray-400">Doctor's speciality</p>
      </div>
    </div>
  </div>
);

const NavigableRow: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  onClick?: () => void;
}> = ({ icon, title, subtitle, subtitleColor = 'text-green-500', onClick }) => (
  <button
    type="button"
    className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <img src={icon} alt="" className="w-8 h-8 shrink-0" />
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>}
      </div>
    </div>
    <img src={iconAngleRight} alt=">" className="w-5 h-5" />
  </button>
);

const FollowUpSection: React.FC<{
  data: TransformedVisitDetails;
  onEndVisit: () => void;
}> = ({ data, onEndVisit }) => {
  if (data.visitStatus === 'Closed') return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {data.followUpDate && (
        <>
          <h3 className="text-base font-semibold text-gray-800">
            Follow up on {data.followUpDate}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Your follow-up time has arrived. Please end the current visit to
            start your follow-up visit.
          </p>
        </>
      )}
      <div className={data.followUpDate ? 'mt-4' : ''}>
        <Button variant="primary" size="sm" fullWidth onClick={onEndVisit}>
          End visit
        </Button>
      </div>
    </div>
  );
};

const VisitStatusCard: React.FC<{
  status: 'Active' | 'Closed';
}> = ({ status }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <h3 className="text-base font-semibold text-gray-800 mb-3">Visit Status</h3>
    <div className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          status === 'Active' ? 'bg-[#06C270]' : 'bg-gray-400'
        }`}
      />
      <span
        className={`text-sm font-medium ${
          status === 'Active' ? 'text-gray-800' : 'text-gray-500'
        }`}
      >
        {status}
      </span>
    </div>
  </div>
);

/**
 * Where the user came from, as set by the screen that navigated here. Used for
 * the breadcrumb and forwarded as navigation state so the next screen can link
 * back too. Read where it is needed instead of being passed down as props.
 */
const useFromState = () => {
  const location = useLocation();
  const state = location.state as {
    fromLabel?: string;
    fromPath?: string;
  } | null;
  return { fromLabel: state?.fromLabel, fromPath: state?.fromPath };
};

const QuickActionsCard: React.FC<{ visitId: string }> = ({ visitId }) => {
  const navigate = useNavigate();
  const { fromLabel, fromPath } = useFromState();
  const [pdfOp, setPdfOp] = useState<'print' | 'share' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  // Controller of the PDF operation currently in flight (if any). Aborted on
  // unmount so the request is cancelled and no print/download fires afterwards.
  const pdfAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      pdfAbortRef.current?.abort();
    };
  }, []);

  // Runs one PDF operation: one at a time, cancellable, silent once aborted.
  // Resolves 'done', 'failed' (already logged; toasted when toastMessage is
  // given), 'closed' (the user closed the pending tab; already toasted), or
  // 'skipped' (ignored while another one runs, or aborted).
  // `win` is the tab opened inside the click; it is closed again unless the
  // action succeeds and takes it over (print / WhatsApp), so no blank tab is
  // left behind.
  const runPdfOperation = useCallback(
    async (
      op: 'print' | 'share',
      win: Window,
      action: (pdfData: PrescriptionData, signal: AbortSignal) => Promise<void>,
      failureMessage: string,
      toastMessage?: string
    ): Promise<'done' | 'failed' | 'skipped' | 'closed'> => {
      if (pdfAbortRef.current) {
        win.close();
        return 'skipped';
      }
      const controller = new AbortController();
      const { signal } = controller;
      pdfAbortRef.current = controller;
      setPdfOp(op);
      let outcome: 'done' | 'failed' = 'done';
      let handedOff = false;
      try {
        const pdfData = await getVisitPrescriptionData(visitId, signal);
        if (signal.aborted) return 'skipped';
        // writing into a closed tab is a silent no-op, so say what happened
        if (win.closed) {
          showToast('Error', TAB_CLOSED_MESSAGE, 'error');
          return 'closed';
        }
        await action(pdfData, signal);
        handedOff = true;
      } catch {
        if (signal.aborted) return 'skipped';
        console.error(failureMessage);
        if (toastMessage) showToast('Error', toastMessage, 'error');
        outcome = 'failed';
      } finally {
        if (!handedOff) win.close();
        if (pdfAbortRef.current === controller) pdfAbortRef.current = null;
        if (!signal.aborted) setPdfOp(null);
      }
      return signal.aborted ? 'skipped' : outcome;
    },
    [visitId]
  );

  const handleViewPrescription = useCallback(() => {
    navigate(generatePath(ROUTES.PRESCRIPTION_DETAIL, { visitId }), {
      state: { fromLabel, fromPath },
    });
  }, [navigate, visitId, fromLabel, fromPath]);

  const handlePrint = useCallback(() => {
    // opened now, inside the click, so the pop-up blocker lets it through
    const win = openPendingWindow('Preparing your prescription...');
    if (!win) {
      showToast('Error', POPUP_BLOCKED_MESSAGE, 'error');
      return;
    }
    return runPdfOperation(
      'print',
      win,
      (pdfData, signal) => printVisitPrescriptionPdf(pdfData, signal, win),
      'Failed to print prescription PDF',
      'Failed to print the prescription. Please try again.'
    );
  }, [runPdfOperation]);

  const handleOpenShareModal = useCallback(() => {
    setShowShareModal(true);
  }, []);

  // The modal stays open on failure: throwing makes it show the failure
  // message in place, with the phone number kept so the user can retry.
  const handleSharePdf = useCallback(
    async (phoneNumber: string) => {
      // opened now, inside the click, so the pop-up blocker lets it through;
      // the modal stays open so the user can allow pop-ups and retry
      const win = openPendingWindow('Opening WhatsApp...');
      if (!win) {
        showToast('Error', POPUP_BLOCKED_MESSAGE, 'error');
        return;
      }
      const outcome = await runPdfOperation(
        'share',
        win,
        (pdfData, signal) =>
          shareVisitPrescriptionPdf(pdfData, phoneNumber, signal, win),
        'Failed to share prescription PDF'
      );
      if (outcome === 'failed') throw new Error(SHARE_FAILED_MESSAGE);
      if (outcome === 'done') setShowShareModal(false);
    },
    [runPdfOperation]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={
            <img src={iconPrescriptionPlain} alt="" className="w-4 h-4" />
          }
          onClick={handleViewPrescription}
        >
          View Prescription
        </Button>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={<img src={iconPrint} alt="" className="w-4 h-4" />}
          onClick={handlePrint}
          disabled={pdfOp !== null}
          isLoading={pdfOp === 'print'}
          loadingText="Printing..."
        >
          Print
        </Button>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={<img src={iconShare} alt="" className="w-4 h-4" />}
          onClick={handleOpenShareModal}
          disabled={pdfOp !== null}
        >
          Share
        </Button>
      </div>

      <WhatsAppShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleSharePdf}
        isLoading={pdfOp === 'share'}
      />
    </div>
  );
};

const VisitDetails: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { showConfirmModal } = useGlobalModal();
  const { fromLabel, fromPath } = useFromState();

  useBreadcrumb(
    [
      { label: 'Dashboard', path: ROUTES.DASHBOARD },
      ...(fromLabel && fromPath ? [{ label: fromLabel, path: fromPath }] : []),
      { label: 'Visit Details' },
    ],
    { bgColor: 'bg-[#F5F5FA]' }
  );

  const [data, setData] = useState<TransformedVisitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;

    setLoading(true);
    setError(null);

    visitDetailsService
      .getVisitDetails(visitId)
      .then(setData)
      .catch(() => setError('Failed to load visit details'))
      .finally(() => setLoading(false));
  }, [visitId]);

  const handleEndVisit = useCallback(() => {
    /* c8 ignore next */
    if (!visitId || !data) return;

    showConfirmModal({
      icon: iconVisitSummaryIcon,
      title: 'End visit?',
      description:
        'Are you sure you want to end this visit? This action cannot be undone.',
      confirmText: 'Yes, end visit',
      cancelText: 'Cancel',
      type: 'confirm',
      open: true,
      onConfirm: async () => {
        try {
          await visitDetailsService.endVisit(visitId);
          /* c8 ignore next */
          setData(prev => (prev ? { ...prev, visitStatus: 'Closed' } : prev));
        } catch {
          // Generic message only: the raw error can carry patient data or tokens.
          console.error('Failed to end visit');
          showToast(
            'Error',
            'Failed to end the visit. Please try again.',
            'error'
          );
        }
      },
    });
  }, [visitId, data, showConfirmModal]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading visit details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-gray-500">
        {error ?? 'Visit not found'}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-[#F5F5FA]">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Visit details</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Main content */}
        <div className="flex flex-col gap-4">
          <PatientInfoCard data={data} />
          <ChiefComplaintSection data={data} />

          <NavigableRow
            icon={iconVisitSummary}
            title="Visit summary"
            onClick={() =>
              navigate(generatePath(ROUTES.VISIT_SUMMARY, { visitId }), {
                state: { fromLabel, fromPath },
              })
            }
          />

          <NavigableRow
            icon={iconPrescription}
            title="Prescription"
            subtitle={
              data.prescriptionDate
                ? `Received ${data.prescriptionDate}`
                : undefined
            }
            onClick={() =>
              navigate(generatePath(ROUTES.PRESCRIPTION_DETAIL, { visitId }), {
                state: { fromLabel, fromPath },
              })
            }
          />

          <FollowUpSection data={data} onEndVisit={handleEndVisit} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <VisitStatusCard status={data.visitStatus} />
          <QuickActionsCard visitId={visitId as string} />
        </div>
      </div>
    </div>
  );
};

export default VisitDetails;
