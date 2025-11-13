import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export type LoaderProps = {
  id?: string; // optional section ID
  mode?: 'inline'; // if 'inline', show a small spinner for buttons, etc.
};

export const Loader: React.FC<LoaderProps> = ({ id, mode }) => {
  const { globalCount, sections } = useSelector(
    (state: RootState) => state.loader
  );
  if (mode === 'inline') {
    if (!id || !sections[id]) return null; // only show if that section is active
    return (
      <span
        className="inline-spinner"
        data-test-id={`loader-inline-${id}`}
      >
        <span className="spinner" />
      </span>
    );
  }

  // Section overlay loader
  if (id) {
    if (!sections[id]) return null;
    return (
      <div
        className="section-loader"
        data-test-id={`loader-${id}`}
      >
        <div className="spinner section-spinner" />
      </div>
    );
  }
  const hasAnySectionLoading = Object.values(sections).some(count => count > 0);

  // Global overlay loader
  if (!globalCount || hasAnySectionLoading) return null;
  // if (globalCount === 0) return null;
  return (
    <div className="global-loader">
      <div className="spinner global-spinner" />
    </div>
  );
};

