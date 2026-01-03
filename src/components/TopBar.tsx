import React from 'react';
import Badge from './Badge';

type Props = {
  pageTitle: string;
};

export default function TopBar({ pageTitle }: Props) {
  return (
    <header className="topbar" aria-label="Top bar">
      <div className="topbarLeft">
        <div className="pageTitle" title={pageTitle}>
          {pageTitle}
        </div>
      </div>

      <div className="topbarCenter" aria-label="Brand">
        <span className="brandTextCenter">I.A.I</span>
      </div>

      <div className="topbarRight" aria-label="Status badges">
        <Badge tone="good" label="Online" />
        <Badge tone="info" label="Authorized" />
      </div>
    </header>
  );
}
