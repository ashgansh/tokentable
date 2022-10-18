export const InsightsCard = ({ children }) => (
  <div className="grid auto-cols-fr grid-flow-col divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow md:flex-row">
    {children}
  </div>
);
export const InsightItem = ({ children }) => (
  <div className="grow p-6">{children}</div>
);
export const InsightTitle = ({ children }) => (
  <div className="text-sm font-normal text-gray-900">{children}</div>
);
export const InsightBody = ({ children }) => (
  <div className="my-1 flex items-baseline gap-1 text-gray-900">{children}</div>
);
export const InsightMainStat = ({ children }) => (
  <div className="text-xl font-semibold text-gray-900">
    {children}
  </div>
);
export const InsightSubStat = ({ children }) => (
  <div className="text-xs font-medium text-gray-500">{children}</div>
);