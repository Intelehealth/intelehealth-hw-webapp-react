const BASE = import.meta.env.VITE_WEBRTC_API_URL as string | undefined;

export interface RedeemedCall {
  roomId: string;
  token: string;
  visitUuid: string;
  doctorName?: string;
  patientName?: string;
}

export interface RoomStatus {
  success: boolean;
  room: string;
  participantCount: number;
  doctorPresent: boolean;
}

export const magicLinkService = {
  async redeem(magicToken: string): Promise<RedeemedCall> {
    if (!BASE) throw new Error('Call service is not configured.');
    const res = await fetch(
      `${BASE}/magic-link/redeem?m=${encodeURIComponent(magicToken)}`
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'This call link is invalid or expired.');
    }
    return data as RedeemedCall;
  },

  async roomStatus(roomId: string): Promise<RoomStatus> {
    if (!BASE) throw new Error('Call service is not configured.');
    const res = await fetch(
      `${BASE}/magic-link/room-status?room=${encodeURIComponent(roomId)}`
    );
    const data = await res.json().catch(() => ({}));
    return {
      success: !!data?.success,
      room: roomId,
      participantCount: Number(data?.participantCount) || 0,
      doctorPresent: !!data?.doctorPresent,
    };
  },
};
