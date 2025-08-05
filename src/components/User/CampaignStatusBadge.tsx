import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Play } from 'lucide-react';

interface CampaignStatusBadgeProps {
  status: 'draft' | 'pending_editor_approval' | 'approved' | 'rejected' | 'completed';
}

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'pending_editor_approval':
        return {
          label: 'En attente de validation éditeur',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="w-4 h-4" />
        };
      case 'approved':
        return {
          label: 'Approuvée',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'rejected':
        return {
          label: 'Rejetée',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'completed':
        return {
          label: 'Terminée',
          color: 'bg-blue-100 text-blue-800',
          icon: <Play className="w-4 h-4" />
        };
      default:
        return {
          label: 'Inconnu',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

export default CampaignStatusBadge; 