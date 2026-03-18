import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import CustomToast from '../components/common/custom-toast.component';
import { fcmService } from '../services/fcm.service';
import notificationService from '../services/notification.service';
import profileService from '../modules/profile/profile.service';
import { storage } from '../utils/storage';

type NotificationPayload = Record<string, string | undefined>;
interface ProviderSearchResult {
  results?: { uuid: string }[];
}
interface ToggleResult {
  data?: { notification_status: boolean };
}
interface NotificationContextType {
  token: string;
  notifications: NotificationPayload[];
  unreadCount: number;
  isEnabled: boolean;
  requestPermission: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const TOAST_CONFIG = {
  prescription: {
    title: 'Prescription Ready',
    primaryLabel: 'Review Prescription',
    route: '#/prescriptions',
    borderColor: '#22c55e',
  },
  followup: {
    title: 'Follow-up Scheduled',
    primaryLabel: 'Start Consulation',
    route: '#/dashboard',
    borderColor: '#3b82f6',
  },
  appointment: {
    title: 'Appointment Update',
    primaryLabel: 'View Appointments',
    route: '#/my-appointments',
    borderColor: '#f59e0b',
  },
} as const;

const getUUID = () => JSON.parse(storage.getUser() || '{}')?.uuid;

const detectType = (data: NotificationPayload) => {
  if (data.type) return data.type;
  const title = (data.title || '').toLowerCase();
  if (title.includes('follow')) return 'followup';
  if (title.includes('appointment')) return 'appointment';
  return 'prescription';
};

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const lastPushId = useRef('');

  const registerToken = async (uuid: string, fcmToken: string) => {
    await notificationService.registerFCMToken(uuid, fcmToken);
    try {
      const prov = (await profileService.getProvider(
        uuid
      )) as ProviderSearchResult;
      const providerUuid = prov?.results?.[0]?.uuid;
      if (providerUuid && providerUuid !== uuid)
        await notificationService.registerFCMToken(providerUuid, fcmToken);
    } catch {
      /* silent */
    }
  };

  const requestPermission = useCallback(async () => {
    const fcmToken = await fcmService.requestPermission();
    const uuid = getUUID();
    console.warn(
      'requestPermission: token=',
      fcmToken ? fcmToken.slice(0, 20) + '...' : null,
      'uuid=',
      uuid
    );
    if (!fcmToken || !uuid) return;
    setToken(fcmToken);
    await registerToken(uuid, fcmToken);
    console.warn('registerToken done');
  }, []);

  const toggleNotifications = useCallback(async () => {
    const uuid = getUUID();
    if (!uuid) return;
    try {
      const res = (await notificationService.toggleNotificationStatus(
        uuid
      )) as ToggleResult;
      const enabled = !!res?.data?.notification_status;
      setIsEnabled(enabled);
      if (enabled) {
        await requestPermission();
      } else {
        await notificationService.clearFCMToken(uuid);
        setToken('');
      }
    } catch {
      /* silent */
    }
  }, [requestPermission]);

  const showToast = useCallback(
    (pushData: NotificationPayload & { data?: NotificationPayload }) => {
      const data = pushData?.data || pushData || {};
      const type = detectType(data);
      const config =
        TOAST_CONFIG[type as keyof typeof TOAST_CONFIG] ||
        TOAST_CONFIG.prescription;

      const patientName =
        [data.patientFirstName, data.patientMiddleName, data.patientLastName]
          .filter(Boolean)
          .join(' ') ||
        data.patientName ||
        '';
      const openMrsId =
        data.patientOpenMrsId || data.openMrsId || data.openMRSId || '';
      const doctorName = data.drName || data.doctorName || 'Doctor';

      let message = patientName;
      if (openMrsId) message += ` (${openMrsId})`;
      if (message) message += ' – ';
      message +=
        type === 'followup' ? 'Follow-up scheduled' : 'Prescription received';
      message += ` from ${doctorName}`;

      if (type === 'followup' && data.followupDatetime) {
        const raw = data.followupDatetime;
        const time = raw.match(/Time:\s*(.+)/i)?.[1]?.trim();
        const datePart = raw.split(',')[0]?.trim();
        let formattedDate = datePart || '';
        const d = new Date(datePart);
        if (!isNaN(d.getTime()))
          formattedDate = d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        if (formattedDate || time)
          message += `\n${formattedDate}${time ? `, ${time}` : ''}`;
      }

      const toastId = toast(
        <CustomToast
          title={config.title}
          message={message}
          secondaryLabel="Dismiss"
          primaryLabel={config.primaryLabel}
          onSecondary={() => toast.dismiss(toastId)}
          onPrimary={() => {
            toast.dismiss(toastId);
            window.location.hash = config.route;
          }}
        />,
        {
          autoClose: false,
          position: 'top-right',
          className: 'custom-notification-toast',
          style: {
            minHeight: '100px',
            marginRight: '80px',
            borderRadius: '12px',
            borderLeft: `4px solid ${config.borderColor}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
        }
      );
    },
    []
  );

  const handlePush = useCallback(
    (pushData?: NotificationPayload & { data?: NotificationPayload }) => {
      const pushId = JSON.stringify(pushData || '');
      if (pushId === lastPushId.current) return;
      lastPushId.current = pushId;
      setTimeout(() => (lastPushId.current = ''), 3000);
      if (pushData) showToast(pushData);
      setUnreadCount(prev => prev + 1);
    },
    [showToast]
  );

  useEffect(() => {
    const init = async () => {
      const initialized = await fcmService.initialize({
        onMessageReceived: payload => handlePush(payload?.data),
      });
      console.warn(
        'FCM init:',
        initialized,
        'permission:',
        typeof Notification !== 'undefined'
          ? Notification.permission
          : 'unsupported'
      );
      if (!initialized) return;
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission !== 'denied'
      )
        await requestPermission();
    };
    const swHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') handlePush(event.data.data);
    };
    navigator.serviceWorker?.addEventListener('message', swHandler);
    init();
    return () => {
      navigator.serviceWorker?.removeEventListener('message', swHandler);
    };
  }, [requestPermission, handlePush]);

  return (
    <NotificationContext.Provider
      value={{
        token,
        notifications: [],
        unreadCount,
        isEnabled,
        requestPermission,
        toggleNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      'useNotificationContext must be used inside NotificationProvider'
    );
  return context;
};
