import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, FileText, Edit, ShieldCheck, XCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NotificationType } from '@/integration/directus-types';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'ajout_victime': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'ajout_fragment': return <Info className="h-4 w-4 text-cyan-500" />;
      case 'ajout_parcours': return <Info className="h-4 w-4 text-sky-500" />;
      case 'ajout_recueil': return <Info className="h-4 w-4 text-violet-500" />;
      case 'ajout_relation': return <Info className="h-4 w-4 text-emerald-500" />;
      case 'ajout_sepulture': return <Info className="h-4 w-4 text-rose-500" />;
      case 'modification': return <Edit className="h-4 w-4 text-amber-500" />;
      case 'validation': return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'rejet': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Il y a un instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover border border-border shadow-lg rounded-md z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
                <Check className="h-3 w-3 mr-1" /> Tout marquer comme lu
              </Button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 border-b last:border-0 flex gap-3 transition-colors ${notif.lu ? 'bg-background' : 'bg-primary/5 cursor-pointer hover:bg-primary/10'}`}
                  onClick={() => !notif.lu && markAsRead(notif.id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${notif.lu ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notif.date_creation)}
                    </p>
                  </div>
                  {!notif.lu && (
                    <div className="flex-shrink-0 flex items-center">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
