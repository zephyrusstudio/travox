import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

interface ActionItem {
  id: string;
  label: string;
  to: string;
}

interface QuickActionsProps {
  actions: ActionItem[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = (action: ActionItem) => {
    if (location.pathname === action.to) {
      window.dispatchEvent(
        new CustomEvent("travox:quick-action", {
          detail: { actionId: action.id, path: action.to },
        })
      );
      return;
    }

    navigate(action.to);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => handleAction(action)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
