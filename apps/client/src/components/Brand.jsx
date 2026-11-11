import { useId } from 'react';
import { Link } from 'react-router-dom';

export function Brand({ light = false }) {
  const backgroundFilterId = `logo-background-${useId().replace(/:/g, '')}`;

  return (
    <Link className={`brand${light ? ' brand-light' : ''}`} to="/" aria-label="Crewensia home">
      <svg className="brand-logo" viewBox="280 370 1900 960" role="img" aria-label="Crewensia — People for every event">
        <defs>
          <filter id={backgroundFilterId} colorInterpolationFilters="sRGB">
            {/* Remove the near-white paper while retaining the colored mark and dark text. */}
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.3333 -0.3333 -0.3333 0 1" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="10" intercept="-1" />
            </feComponentTransfer>
          </filter>
          {light && (
            <>
              <clipPath id={`${backgroundFilterId}-text`}>
                <rect x="280" y="850" width="1900" height="480" />
              </clipPath>
              <filter id={`${backgroundFilterId}-white`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.3333 -0.3333 -0.3333 0 1" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="10" intercept="-1" />
                </feComponentTransfer>
                <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
              </filter>
            </>
          )}
        </defs>
        <image href="/crewensia-logo.png" width="2400" height="1792" filter={`url(#${backgroundFilterId})`} />
        {light && (
          <g clipPath={`url(#${backgroundFilterId}-text)`}>
            <image href="/crewensia-logo.png" width="2400" height="1792" filter={`url(#${backgroundFilterId}-white)`} />
          </g>
        )}
      </svg>
    </Link>
  );
}
