import React, { useState, useEffect, useRef } from 'react';
import { Bell, Info, AlertTriangle, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Notification {
  id: number;
  content: string;
  priority: string;
  created_at: string;
}

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState<Notification | null>(null);
  const lastIdRef = useRef<number>(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      const data = res.data;
      
      if (data.length > 0) {
        if (lastIdRef.current !== 0 && data[0].id > lastIdRef.current) {
          setShowToast(data[0]);
          setTimeout(() => setShowToast(null), 5000);
        }
        lastIdRef.current = data[0].id;
        setNotifications(data);
      }
    } catch (err) {
      console.error('Erreur fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent': return <Zap className="w-4 h-4 text-rose-500" />;
      case 'Warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      {/* La Cloche */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-outline hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Le Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: i18n.dir() === 'rtl' ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: i18n.dir() === 'rtl' ? -100 : 100 }}
            className={`fixed top-4 ${i18n.dir() === 'rtl' ? 'left-4' : 'right-4'} z-[100] bg-white/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl p-4 flex items-start space-x-4 rtl:space-x-reverse max-w-sm`}
          >
            <div className={`p-2.5 rounded-xl ${showToast.priority === 'Urgent' ? 'bg-rose-50' : 'bg-primary/5'}`}>
              {getPriorityIcon(showToast.priority)}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{t('notifications.new')}</p>
              <p className="text-sm text-on-surface-variant mt-1 font-medium leading-relaxed">{showToast.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu déroulant */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute ${i18n.dir() === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-50`}
            >
              <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container/30">
                <h3 className="font-bold text-on-surface">{t('notifications.title')}</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-black uppercase tracking-widest">AI Core</span>
              </div>
              <div className="max-h-[28rem] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-outline/30" />
                    </div>
                    <p className="text-sm text-on-surface-variant/50 font-bold">{t('notifications.empty')}</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors flex items-start space-x-3 rtl:space-x-reverse">
                      <div className="mt-1 shrink-0">{getPriorityIcon(n.priority)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface font-medium leading-relaxed">{n.content}</p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1.5 font-bold uppercase tracking-wider flex items-center">
                          <Clock className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                          {new Date(n.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-surface-container/30 text-center border-t border-outline-variant/10">
                <button className="text-xs font-black text-primary hover:text-primary-container uppercase tracking-widest">
                  {t('notifications.mark_all_read')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
