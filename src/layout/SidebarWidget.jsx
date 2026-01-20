import React, { useState } from 'react';
import SupportModal from '../components/support/SupportModal';

export default function SidebarWidget() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        Any Issues ?
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Contact system admin on <br />+91 9746801032 or request a feature here
      </p>
      <button
        onClick={() => setIsSupportOpen(true)}
        className="flex w-full items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600 transition-colors"
      >
        Feature Requests & Support
      </button>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
