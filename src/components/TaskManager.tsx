import React, { useState, useEffect, useCallback } from 'react';
import TaskToast, { UploadTask } from './TaskToast';

interface TaskManagerProps {
  children: React.ReactNode;
}

export interface TaskManagerAPI {
  createTask: (filename: string, fileSize: number) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<UploadTask>) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => UploadTask | undefined;
}

// Create a context for the task manager
export const TaskManagerContext = React.createContext<TaskManagerAPI | null>(null);

const TaskManager: React.FC<TaskManagerProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Map<string, UploadTask>>(new Map());

  const createTask = useCallback(async (filename: string, fileSize: number): Promise<string> => {
    // Generate a unique task ID
    const taskId = Math.random().toString(36).substring(2, 15);
    
    const newTask: UploadTask = {
      id: taskId,
      filename,
      fileSize,
      status: 'preparing',
      progress: 0,
      bytesUploaded: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      startTime: Date.now()
    };

    setTasks(prev => new Map(prev).set(taskId, newTask));
    return taskId;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<UploadTask>) => {
    setTasks(prev => {
      const newTasks = new Map(prev);
      const existingTask = newTasks.get(taskId);
      if (existingTask) {
        newTasks.set(taskId, { ...existingTask, ...updates });
      }
      return newTasks;
    });
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const newTasks = new Map(prev);
      newTasks.delete(taskId);
      return newTasks;
    });
  }, []);

  const getTask = useCallback((taskId: string): UploadTask | undefined => {
    return tasks.get(taskId);
  }, [tasks]);

  const retryTask = useCallback((taskId: string) => {
    const task = tasks.get(taskId);
    if (task) {
      updateTask(taskId, {
        status: 'preparing',
        progress: 0,
        bytesUploaded: 0,
        error: undefined,
        startTime: Date.now()
      });
      
      // Trigger retry logic here
      // This would typically involve re-calling the upload function
    }
  }, [tasks, updateTask]);

  const api: TaskManagerAPI = {
    createTask,
    updateTask,
    removeTask,
    getTask
  };

  return (
    <TaskManagerContext.Provider value={api}>
      {children}
      
      {/* Toast Container */}
      <div className="task-toast-container">
        {Array.from(tasks.values())
          .sort((a, b) => b.startTime - a.startTime) // Show newest first
          .map(task => (
            <TaskToast
              key={task.id}
              task={task}
              onRemove={removeTask}
              onRetry={retryTask}
            />
          ))}
      </div>
    </TaskManagerContext.Provider>
  );
};

// Hook to use the task manager
export const useTaskManager = (): TaskManagerAPI => {
  const context = React.useContext(TaskManagerContext);
  if (!context) {
    throw new Error('useTaskManager must be used within a TaskManager');
  }
  return context;
};

export default TaskManager;
