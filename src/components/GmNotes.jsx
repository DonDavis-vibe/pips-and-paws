import { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';

const KEY = 'pips-paws-gm-notes';

// Allgemeine Sitzungs-/Kampagnennotizen des SL. Rein lokal, Teil der SL-Sitzung.
export default function GmNotes() {
  const { t } = useLang();
  const [text, setText] = useState(() => readJSON(KEY, '') || '');

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>
          <NotebookPen size={18} /> {t('gm.notes.title')}
        </h2>
      </div>
      <textarea
        className="notes"
        rows={6}
        placeholder={t('gm.notes.placeholder')}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          writeJSON(KEY, e.target.value);
        }}
      />
    </section>
  );
}
