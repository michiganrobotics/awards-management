import { Badge } from '@/components/ui/badge';
import { Nomination } from '@/lib/types';

interface StatusBadgeProps {
  status: Nomination['status'] | Nomination['letterStatus'] | Nomination['supportLettersStatus'];
  type: 'nomination' | 'letter' | 'supportLetter';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (type === 'nomination') {
      switch (status) {
        case 'successful':
          return 'bg-green-600 text-white hover:bg-green-700';
        case 'unsuccessful':
          return 'bg-red-600 text-white hover:bg-red-700';
        case 'ineligible':
          return 'bg-purple-600 text-white hover:bg-purple-700';
        case 'submitted':
          return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'pending':
        default:
          return 'bg-yellow-600 text-white hover:bg-yellow-700';
      }
    }

    if (type === 'letter' || type === 'supportLetter') {
      switch (status) {
        case 'completed':
        case 'received':
          return 'bg-green-600 text-white hover:bg-green-700';
        case 'in_progress':
        case 'requested':
          return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'not_started':
        default:
          return 'bg-gray-600 text-white hover:bg-gray-700';
      }
    }

    return 'bg-gray-600 text-white hover:bg-gray-700';
  };

  const getStatusLabel = () => {
    // Replace underscores with spaces and capitalize
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'nomination':
        return 'Nomination status';
      case 'letter':
        return 'Letter status';
      case 'supportLetter':
        return 'Support letter status';
      default:
        return 'Status';
    }
  };

  const getScreenReaderText = () => {
    return `${getTypeLabel()}: ${getStatusLabel()}`;
  };

  return (
    <Badge
      className={getStatusColor()}
      variant="secondary"
      role="status"
      aria-label={getScreenReaderText()}
    >
      <span aria-hidden="true">{getStatusLabel()}</span>
      <span className="sr-only">{getScreenReaderText()}</span>
    </Badge>
  );
}
