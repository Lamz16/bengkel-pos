import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Settings, 
  LogOut, 
  LucideIcon 
} from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  showPOSForm: boolean;
  currentUser: User;
  isMobileOpen: boolean;
  lowStockCount?: number;
  onSelectTab: (tabId: string) => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeTab,
  showPOSForm,
  currentUser,
  isMobileOpen,
  lowStockCount = 0,
  onSelectTab,
  onCloseMobile,
  onLogout
}) => {
  return (
    <>
      {/* Sidebar for Desktop (Hidden on Mobile) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden lg:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-600 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">WorkshopPro</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all group",
                  activeTab === item.id && !showPOSForm
                    ? "bg-blue-50 text-blue-700 font-medium" 
                    : "text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5",
                    activeTab === item.id && !showPOSForm ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {item.label}
                </div>
                {item.id === 'inventory' && lowStockCount > 0 && (
                  <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div 
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-3 mb-6 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
            title="Buka Menu Pengaturan"
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm",
              currentUser.role === 'Owner' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            )}>
              {currentUser.role === 'Owner' ? '👑' : '🛠️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-tight font-bold">
                {currentUser.role === 'Owner' ? 'Superadmin / Owner' : 'Admin / PIC'}
              </p>
            </div>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile (Drawer) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl flex flex-col lg:hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 leading-none">WorkshopPro</h2>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Smart System</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all",
                      activeTab === item.id && !showPOSForm ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    {item.id === 'inventory' && lowStockCount > 0 && (
                      <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        {lowStockCount} Menipis
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-bold">Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
