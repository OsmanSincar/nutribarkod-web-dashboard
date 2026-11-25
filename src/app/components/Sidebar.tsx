import React from 'react';
import {
  History,
  Home,
  Leaf,
  Lock,
  LogIn,
  LogOut,
  Menu,
  User,
  UserCircle,
  UserCog,
} from 'lucide-react';

import type { Page } from '../App';

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: Page) => void;
  isLoggedIn: boolean;
  handleLogout: () => void;
}

type NavItem = {
  page: Page;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
};

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  currentPage,
  setCurrentPage,
  isLoggedIn,
  handleLogout,
}: SidebarProps) {
  const navItems: NavItem[] = [
    { page: 'home', label: 'Ana Sayfa', shortLabel: 'Ana Sayfa', icon: Home },
    ...(isLoggedIn
      ? [
          {
            page: 'profile' as Page,
            label: 'Sağlık Profilim',
            shortLabel: 'Sağlık',
            icon: User,
          },
          {
            page: 'personal' as Page,
            label: 'Kişisel Bilgiler',
            shortLabel: 'Bilgiler',
            icon: UserCog,
          },
          {
            page: 'history' as Page,
            label: 'Geçmiş',
            shortLabel: 'Geçmiş',
            icon: History,
          },
          {
            page: 'account' as Page,
            label: 'Hesap Bilgileri',
            shortLabel: 'Hesap',
            icon: UserCircle,
          },
          {
            page: 'password' as Page,
            label: 'Şifre Değiştir',
            shortLabel: 'Şifre',
            icon: Lock,
          },
        ]
      : [
          {
            page: 'auth' as Page,
            label: 'Giriş Yap / Üye Ol',
            shortLabel: 'Giriş',
            icon: LogIn,
          },
        ]),
  ];

  const renderNavButton = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.page;

    return (
      <button
        key={item.page}
        onClick={() => setCurrentPage(item.page)}
        className={
          mobile
            ? `min-w-fit px-3 py-2 rounded-[12px] flex items-center gap-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            : `w-full flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'gap-3'
              } px-4 py-3 rounded-[12px] transition-colors ${
                isActive
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
        }
        title={item.label}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {mobile ? (
          <span className="whitespace-nowrap">{item.shortLabel}</span>
        ) : (
          !sidebarCollapsed && <span>{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Leaf className="w-5 h-5 text-[#10B981] flex-shrink-0" />
            <span className="font-semibold text-gray-800 truncate">NutriBarkod</span>
          </div>

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-[10px] text-red-600 hover:bg-blue-50 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="px-3 pb-3 overflow-x-auto">
          <div className="flex gap-2 w-max min-w-full">
            {navItems.map((item) => renderNavButton(item, true))}
          </div>
        </nav>
      </div>

      <div
        className={`hidden md:flex ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex-col transition-all duration-300 z-10 relative flex-shrink-0`}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-[#10B111]/10 p-2 rounded-lg transition-all hover:text-[#10B781]"
              title={sidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-[#10B981]" />
                <span className="font-semibold text-gray-800">NutriBarkod</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.page}>{renderNavButton(item)}</li>
            ))}
          </ul>
        </nav>

        {isLoggedIn && (
          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'gap-3'
              } px-4 py-3 rounded-[12px] text-red-600 hover:bg-red-50 transition-colors`}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span>Çıkış Yap</span>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
