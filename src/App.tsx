import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

// ============ TYPES ============
type Screen = 'storage' | 'chats' | 'search' | 'settings' | 'profile';
type AuthStep = 'login' | 'register' | '2fa';
type FileItem = { id: string; name: string; type: string; size: string; date: string; folder: string };
type FolderItem = { id: string; name: string; count: number };
type User = { id: string; login: string; password: string; securityQuestion: string; securityAnswer: string; joinDate: string };
type ChatUser = { id: string; login: string; online: boolean };
type Message = { id: string; from: string; text: string; time: string };

// ============ MOCK DATA ============
const MOCK_FILES: FileItem[] = [
  { id: 'f1', name: 'neural_map_v3.enc', type: 'doc', size: '2.4 MB', date: '2077.03.15', folder: 'root' },
  { id: 'f2', name: 'ghost_protocol.mp4', type: 'video', size: '847 MB', date: '2077.03.14', folder: 'root' },
  { id: 'f3', name: 'implant_schema.jpg', type: 'image', size: '12.1 MB', date: '2077.03.12', folder: 'root' },
  { id: 'f4', name: 'encrypted_keys.bin', type: 'bin', size: '0.5 KB', date: '2077.03.10', folder: 'secure' },
  { id: 'f5', name: 'netrunner_guide.pdf', type: 'pdf', size: '18.3 MB', date: '2077.03.08', folder: 'docs' },
  { id: 'f6', name: 'synth_track_01.mp3', type: 'audio', size: '9.7 MB', date: '2077.03.07', folder: 'media' },
];
const MOCK_FOLDERS: FolderItem[] = [
  { id: 'fld1', name: 'secure', count: 1 },
  { id: 'fld2', name: 'docs', count: 1 },
  { id: 'fld3', name: 'media', count: 1 },
];
const MOCK_USERS: ChatUser[] = [
  { id: 'u1', login: 'ghost_runner', online: true },
  { id: 'u2', login: 'neon_witch', online: false },
  { id: 'u3', login: 'cyberdog99', online: true },
];
const INIT_MESSAGES: Record<string, Message[]> = {
  u1: [
    { id: 'm1', from: 'ghost_runner', text: 'Пинг. Ты онлайн?', time: '22:14' },
    { id: 'm2', from: 'me', text: 'Всегда. Что нужно?', time: '22:15' },
  ],
  u2: [{ id: 'm4', from: 'neon_witch', text: 'Привет, нужна помощь.', time: '20:00' }],
  u3: [],
};
const SECURITY_QUESTIONS = [
  'Имя первого домашнего животного?',
  'Город, где вы родились?',
  'Девичья фамилия матери?',
  'Любимая книга в детстве?',
  'Кодовое слово из юности?',
];
const DATA_STREAM = '01001110 01000101 01011000 01010101 01010011 00100000 01010110 01000001 01010101 01001100 01010100';

function getFileIcon(type: string) {
  const map: Record<string, string> = { image: 'Image', video: 'Video', audio: 'Music', pdf: 'FileText', bin: 'Lock' };
  return map[type] || 'File';
}

// ============ BG EFFECTS ============
function DataStreamBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[5, 15, 30, 50, 70, 85, 95].map((left, i) => (
        <div key={i} className="data-stream-col" style={{ left: `${left}%`, animationDelay: `${i * 1.1}s`, animationDuration: `${7 + i * 1.5}s` }}>
          {DATA_STREAM}
        </div>
      ))}
    </div>
  );
}

