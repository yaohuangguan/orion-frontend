import React, { useEffect } from 'react';

export const LinkedInBadge: React.FC = () => {
  useEffect(() => {
    const scriptId = 'linkedin-profile-badge-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://platform.linkedin.com/badges/js/profile.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (typeof (window as any).LIRenderAll === 'function') {
      (window as any).LIRenderAll();
    }
  }, []);

  return (
    <div className="linkedin-badge-wrapper flex justify-center w-full min-h-[260px] items-center">
      {/* Light Theme Badge */}
      <div className="block dark:hidden w-full flex justify-center">
        <div
          className="badge-base LI-profile-badge"
          data-locale="en_US"
          data-size="large"
          data-theme="light"
          data-type="VERTICAL"
          data-vanity="sam-y-54828a140"
          data-version="v1"
        >
          <a
            className="badge-base__link LI-simple-link text-sm font-semibold text-slate-700 hover:text-primary-600"
            href="https://nz.linkedin.com/in/sam-y-54828a140?trk=profile-badge"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sam Y.
          </a>
        </div>
      </div>

      {/* Dark Theme Badge */}
      <div className="hidden dark:block w-full flex justify-center">
        <div
          className="badge-base LI-profile-badge"
          data-locale="en_US"
          data-size="large"
          data-theme="dark"
          data-type="VERTICAL"
          data-vanity="sam-y-54828a140"
          data-version="v1"
        >
          <a
            className="badge-base__link LI-simple-link text-sm font-semibold text-slate-300 hover:text-primary-400"
            href="https://nz.linkedin.com/in/sam-y-54828a140?trk=profile-badge"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sam Y.
          </a>
        </div>
      </div>
    </div>
  );
};
