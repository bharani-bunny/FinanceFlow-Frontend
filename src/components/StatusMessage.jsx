import React from 'react';

export default function StatusMessage({ error, notice }) {
  return <>{error && <p className="notice error">{error}</p>}{notice && <p className="notice success">{notice}</p>}</>;
}