// ============ AUTH ============
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [step, setStep] = useState<AuthStep>('login');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [secQ, setSecQ] = useState(SECURITY_QUESTIONS[0]);
  const [secA, setSecA] = useState('');
  const [answer2fa, setAnswer2fa] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    { id: 'demo1', login: 'demo', password: 'demo123', securityQuestion: 'Кодовое слово из юности?', securityAnswer: 'nexus', joinDate: '2077.01.01' }
  ]);

  const handleAuth = () => {
    setError('');
    if (mode === 'login') {
      const user = users.find(u => u.login === login && u.password === password);
      if (!user) { setError('ОШИБКА: неверный логин или пароль'); return; }
      setPendingUser(user); setStep('2fa');
    } else {
      if (!login || !password || !secA) { setError('ОШИБКА: заполните все поля'); return; }
      if (password !== confirmPwd) { setError('ОШИБКА: пароли не совпадают'); return; }
      if (users.find(u => u.login === login)) { setError('ОШИБКА: логин занят'); return; }
      if (password.length < 6) { setError('ОШИБКА: пароль минимум 6 символов'); return; }
      const newUser: User = { id: Date.now().toString(), login, password, securityQuestion: secQ, securityAnswer: secA.toLowerCase(), joinDate: new Date().toLocaleDateString('ru') };
      setUsers(prev => [...prev, newUser]);
      setPendingUser(newUser); setStep('2fa');
    }
  };

  const handle2fa = () => {
    if (!pendingUser) return;
    if (answer2fa.toLowerCase().trim() !== pendingUser.securityAnswer) { setError('ОШИБКА: неверный ответ'); return; }
    onLogin(pendingUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid relative">
      <DataStreamBg />
      <div className="scanline" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-10">
          <div className="font-orbitron text-4xl font-black neon-text-purple animate-neon-pulse mb-2">NEXUS VAULT</div>
          <div className="font-mono-tech text-xs neon-text-cyan opacity-70 tracking-widest">SECURE CLOUD SYSTEM v2.077</div>
          <div className="flex justify-center gap-2 mt-3">
            {['AES-256', 'E2E ENCRYPTED', '2FA'].map(b => (
              <span key={b} className="hex-badge border-neon-purple text-neon-purple">{b}</span>
            ))}
          </div>
        </div>

        {step === '2fa' ? (
          <div className="cyber-card cyber-corner p-8 animate-scale-in">
            <div className="font-orbitron text-xs neon-text-cyan mb-4 flex items-center gap-2"><Icon name="Shield" size={14} />ДВУХФАКТОРНАЯ АУТЕНТИФИКАЦИЯ</div>
            <div className="text-xs font-mono-tech text-neon-green opacity-80 mb-1">КОНТРОЛЬНЫЙ ВОПРОС:</div>
            <div className="font-rajdhani text-neon-cyan mb-4">{pendingUser?.securityQuestion}</div>
            <input className="cyber-input mb-3" placeholder="Ваш ответ..." value={answer2fa} onChange={e => setAnswer2fa(e.target.value)} type="password" onKeyDown={e => e.key === 'Enter' && handle2fa()} />
            {error && <div className="text-red-500 font-mono-tech text-xs mb-3">{error}</div>}
            <button className="cyber-btn w-full mb-3" onClick={handle2fa}>ПОДТВЕРДИТЬ</button>
            <button className="text-xs font-mono-tech text-muted-foreground w-full text-center hover:text-neon-cyan transition-colors" onClick={() => { setStep('login'); setError(''); }}>← НАЗАД</button>
          </div>
        ) : (
          <div className="cyber-card cyber-corner p-8 animate-scale-in">
            <div className="flex mb-6">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }} className={`flex-1 py-2 font-orbitron text-xs tracking-widest transition-all ${mode === m ? 'neon-text-purple border-b-2 border-neon-purple' : 'text-muted-foreground border-b border-border hover:text-neon-cyan'}`}>
                  {m === 'login' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">// ЛОГИН</label>
                <input className="cyber-input" placeholder="username" value={login} onChange={e => setLogin(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">// ПАРОЛЬ</label>
                <input className="cyber-input" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {mode === 'register' && <>
                <div>
                  <label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">// ПОДТВЕРДИТЬ ПАРОЛЬ</label>
                  <input className="cyber-input" placeholder="••••••••" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">// КОНТРОЛЬНЫЙ ВОПРОС (2FA)</label>
                  <select className="cyber-input" value={secQ} onChange={e => setSecQ(e.target.value)}>
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q} className="bg-dark-card text-neon-cyan">{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">// ОТВЕТ НА ВОПРОС</label>
                  <input className="cyber-input" placeholder="Ваш секретный ответ..." value={secA} onChange={e => setSecA(e.target.value)} />
                </div>
              </>}
            </div>
            {error && <div className="text-red-500 font-mono-tech text-xs mt-3">{error}</div>}
            <button className="cyber-btn w-full mt-6" onClick={handleAuth}>{mode === 'login' ? 'ВОЙТИ В СИСТЕМУ' : 'СОЗДАТЬ АККАУНТ'}</button>
          </div>
        )}
        <div className="text-center mt-6 font-mono-tech text-xs opacity-30 neon-text-cyan">STORAGE: 2.0 TB · AES-256 · ANONYMOUS</div>
      </div>
    </div>
  );
}

// ============ STORAGE ============
function StorageScreen({ user }: { user: User }) {
  const [currentFolder, setCurrentFolder] = useState('root');
  const [folders, setFolders] = useState<FolderItem[]>(MOCK_FOLDERS);
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFile, setRenameFile] = useState<FileItem | null>(null);
  const [renameName, setRenameName] = useState('');
  const [showPreview, setShowPreview] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file: FileItem; x: number; y: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usedPct = 41;
  const folderFiles = currentFolder === 'root'
    ? files.filter(f => f.folder === 'root' || !folders.find(fld => fld.name === f.folder))
    : files.filter(f => f.folder === currentFolder);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      const ext = file.name.split('.').pop() || '';
      const type = ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : ['mp4','webm'].includes(ext) ? 'video' : ['mp3','wav'].includes(ext) ? 'audio' : ext === 'pdf' ? 'pdf' : 'doc';
      setFiles(prev => [...prev, { id: Date.now().toString(), name: file.name, type, size: `${(file.size/1024/1024).toFixed(1)} MB`, date: new Date().toLocaleDateString('ru'), folder: currentFolder }]);
      setUploading(false);
    }, 1500);
    e.target.value = '';
  };

  const handleDelete = (fileId: string) => { setFiles(prev => prev.filter(f => f.id !== fileId)); setContextMenu(null); setSelectedFile(null); };
  const handleCopy = (file: FileItem) => { setFiles(prev => [...prev, { ...file, id: Date.now().toString(), name: `copy_${file.name}` }]); setContextMenu(null); };
  const handleRename = () => {
    if (!renameFile || !renameName.trim()) return;
    setFiles(prev => prev.map(f => f.id === renameFile.id ? { ...f, name: renameName } : f));
    setRenameFile(null); setRenameName(''); setContextMenu(null);
  };
  const handleNewFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, { id: Date.now().toString(), name: newFolderName.toLowerCase().replace(/\s+/g,'_'), count: 0 }]);
    setNewFolderName(''); setShowNewFolder(false);
  };
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    setFiles(prev => prev.filter(f => f.folder !== folder.name));
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (currentFolder === folder.name) setCurrentFolder('root');
  };
  const handleDownload = (file: FileItem) => {
    const blob = new Blob([`NEXUS VAULT\n${file.name}\nSize: ${file.size}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
    setContextMenu(null);
  };

  return (
    <div className="h-full flex flex-col" onClick={() => setContextMenu(null)}>
      <div className="cyber-card p-4 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="font-orbitron text-xs neon-text-purple flex items-center gap-2"><Icon name="Database" size={12} />NEXUS STORAGE</div>
          <div className="font-mono-tech text-xs neon-text-green">{usedPct}% ЗАНЯТО</div>
        </div>
        <div className="cyber-progress"><div className="cyber-progress-fill" style={{ width: `${usedPct}%` }} /></div>
        <div className="flex justify-between mt-1">
          <span className="font-mono-tech text-xs text-muted-foreground">838 GB</span>
          <span className="font-mono-tech text-xs text-muted-foreground">2.0 TB</span>
        </div>
      </div>

      <div className="flex gap-2 mb-2 flex-wrap flex-shrink-0">
        <button onClick={() => setCurrentFolder('root')} className={`cyber-btn text-xs py-1.5 px-3 ${currentFolder === 'root' ? '' : 'cyber-btn-cyan'}`}>
          <Icon name="Home" size={10} className="inline mr-1" />ROOT
        </button>
        {folders.map(fld => (
          <div key={fld.id} className="flex items-center">
            <button onClick={() => setCurrentFolder(fld.name)} className={`cyber-btn text-xs py-1.5 px-3 ${currentFolder === fld.name ? '' : 'cyber-btn-cyan'}`}>
              <Icon name="Folder" size={10} className="inline mr-1" />{fld.name.toUpperCase()}
            </button>
            <button onClick={() => handleDeleteFolder(fld.id)} className="text-red-500 hover:text-red-300 px-1.5 text-xs">×</button>
          </div>
        ))}
        <button onClick={() => setShowNewFolder(true)} className="cyber-btn cyber-btn-green text-xs py-1.5 px-3"><Icon name="Plus" size={10} className="inline mr-1" />ПАПКА</button>
      </div>

      {showNewFolder && (
        <div className="flex gap-2 mb-2 animate-fade-in flex-shrink-0">
          <input className="cyber-input text-xs py-1.5 flex-1" placeholder="Имя папки..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNewFolder()} />
          <button className="cyber-btn cyber-btn-green text-xs py-1.5 px-3" onClick={handleNewFolder}>ОК</button>
          <button className="cyber-btn cyber-btn-red text-xs py-1.5 px-2" onClick={() => setShowNewFolder(false)}>✕</button>
        </div>
      )}

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        <button className="cyber-btn cyber-btn-cyan text-xs py-2 flex-1" onClick={() => fileInputRef.current?.click()}>
          {uploading ? <><Icon name="Loader" size={10} className="inline mr-1 animate-spin" />ЗАГРУЗКА...</> : <><Icon name="Upload" size={10} className="inline mr-1" />ЗАГРУЗИТЬ ФАЙЛ</>}
        </button>
      </div>

      <div className="cyber-card flex-1 overflow-y-auto min-h-0">
        {folderFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Icon name="FolderOpen" size={32} className="mb-2 opacity-30" />
            <span className="font-mono-tech text-xs opacity-40">ПАПКА ПУСТА</span>
          </div>
        ) : folderFiles.map(file => (
          <div key={file.id}
            className={`file-item ${selectedFile?.id === file.id ? 'bg-purple-900/20' : ''}`}
            onClick={e => { e.stopPropagation(); setSelectedFile(file); }}
            onContextMenu={e => { e.preventDefault(); setContextMenu({ file, x: e.clientX, y: e.clientY }); }}
            onDoubleClick={() => setShowPreview(file)}
          >
            <div className="text-neon-purple opacity-70"><Icon name={getFileIcon(file.type)} size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="font-rajdhani text-sm text-neon-cyan truncate">{file.name}</div>
              <div className="font-mono-tech text-xs text-muted-foreground">{file.size} · {file.date}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={e => { e.stopPropagation(); setShowPreview(file); }} className="text-neon-cyan opacity-50 hover:opacity-100 p-1"><Icon name="Eye" size={14} /></button>
              <button onClick={e => { e.stopPropagation(); handleDownload(file); }} className="text-neon-green opacity-50 hover:opacity-100 p-1"><Icon name="Download" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div className="fixed z-50 cyber-card w-44 py-1 animate-scale-in" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          {[
            { label: 'Открыть', icon: 'Eye', fn: () => { setShowPreview(contextMenu.file); setContextMenu(null); } },
            { label: 'Скачать', icon: 'Download', fn: () => handleDownload(contextMenu.file) },
            { label: 'Переименовать', icon: 'Edit', fn: () => { setRenameFile(contextMenu.file); setRenameName(contextMenu.file.name); setContextMenu(null); } },
            { label: 'Копировать', icon: 'Copy', fn: () => handleCopy(contextMenu.file) },
            { label: 'Удалить', icon: 'Trash2', fn: () => handleDelete(contextMenu.file.id) },
          ].map(item => (
            <button key={item.label} onClick={item.fn} className={`w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 transition-colors ${item.label === 'Удалить' ? 'text-red-400' : 'text-neon-cyan'}`}>
              <Icon name={item.icon} size={12} />{item.label}
            </button>
          ))}
        </div>
      )}

      {renameFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="cyber-modal rounded p-6 w-80 animate-scale-in">
            <div className="font-orbitron text-xs neon-text-cyan mb-4">ПЕРЕИМЕНОВАТЬ</div>
            <input className="cyber-input mb-4" value={renameName} onChange={e => setRenameName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} />
            <div className="flex gap-2">
              <button className="cyber-btn cyber-btn-cyan flex-1 text-xs" onClick={handleRename}>СОХРАНИТЬ</button>
              <button className="cyber-btn cyber-btn-red flex-1 text-xs" onClick={() => setRenameFile(null)}>ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowPreview(null)}>
          <div className="cyber-modal rounded p-6 w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-orbitron text-xs neon-text-cyan truncate flex-1">{showPreview.name}</div>
              <button onClick={() => setShowPreview(null)} className="text-muted-foreground hover:text-neon-pink ml-2"><Icon name="X" size={16} /></button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-32 border border-neon-purple/30 rounded p-8 mb-4">
              <Icon name={getFileIcon(showPreview.type)} size={48} className="text-neon-purple opacity-60 mb-3" />
              <div className="font-mono-tech text-xs text-muted-foreground">{showPreview.size}</div>
              <div className="font-mono-tech text-xs neon-text-green mt-1">ENCRYPTED · {showPreview.date}</div>
              {showPreview.type === 'audio' && (
                <div className="mt-4 text-center">
                  <div className="font-mono-tech text-xs text-neon-cyan mb-2">♪ АУДИО ФАЙЛ</div>
                  <button className="cyber-btn cyber-btn-cyan text-xs py-1 px-3"><Icon name="Play" size={10} className="inline mr-1" />ВОСПРОИЗВЕСТИ</button>
                </div>
              )}
              {showPreview.type === 'video' && (
                <div className="mt-4 text-center">
                  <div className="font-mono-tech text-xs text-neon-cyan mb-2">▶ ВИДЕО ФАЙЛ</div>
                  <button className="cyber-btn cyber-btn-cyan text-xs py-1 px-3"><Icon name="Play" size={10} className="inline mr-1" />ВОСПРОИЗВЕСТИ</button>
                </div>
              )}
            </div>
            <button className="cyber-btn cyber-btn-green w-full text-xs" onClick={() => handleDownload(showPreview)}>
              <Icon name="Download" size={10} className="inline mr-1" />СКАЧАТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CHATS ============
function ChatsScreen({ user, onNewMessage }: { user: User; onNewMessage?: () => void }) {
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [contacts, setContacts] = useState<ChatUser[]>(MOCK_USERS);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [userMenu, setUserMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'block' | 'unblock'; userId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat, messages]);
  useEffect(() => {
    const close = () => setUserMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const sendMessage = (msg: string) => {
    if (!activeChat || !msg.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), from: 'me', text: msg, time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id] || []), newMsg] }));
    setText('');
    setTimeout(() => {
      const reply: Message = { id: Date.now().toString()+'r', from: activeChat.login, text: '[ E2E зашифровано · Доставлено ]', time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id] || []), reply] }));
      onNewMessage?.();
    }, 1200);
  };

  const handleDeleteChat = (userId: string) => {
    setMessages(prev => ({ ...prev, [userId]: [] }));
    if (activeChat?.id === userId) setActiveChat(null);
    setConfirmAction(null);
  };

  const handleBlockUser = (userId: string) => {
    setBlockedIds(prev => [...prev, userId]);
    if (activeChat?.id === userId) setActiveChat(null);
    setConfirmAction(null);
  };

  const handleUnblockUser = (userId: string) => {
    setBlockedIds(prev => prev.filter(id => id !== userId));
    setConfirmAction(null);
  };

  const isBlocked = (userId: string) => blockedIds.includes(userId);

  return (
    <div className="h-full flex gap-3" onClick={() => setUserMenu(null)}>
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-48 flex-shrink-0`}>
        <div className="font-orbitron text-xs neon-text-purple mb-3 flex items-center gap-2 flex-shrink-0">
          <Icon name="MessageSquare" size={12} />КОНТАКТЫ
        </div>
        <div className="cyber-card flex-1 overflow-y-auto">
          {contacts.map(u => (
            <div key={u.id} className={`relative flex items-center gap-3 p-3 border-b border-border transition-all ${activeChat?.id === u.id ? 'bg-purple-900/30' : 'hover:bg-purple-900/20'} ${isBlocked(u.id) ? 'opacity-40' : ''}`}>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => !isBlocked(u.id) && setActiveChat(u)}>
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-sm bg-dark-panel neon-border-purple flex items-center justify-center font-orbitron text-xs text-neon-purple">{u.login[0].toUpperCase()}</div>
                  {u.online && !isBlocked(u.id) && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="min-w-0">
                  <div className="font-rajdhani text-sm text-neon-cyan truncate">{u.login}</div>
                  <div className="font-mono-tech text-xs text-muted-foreground">{isBlocked(u.id) ? 'ЗАБЛОКИРОВАН' : u.online ? 'ONLINE' : 'OFFLINE'}</div>
                </div>
              </button>
              <button
                className="flex-shrink-0 text-muted-foreground hover:text-neon-cyan p-1 transition-colors"
                onClick={e => { e.stopPropagation(); setUserMenu(userMenu === u.id ? null : u.id); }}
              >
                <Icon name="MoreVertical" size={14} />
              </button>
              {userMenu === u.id && (
                <div className="absolute right-0 top-10 z-50 cyber-card w-44 py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setConfirmAction({ type: 'delete', userId: u.id }); setUserMenu(null); }} className="w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 transition-colors text-neon-cyan">
                    <Icon name="Trash2" size={12} className="text-red-400" />Удалить чат
                  </button>
                  {isBlocked(u.id) ? (
                    <button onClick={() => { setConfirmAction({ type: 'unblock', userId: u.id }); setUserMenu(null); }} className="w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 transition-colors neon-text-green">
                      <Icon name="UserCheck" size={12} />Разблокировать
                    </button>
                  ) : (
                    <button onClick={() => { setConfirmAction({ type: 'block', userId: u.id }); setUserMenu(null); }} className="w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 transition-colors text-red-400">
                      <Icon name="UserX" size={12} />Заблокировать
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={() => setConfirmAction(null)}>
          <div className="cyber-modal rounded p-6 w-72 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className={`font-orbitron text-xs mb-3 flex items-center gap-2 ${confirmAction.type === 'unblock' ? 'neon-text-green' : 'text-red-400'}`}>
              <Icon name={confirmAction.type === 'delete' ? 'Trash2' : confirmAction.type === 'block' ? 'UserX' : 'UserCheck'} size={14} />
              {confirmAction.type === 'delete' ? 'УДАЛИТЬ ЧАТ' : confirmAction.type === 'block' ? 'ЗАБЛОКИРОВАТЬ' : 'РАЗБЛОКИРОВАТЬ'}
            </div>
            <div className="font-mono-tech text-xs text-muted-foreground mb-5">
              {confirmAction.type === 'delete' && 'Вся история переписки будет удалена безвозвратно.'}
              {confirmAction.type === 'block' && 'Пользователь не сможет отправлять вам сообщения.'}
              {confirmAction.type === 'unblock' && 'Пользователь снова сможет писать вам.'}
            </div>
            <div className="flex gap-2">
              <button
                className={`cyber-btn flex-1 text-xs ${confirmAction.type === 'unblock' ? 'cyber-btn-green' : 'cyber-btn-red'}`}
                onClick={() => {
                  if (confirmAction.type === 'delete') handleDeleteChat(confirmAction.userId);
                  else if (confirmAction.type === 'block') handleBlockUser(confirmAction.userId);
                  else handleUnblockUser(confirmAction.userId);
                }}
              >
                ПОДТВЕРДИТЬ
              </button>
              <button className="cyber-btn cyber-btn-cyan flex-1 text-xs" onClick={() => setConfirmAction(null)}>ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}

      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0 animate-slide-in-right">
          <div className="cyber-card p-3 flex items-center gap-3 mb-3 flex-shrink-0">
            <button className="md:hidden text-neon-cyan" onClick={() => setActiveChat(null)}><Icon name="ArrowLeft" size={16} /></button>
            <div className="w-8 h-8 rounded-sm bg-dark-panel neon-border-purple flex items-center justify-center font-orbitron text-xs text-neon-purple">{activeChat.login[0].toUpperCase()}</div>
            <div>
              <div className="font-rajdhani text-sm text-neon-cyan">{activeChat.login}</div>
              <div className={`font-mono-tech text-xs ${activeChat.online ? 'neon-text-green' : 'text-muted-foreground'}`}>{activeChat.online ? '● ONLINE' : '○ OFFLINE'}</div>
            </div>
            <span className="hex-badge border-neon-green text-neon-green ml-auto text-xs">E2E</span>
            <div className="relative ml-2">
              <button
                className="text-muted-foreground hover:text-neon-cyan p-1 transition-colors"
                onClick={e => { e.stopPropagation(); setUserMenu(userMenu === activeChat.id + '_header' ? null : activeChat.id + '_header'); }}
              >
                <Icon name="MoreVertical" size={16} />
              </button>
              {userMenu === activeChat.id + '_header' && (
                <div className="absolute right-0 top-8 z-50 cyber-card w-44 py-1 animate-scale-in" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setConfirmAction({ type: 'delete', userId: activeChat.id }); setUserMenu(null); }} className="w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 text-neon-cyan">
                    <Icon name="Trash2" size={12} className="text-red-400" />Удалить чат
                  </button>
                  <button onClick={() => { setConfirmAction({ type: 'block', userId: activeChat.id }); setUserMenu(null); }} className="w-full text-left px-3 py-2 font-rajdhani text-sm flex items-center gap-2 hover:bg-purple-900/30 text-red-400">
                    <Icon name="UserX" size={12} />Заблокировать
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="cyber-card flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
            {(messages[activeChat.id] || []).length === 0 && (
              <div className="flex-1 flex items-center justify-center font-mono-tech text-xs opacity-30">НАЧНИТЕ ПЕРЕПИСКУ</div>
            )}
            {(messages[activeChat.id] || []).map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={msg.from === 'me' ? 'chat-bubble-out' : 'chat-bubble-in'}>
                  <div className="font-rajdhani text-sm text-neon-cyan">{msg.text}</div>
                  <div className="font-mono-tech text-xs text-muted-foreground mt-1 text-right">{msg.time}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showAttach && (
            <div className="cyber-card p-3 mb-2 animate-fade-in flex-shrink-0">
              <div className="font-orbitron text-xs neon-text-cyan mb-2">ФАЙЛЫ ИЗ ХРАНИЛИЩА:</div>
              <div className="flex flex-wrap gap-1">
                {MOCK_FILES.map(f => (
                  <button key={f.id} onClick={() => { sendMessage(`📎 ${f.name}`); setShowAttach(false); }} className="cyber-btn cyber-btn-cyan text-xs py-1 px-2">
                    <Icon name={getFileIcon(f.type)} size={10} className="inline mr-1" />{f.name.substring(0,12)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowAttach(!showAttach)} className="cyber-btn cyber-btn-cyan text-xs py-2 px-3"><Icon name="Paperclip" size={14} /></button>
            <input className="cyber-input flex-1 text-sm py-2" placeholder="СООБЩЕНИЕ..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(text)} />
            <button className="cyber-btn text-xs py-2 px-4" onClick={() => sendMessage(text)}><Icon name="Send" size={14} /></button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3 text-muted-foreground">
          <Icon name="MessageSquare" size={48} className="opacity-20" />
          <span className="font-mono-tech text-xs opacity-40">ВЫБЕРИТЕ КОНТАКТ</span>
        </div>
      )}
    </div>
  );
}

// ============ SEARCH ============
function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searched, setSearched] = useState(false);
  const ALL_USERS: User[] = [
    { id: 'demo1', login: 'demo', password: '***', securityQuestion: '', securityAnswer: '', joinDate: '2077.01.01' },
    { id: 'u1001', login: 'ghost_runner', password: '***', securityQuestion: '', securityAnswer: '', joinDate: '2077.02.14' },
    { id: 'u1002', login: 'neon_witch', password: '***', securityQuestion: '', securityAnswer: '', joinDate: '2077.03.01' },
    { id: 'u1003', login: 'cyberdog99', password: '***', securityQuestion: '', securityAnswer: '', joinDate: '2077.01.25' },
    { id: 'u1004', login: 'data_phantom', password: '***', securityQuestion: '', securityAnswer: '', joinDate: '2077.02.28' },
  ];
  const handleSearch = () => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    setResults(ALL_USERS.filter(u => u.login.includes(q) || u.id.includes(q)));
    setSearched(true);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="font-orbitron text-sm neon-text-purple mb-4 flex items-center gap-2 flex-shrink-0">
        <Icon name="Search" size={14} />ПОИСК ПОЛЬЗОВАТЕЛЕЙ
      </div>
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <input className="cyber-input flex-1" placeholder="Логин или ID..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="cyber-btn text-xs px-4" onClick={handleSearch}><Icon name="Search" size={14} /></button>
      </div>
      {!searched && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Icon name="Users" size={48} className="opacity-20 mb-3" />
          <span className="font-mono-tech text-xs opacity-40">БАЗА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ</span>
        </div>
      )}
      {searched && results.length === 0 && (
        <div className="cyber-card p-6 text-center"><Icon name="UserX" size={32} className="text-red-500 opacity-50 mx-auto mb-2" /><div className="font-mono-tech text-xs text-muted-foreground">НЕ НАЙДЕНО</div></div>
      )}
      <div className="space-y-2 overflow-y-auto flex-1">
        {results.map(user => (
          <div key={user.id} className="cyber-card cyber-corner p-4 animate-fade-in flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-dark-panel neon-border-purple flex items-center justify-center font-orbitron text-sm text-neon-purple">{user.login[0].toUpperCase()}</div>
            <div className="flex-1">
              <div className="font-rajdhani text-base text-neon-cyan">{user.login}</div>
              <div className="font-mono-tech text-xs text-muted-foreground">ID: {user.id} · С {user.joinDate}</div>
            </div>
            <button className="cyber-btn cyber-btn-cyan text-xs py-1 px-3"><Icon name="MessageSquare" size={10} className="inline mr-1" />НАПИСАТЬ</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function SettingsScreen({ user, onLogout, onDeleteAccount, onChangePassword }: {
  user: User; onLogout: () => void; onDeleteAccount: () => void; onChangePassword: (p: string) => void;
}) {
  const [section, setSection] = useState<'main'|'password'|'logout'|'delete'|'privacy'>('main');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePwd = () => {
    setError(''); setSuccess('');
    if (oldPwd !== user.password) { setError('Неверный текущий пароль'); return; }
    if (newPwd !== newPwd2) { setError('Пароли не совпадают'); return; }
    if (newPwd.length < 6) { setError('Минимум 6 символов'); return; }
    onChangePassword(newPwd); setSuccess('Пароль изменён ✓'); setOldPwd(''); setNewPwd(''); setNewPwd2('');
  };

  const MENU = [
    { id: 'password', label: 'Сменить пароль', icon: 'Key', color: 'text-neon-cyan' },
    { id: 'privacy', label: 'Конфиденциальность', icon: 'Shield', color: 'neon-text-green' },
    { id: 'logout', label: 'Выйти из аккаунта', icon: 'LogOut', color: 'text-neon-cyan' },
    { id: 'delete', label: 'Удалить аккаунт', icon: 'Trash2', color: 'text-red-400' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="font-orbitron text-sm neon-text-purple mb-4 flex items-center gap-2"><Icon name="Settings" size={14} />НАСТРОЙКИ</div>
      {section === 'main' && (
        <div className="space-y-2 animate-fade-in">
          {MENU.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id as 'main'|'password'|'logout'|'delete'|'privacy'); setError(''); setSuccess(''); setConfirmPwd(''); }} className="w-full cyber-card p-4 flex items-center gap-3 hover:border-neon-purple/60 transition-all text-left">
              <Icon name={item.icon} size={18} className={item.color} />
              <span className={`font-rajdhani text-base ${item.color}`}>{item.label}</span>
              <Icon name="ChevronRight" size={14} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      {section === 'password' && (
        <div className="cyber-card p-6 animate-scale-in">
          <button onClick={() => { setSection('main'); setError(''); setSuccess(''); }} className="font-mono-tech text-xs text-muted-foreground hover:text-neon-cyan mb-4 flex items-center gap-1"><Icon name="ArrowLeft" size={12} />НАЗАД</button>
          <div className="font-orbitron text-xs neon-text-cyan mb-4">СМЕНА ПАРОЛЯ</div>
          <div className="space-y-3">
            {([['// ТЕКУЩИЙ ПАРОЛЬ', oldPwd, setOldPwd], ['// НОВЫЙ ПАРОЛЬ', newPwd, setNewPwd], ['// ПОДТВЕРДИТЬ НОВЫЙ', newPwd2, setNewPwd2]] as [string, string, React.Dispatch<React.SetStateAction<string>>][]).map(([label, val, set]) => (
              <div key={label}><label className="text-xs font-mono-tech text-neon-green opacity-70 block mb-1">{label}</label><input className="cyber-input" type="password" placeholder="••••••••" value={val} onChange={e => set(e.target.value)} /></div>
            ))}
          </div>
          {error && <div className="text-red-500 font-mono-tech text-xs mt-2">{error}</div>}
          {success && <div className="neon-text-green font-mono-tech text-xs mt-2">{success}</div>}
          <button className="cyber-btn cyber-btn-cyan w-full mt-4 text-xs" onClick={handleChangePwd}>СОХРАНИТЬ</button>
        </div>
      )}
      {section === 'privacy' && (
        <div className="cyber-card p-6 animate-scale-in">
          <button onClick={() => setSection('main')} className="font-mono-tech text-xs text-muted-foreground hover:text-neon-cyan mb-4 flex items-center gap-1"><Icon name="ArrowLeft" size={12} />НАЗАД</button>
          <div className="font-orbitron text-xs neon-text-cyan mb-4">КОНФИДЕНЦИАЛЬНОСТЬ</div>
          <div className="space-y-3">
            {[
              { label: 'Скрытие IP-адреса', desc: 'Ваш реальный IP скрыт через цепочку прокси-серверов. Сторонние сервисы видят только выходной узел.', icon: 'EyeOff' },
              { label: 'Шифрование трафика', desc: 'Весь исходящий трафик зашифрован (AES-256). Сотовый оператор видит только зашифрованный поток данных.', icon: 'Lock' },
              { label: 'Сквозное шифрование файлов', desc: 'Файлы шифруются до загрузки на сервер. Серверы не имеют доступа к содержимому.', icon: 'Shield' },
              { label: 'Анонимизация метаданных', desc: 'Метаданные файлов (устройство, дата, геолокация) удаляются при загрузке.', icon: 'Fingerprint' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 border border-neon-green/20 rounded bg-neon-green/5">
                <Icon name={item.icon} size={16} className="neon-text-green mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-rajdhani text-sm text-neon-cyan font-semibold">{item.label}</div>
                  <div className="font-mono-tech text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</div>
                  <span className="hex-badge border-neon-green text-neon-green mt-1.5 inline-block">АКТИВНО</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {section === 'logout' && (
        <div className="cyber-card p-6 animate-scale-in">
          <button onClick={() => { setSection('main'); setError(''); }} className="font-mono-tech text-xs text-muted-foreground hover:text-neon-cyan mb-4 flex items-center gap-1"><Icon name="ArrowLeft" size={12} />НАЗАД</button>
          <div className="font-orbitron text-xs neon-text-cyan mb-4 flex items-center gap-2"><Icon name="LogOut" size={14} />ВЫХОД ИЗ АККАУНТА</div>
          <div className="font-mono-tech text-xs text-muted-foreground mb-3">Подтвердите выход паролем:</div>
          <input className="cyber-input mb-3" type="password" placeholder="Пароль..." value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setError(''); }} />
          {error && <div className="text-red-500 font-mono-tech text-xs mb-3">{error}</div>}
          <button className="cyber-btn cyber-btn-red w-full text-xs" onClick={() => { if (confirmPwd !== user.password) { setError('Неверный пароль'); return; } onLogout(); }}>ВЫЙТИ</button>
        </div>
      )}
      {section === 'delete' && (
        <div className="cyber-card p-6 animate-scale-in border border-red-900/50">
          <button onClick={() => { setSection('main'); setError(''); }} className="font-mono-tech text-xs text-muted-foreground hover:text-neon-cyan mb-4 flex items-center gap-1"><Icon name="ArrowLeft" size={12} />НАЗАД</button>
          <div className="font-orbitron text-xs text-red-400 mb-2 flex items-center gap-2"><Icon name="AlertTriangle" size={14} />УДАЛЕНИЕ АККАУНТА</div>
          <div className="font-mono-tech text-xs text-red-400/70 mb-4">⚠ Необратимое действие. Все данные будут уничтожены.</div>
          <input className="cyber-input mb-3" type="password" placeholder="Подтвердите паролем..." value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setError(''); }} />
          {error && <div className="text-red-500 font-mono-tech text-xs mb-3">{error}</div>}
          <button className="cyber-btn cyber-btn-red w-full text-xs" onClick={() => { if (confirmPwd !== user.password) { setError('Неверный пароль'); return; } onDeleteAccount(); }}>УДАЛИТЬ НАВСЕГДА</button>
        </div>
      )}
    </div>
  );
}

// ============ PROFILE ============
function ProfileScreen({ user }: { user: User }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="font-orbitron text-sm neon-text-purple mb-4 flex items-center gap-2"><Icon name="User" size={14} />ПРОФИЛЬ</div>
      <div className="cyber-card p-6 mb-3 flex items-center gap-5 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 rounded-sm bg-dark-panel neon-border-purple flex items-center justify-center font-orbitron text-2xl font-black text-neon-purple animate-neon-pulse">
            {user.login[0].toUpperCase()}
          </div>
          <div className="status-online absolute -bottom-1 -right-1" />
        </div>
        <div>
          <div className="font-orbitron text-base neon-text-cyan font-bold">{user.login}</div>
          <div className="font-mono-tech text-xs text-muted-foreground mt-1">ID: {user.id}</div>
          <div className="flex gap-2 mt-2">
            <span className="hex-badge border-neon-purple text-neon-purple">NETRUNNER</span>
            <span className="hex-badge border-neon-green text-neon-green">VERIFIED</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Файлов', value: `${MOCK_FILES.length}` },
          { label: 'Папок', value: `${MOCK_FOLDERS.length}` },
          { label: 'Хранилище', value: '838 GB' },
          { label: 'Регистрация', value: user.joinDate },
        ].map(s => (
          <div key={s.label} className="cyber-card p-3 text-center animate-fade-in">
            <div className="font-orbitron text-lg neon-text-purple font-bold">{s.value}</div>
            <div className="font-mono-tech text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="cyber-card p-4 animate-fade-in">
        <div className="font-orbitron text-xs neon-text-cyan mb-3 flex items-center gap-2"><Icon name="Shield" size={12} />СТАТУС ЗАЩИТЫ</div>
        {[
          'Двухфакторная аутентификация',
          'Шифрование файлов (AES-256)',
          'Скрытие IP-адреса',
          'Анонимность от оператора',
        ].map(item => (
          <div key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="font-rajdhani text-sm text-neon-cyan">{item}</span>
            <span className="font-mono-tech text-xs neon-text-green">АКТИВНО</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ APP ROOT ============
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('storage');
  const [unreadCount, setUnreadCount] = useState(2);

  const handleLogin = (user: User) => { setCurrentUser(user); setAuthed(true); setScreen('storage'); };
  const handleLogout = () => { setCurrentUser(null); setAuthed(false); };
  const handleDeleteAccount = () => { setCurrentUser(null); setAuthed(false); };
  const handleChangePassword = (newPwd: string) => { if (!currentUser) return; setCurrentUser(prev => prev ? { ...prev, password: newPwd } : null); };

  const handleOpenChats = () => {
    setScreen('chats');
    setUnreadCount(0);
  };

  const NAV = [
    { id: 'storage' as Screen, label: 'Хранилище', icon: 'Database' },
    { id: 'chats' as Screen, label: 'Чаты', icon: 'MessageSquare' },
    { id: 'search' as Screen, label: 'Поиск', icon: 'Search' },
    { id: 'settings' as Screen, label: 'Настройки', icon: 'Settings' },
    { id: 'profile' as Screen, label: 'Профиль', icon: 'User' },
  ];

  if (!authed) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col cyber-grid relative" style={{ height: '100dvh' }}>
      <DataStreamBg />
      <div className="scanline" />

      <header className="relative z-10 flex-shrink-0 border-b border-neon-purple/20 bg-dark-card/90 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="font-orbitron text-sm neon-text-purple animate-neon-pulse flex items-center gap-2">
          <Icon name="Database" size={14} />NEXUS VAULT
        </div>
        <div className="flex items-center gap-3">
          <div className="status-online" />
          <span className="font-mono-tech text-xs neon-text-green">SECURE</span>
          <span className="font-mono-tech text-xs text-muted-foreground hidden sm:inline">| {currentUser?.login}</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-hidden p-3 pb-0" style={{ minHeight: 0 }}>
        <div className="h-full">
          {screen === 'storage' && currentUser && <StorageScreen user={currentUser} />}
          {screen === 'chats' && currentUser && <ChatsScreen user={currentUser} onNewMessage={() => { if (screen !== 'chats') setUnreadCount(c => c + 1); }} />}
          {screen === 'search' && <SearchScreen />}
          {screen === 'settings' && currentUser && <SettingsScreen user={currentUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onChangePassword={handleChangePassword} />}
          {screen === 'profile' && currentUser && <ProfileScreen user={currentUser} />}
        </div>
      </main>

      <nav className="relative z-10 flex-shrink-0 border-t border-neon-purple/20 bg-dark-card/95 backdrop-blur flex justify-around px-2 py-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => item.id === 'chats' ? handleOpenChats() : setScreen(item.id)}
            className={`nav-item ${screen === item.id ? 'active' : ''}`}
          >
            <div className="relative">
              <Icon name={item.icon} size={20} />
              {item.id === 'chats' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center font-orbitron text-white leading-none animate-neon-pulse"
                  style={{ fontSize: '9px', boxShadow: '0 0 6px #ff003c' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}