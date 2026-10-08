import React from 'react';

export default function PageHeader({ eyebrow = 'FINANCEFLOW', title, description, action }) {
  return <header className="topbar"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</header>;
}
