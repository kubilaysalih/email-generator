import React from 'react';
import { SessionInfoProps } from '../types';

const SessionInfo: React.FC<SessionInfoProps> = ({
  sessionId,
  isLoading,
  onResetSession
}) => {
  if (!sessionId) return null;

  return (
    <div className="session-container">
      <div className="session-info">
        <div className="session-badge">Devam Eden Sohbet</div>
        <button
          onClick={onResetSession}
          className="reset-session-btn"
          disabled={isLoading}
        >
          Yeni Sohbet Başlat
        </button>
      </div>
    </div>
  );
};

export default SessionInfo;