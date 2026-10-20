/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/common/Toast.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { QuickCaptureView } from './components/quick-capture/QuickCaptureView.js';
import { SummarizerView } from './components/summarizer/SummarizerView.js';
import { TaskExtractorView } from './components/tasks/TaskExtractorView.js';
import { DailyPlannerView } from './components/planner/DailyPlannerView.js';
import { FileOrganizerView } from './components/organizer/FileOrganizerView.js';
import { ActivityView } from './components/activity/ActivityView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { storage } from './services/storage.js';
import { api } from './services/api.js';
import {
  Task,
  DailyPlan,
  ActivityItem,
  AppSettings,
  ConnectionStatus
} from './types/index.js';

function MainApp() {
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // App persistent states
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(() => storage.getActivePlan());
  const [activities, setActivities] = useState<ActivityItem[]>(() => storage.getActivity());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [isSampleData, setIsSampleData] = useState<boolean>(() => storage.getIsSampleData());

  // AI Connection Status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);

  // Check AI connection status
  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await api.getAiStatus(
        settings.preferredProvider === 'ollama' ? settings.ollamaBaseUrl : undefined,
        settings.preferredProvider === 'ollama' ? settings.ollamaModel : undefined
      );

      setConnectionStatus({
        connected: res.connected,
        provider: res.provider,
        model: res.model,
        latencyMs: res.latencyMs,
        error: res.error,
        availableModels: res.availableModels,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        provider: settings.preferredProvider,
        model: settings.ollamaModel,
        latencyMs: null,
        error: err.message || 'Failed to ping AI service',
        availableModels: [],
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setStatusLoading(false);
    }
  }, [settings.preferredProvider, settings.ollamaBaseUrl, settings.ollamaModel]);

  // Initial connection check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Save tasks helper
  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    storage.saveTasks(newTasks);
  };

  const handleAddTask = (task: Task) => {
    const updated = [task, ...tasks];
    handleUpdateTasks(updated);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    handleUpdateTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    handleUpdateTasks(updated);
    showToast('Task removed', 'info');
  };

  const handleClearCompleted = () => {
    const updated = tasks.filter((t) => t.status !== 'completed');
    handleUpdateTasks(updated);
    showToast('Cleared completed tasks', 'info');
  };

  const handleSaveBatchTasks = (newTasks: Task[]) => {
    const updated = [...newTasks, ...tasks];
    handleUpdateTasks(updated);
  };

  // Plan helper
  const handleSavePlan = (plan: DailyPlan | null) => {
    setActivePlan(plan);
    storage.saveActivePlan(plan);
  };

  // Activity logger
  const handleLogActivity = (
    action: ActivityItem['action'],
    title: string,
    inputSnippet: string,
    provider: string,
    model: string,
    executionMs: number,
    isSimulated: boolean,
    status: 'success' | 'error',
    errorMessage?: string
  ) => {
    storage.logActivity({
      action,
      title,
      inputSnippet,
      provider,
      model,
      executionMs,
      isSimulated,
      status,
      errorMessage,
    });
    setActivities(storage.getActivity());
  };

  // Settings helper
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
    checkStatus();
  };

  // Clear data
  const handleClearSampleData = () => {
    storage.clearSampleData();
    setTasks([]);
    setActivePlan(null);
    setActivities([]);
    setIsSampleData(false);
    showToast('Sample demo data cleared!', 'info');
  };

  const handleResetSampleData = () => {
    storage.resetToSampleData();
    setTasks(storage.getTasks());
    setActivities(storage.getActivity());
    setIsSampleData(true);
    showToast('Reset to Hacktoberfest sample demo data!', 'success');
  };

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-[#080d0a] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        pendingTasksCount={pendingTasksCount}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          connectionStatus={connectionStatus}
          statusLoading={statusLoading}
          isSampleData={isSampleData}
          onRefreshStatus={checkStatus}
          onNavigate={(tab) => setCurrentTab(tab)}
          onClearSampleData={handleClearSampleData}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* View Routing */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              activePlan={activePlan}
              activities={activities}
              isSampleData={isSampleData}
              onNavigate={(tab) => setCurrentTab(tab)}
              onToggleTask={(id) => {
                const target = tasks.find((t) => t.id === id);
                if (target) {
                  const nextStatus = target.status === 'completed' ? 'todo' : 'completed';
                  handleUpdateTask(id, {
                    status: nextStatus,
                    completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
                  });
                }
              }}
              onClearSampleData={handleClearSampleData}
            />
          )}

          {currentTab === 'quick-capture' && (
            <QuickCaptureView
              settings={settings}
              onSaveTasks={handleSaveBatchTasks}
              onLogActivity={handleLogActivity}
            />
          )}

          {currentTab === 'summarizer' && (
            <SummarizerView
              settings={settings}
              onLogActivity={handleLogActivity}
            />
          )}

          {currentTab === 'tasks' && (
            <TaskExtractorView
              tasks={tasks}
              settings={settings}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onClearCompleted={handleClearCompleted}
              onLogActivity={handleLogActivity}
            />
          )}

          {currentTab === 'planner' && (
            <DailyPlannerView
              tasks={tasks}
              activePlan={activePlan}
              settings={settings}
              onSavePlan={handleSavePlan}
              onLogActivity={handleLogActivity}
            />
          )}

          {currentTab === 'organizer' && (
            <FileOrganizerView
              settings={settings}
              onLogActivity={handleLogActivity}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView
              activities={activities}
              isSampleData={isSampleData}
              onClearActivity={() => {
                storage.saveActivity([]);
                setActivities([]);
                showToast('Cleared activity history', 'info');
              }}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              connectionStatus={connectionStatus}
              statusLoading={statusLoading}
              onUpdateSettings={handleUpdateSettings}
              onRefreshStatus={checkStatus}
              onClearAllData={handleClearSampleData}
              onResetSampleData={handleResetSampleData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
