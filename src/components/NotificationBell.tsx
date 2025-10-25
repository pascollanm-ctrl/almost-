import React, { useEffect, useMemo, useRef, useState } from 'react';

export type NotificationBellProps = {
  unreadCount: number;
  className?: string;
  ariaLabel?: string;
  showZero?: boolean; // When true, shows a neutral "0" badge instead of hiding
  withDropdown?: boolean; // When true, clicking the bell toggles a simple dropdown
  notifications?: Array<{
    id: string | number;
    title: string;
    time?: string;
  }>;
};

function classNames(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  className,
  ariaLabel = 'Notifications',
  showZero = false,
  withDropdown = true,
  notifications,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Provide simple sample notifications when none are passed
  const items = useMemo(
    () =>
      notifications && notifications.length > 0
        ? notifications
        : [
            { id: 'a', title: 'Welcome to the app!', time: 'Just now' },
            { id: 'b', title: 'Your weekly summary is ready', time: '2h ago' },
            { id: 'c', title: 'Security tip: Enable 2FA', time: '1d ago' },
          ],
    [notifications]
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const hasUnread = unreadCount > 0;
  const showZeroBadge = !hasUnread && showZero;

  return (
    <div ref={containerRef} className={classNames('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup={withDropdown ? 'menu' : undefined}
        aria-expanded={withDropdown ? isOpen : undefined}
        onClick={() => (withDropdown ? setIsOpen((v) => !v) : undefined)}
        className={classNames(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full',
          'text-gray-600 hover:text-gray-800',
          'hover:bg-gray-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300'
        )}
      >
        {/* Bell icon (Heroicons outline bell) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.85 23.85 0 0 0 5.455 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0"
          />
        </svg>

        {(hasUnread || showZeroBadge) && (
          <span
            aria-label={hasUnread ? `${unreadCount} unread notifications` : 'No unread notifications'}
            className={classNames(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-4 px-1',
              'rounded-full text-[10px] leading-4 font-medium flex items-center justify-center',
              'ring-2 ring-white shadow',
              hasUnread ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
            )}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Optional Dropdown */}
      {withDropdown && (
        <div
          role="menu"
          aria-label="Notifications list"
          className={classNames(
            'absolute right-0 z-50 mt-2 w-80 max-w-[90vw]',
            'origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5',
            'transition duration-150 ease-out',
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 visible pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-1 invisible pointer-events-none'
          )}
        >
          <div className="max-h-80 overflow-auto p-2">
            <div className="mb-2 flex items-center justify-between px-2">
              <div className="text-sm font-medium text-gray-900">Notifications</div>
              <span className="text-xs text-gray-500">{hasUnread ? `${unreadCount} unread` : 'All caught up'}</span>
            </div>
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  role="menuitem"
                >
                  <div className="text-sm text-gray-900">{item.title}</div>
                  {item.time && <div className="text-xs text-gray-500">{item.time}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
