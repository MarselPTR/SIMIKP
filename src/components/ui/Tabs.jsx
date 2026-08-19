import Badge from './Badge';

const Tabs = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`border-b border-gray-200 ${className}`}>
    <nav className="-mb-px flex gap-1" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
            activeTab === tab.value
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          {tab.badge && (
            <Badge variant="primary" className="ml-2">
              {tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </nav>
  </div>
);

export default Tabs;
