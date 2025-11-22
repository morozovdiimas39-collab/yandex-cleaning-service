import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://directkit.ru${item.href}` : undefined
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="bg-slate-50 py-3">
        <div className="max-w-7xl mx-auto px-6">
          <ol className="flex items-center gap-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <Icon name="ChevronRight" size={14} className="text-slate-400" />
                )}
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-medium">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
