
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    if (editText.trim() && editText.trim() !== task.text) {
      onEdit(task.id, editText);
    } else {
      setEditText(task.text); // Revert if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  return (
    <li className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 flex-grow min-w-0">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-5 h-5 bg-surface border-muted text-accent rounded focus:ring-accent focus:ring-2 cursor-pointer flex-shrink-0"
          aria-label={`Mark task as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            className="flex-grow px-2 py-1 bg-background border border-accent text-primary rounded-md focus:outline-none"
          />
        ) : (
          <span
            className={`flex-grow truncate cursor-pointer ${task.completed ? 'line-through text-secondary' : 'text-primary'}`}
            onDoubleClick={() => setIsEditing(true)}
            title={task.text}
          >
            {task.text}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-full hover:bg-accent/20 text-accent disabled:opacity-50"
          aria-label="Edit task"
          disabled={isEditing || task.completed}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-full hover:bg-red-600/20 text-red-300"
          aria-label="Delete task"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
};

export default TaskItem;
