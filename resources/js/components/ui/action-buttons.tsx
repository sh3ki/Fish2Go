import React from "react";
import { Edit, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  editIcon?: React.ReactNode;
  deleteIcon?: React.ReactNode;
  editTooltip?: string;
  deleteTooltip?: string;
  className?: string;
  size?: number;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
  editIcon,
  deleteIcon,
  editTooltip = "Edit",
  deleteTooltip = "Delete",
  className = "",
  size = 15,
  editButtonClassName = "inline-flex items-center justify-center p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors",
  deleteButtonClassName = "inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
}) => {
  return (
    <div className={`flex items-center justify-center space-x-3 text-center ${className}`}>
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className={editButtonClassName}
          title={editTooltip}
          type="button"
        >
          {editIcon || <Edit size={size} />}
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className={deleteButtonClassName}
          title={deleteTooltip}
          type="button"
        >
          {deleteIcon || <Trash2 size={size} />}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
