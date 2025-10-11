import React, { useState } from 'react';
import { Task } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import TaskItem from './TaskItem';

interface TaskPanelProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, newText: string) => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, onEditTask }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        onAddTask(newTaskText);
        setNewTaskText('');
    };

    return (
        <div className="flex-1 flex flex-col p-2">
            <form onSubmit={handleAddTaskSubmit} className="p-2 flex items-center gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-grow px-3 py-2 bg-background border border-muted text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button type="submit" className="p-2 bg-accent-dark rounded-md hover:bg-accent disabled:opacity-50" disabled={!newTaskText.trim()} aria-label="Add task">
                    <PlusIcon className="w-5 h-5 text-background" />
                </button>
            </form>
            <ul className="flex-1 overflow-y-auto custom-scrollbar space-y-1 p-1">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={onToggleTask}
                            onDelete={onDeleteTask}
                            onEdit={onEditTask}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-secondary">
                        <p>No tasks yet. Add one above to get started!</p>
                    </div>
                )}
            </ul>
        </div>
    );
};

export default TaskPanel;
