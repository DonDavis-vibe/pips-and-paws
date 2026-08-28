import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';

export default function ConnectionBadge({ mp, onOpen }) {
  const { t } = useLang();
  if (!mp.role) {
    return (
      <button type="button" className="btn btn-ghost" onClick={onOpen}>
        <Radio size={16} /> {t('mp.title')}
      </button>
    );
  }

  const state = mp.connectionState;
  const cls = state === 'connected' ? 'ok' : state === 'connecting' ? 'warn' : 'bad';
  const Icon = state === 'connected' ? Wifi : WifiOff;
  const label =
    mp.role === 'gm'
      ? `${t('mp.badge.gm')} · ${mp.roomCode}`
      : state === 'connected'
        ? `${t('mp.badge.player')} · ${mp.roomCode}`
        : t(`mp.state.${state}`);

  return (
    <button type="button" className={`conn-badge conn-${cls}`} onClick={onOpen}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}
