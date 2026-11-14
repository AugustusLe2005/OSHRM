import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useHrmStore } from './store/useHrmStore';
import { LandingPage } from './components/LandingPage';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Modal } from './components/Modal';
import { DashboardView } from './components/views/DashboardView';
import { OrgStructureView } from './components/views/OrgStructureView';
import { EmployeesView } from './components/views/EmployeesView';
import { ContractsView } from './components/views/ContractsView';
import { RecruitmentView } from './components/views/RecruitmentView';
import { AttendanceLeaveView } from './components/views/AttendanceLeaveView';
import { PayrollView } from './components/views/PayrollView';
import { KpiView } from './components/views/KpiView';
import { SystemSettingsView } from './components/views/SystemSettingsView';
import { isNavAllowedForRole } from './utils/hrmLogic';

function getInitialAuthPage(): 'landing' | 'login' {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'login') return 'login';
  }
  return 'landing';
}

export default function App() {
  const store = useHrmStore();
  const [authPage, setAuthPage] = useState<'landing' | 'login'>(getInitialAuthPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const pendingRequestsCount = store.state.requests.filter((r) => r.status === 'Chờ duyệt').length;

  const toastOverlay = store.toasts.length > 0 && (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 no-print"
    >
      {store.toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            t.type === 'success'
              ? 'border-emerald-200 bg-white text-slate-900'
              : t.type === 'error'
                ? 'border-red-200 bg-white text-red-900'
                : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : t.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          )}
          <span className="flex-1 text-xs font-medium leading-relaxed">{t.message}</span>
          <button
            type="button"
            onClick={() => store.dismissToast(t.id)}
            aria-label="Đóng thông báo"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  const handleLogout = () => {
    store.logout();
    setAuthPage('login');
  };

  if (!store.session) {
    return (
      <>
        {authPage === 'landing' ? (
          <LandingPage
            settings={store.state.settings}
            employeeCount={store.state.employees.length}
            departmentCount={store.state.departments.length}
            onGoToLogin={() => setAuthPage('login')}
          />
        ) : (
          <LoginScreen
            employees={store.state.employees}
            settings={store.state.settings}
            savedIdentifier={store.savedIdentifier}
            onBackToLanding={() => setAuthPage('landing')}
            onSubmitLogin={store.submitLogin}
            onResetData={() => setResetConfirmOpen(true)}
          />
        )}
        <Modal
          open={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          title="Khôi phục dữ liệu mẫu"
          maxWidthClass="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Toàn bộ thay đổi hiện tại trong bộ nhớ trình duyệt sẽ được đặt lại về bộ dữ liệu mẫu
              ban đầu (10 nhân viên, 4 phòng ban, dữ liệu chấm công, tuyển dụng và KPI).
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  store.resetToSeedData();
                  setResetConfirmOpen(false);
                }}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </Modal>
        {toastOverlay}
      </>
    );
  }

  const { role } = store.session;
  const effectiveNav = isNavAllowedForRole(store.activeNav, role) ? store.activeNav : 'employees';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        role={role}
        currentUser={store.currentUser}
        settings={store.state.settings}
        activeNav={effectiveNav}
        pendingRequestsCount={pendingRequestsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectNav={store.setActiveNav}
        onLogout={handleLogout}
        onRequestReset={() => setResetConfirmOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          role={role}
          currentUser={store.currentUser}
          settings={store.state.settings}
          activeNav={effectiveNav}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {effectiveNav === 'dashboard' && role === 'admin' && (
            <DashboardView
              state={store.state}
              onNavigate={store.setActiveNav}
              onReviewRequest={store.reviewRequest}
            />
          )}

          {effectiveNav === 'organization' && role === 'admin' && (
            <OrgStructureView
              state={store.state}
              onSaveBranch={store.saveBranch}
              onDeleteBranch={store.deleteBranch}
              onSaveDepartment={store.saveDepartment}
              onDeleteDepartment={store.deleteDepartment}
              onSavePosition={store.savePosition}
              onDeletePosition={store.deletePosition}
            />
          )}

          {effectiveNav === 'employees' && (
            <EmployeesView
              role={role}
              currentUser={store.currentUser}
              state={store.state}
              onSaveEmployee={store.saveEmployee}
              onDeleteEmployee={store.deleteEmployee}
            />
          )}

          {effectiveNav === 'contracts' && (
            <ContractsView
              role={role}
              currentUser={store.currentUser}
              state={store.state}
              settings={store.state.settings}
              onCreateContract={store.createContract}
              onExtendContract={store.extendContract}
              onTerminateContract={store.terminateContract}
            />
          )}

          {effectiveNav === 'recruitment' && role === 'admin' && (
            <RecruitmentView
              state={store.state}
              onAddJobPosting={store.addJobPosting}
              onUpdateJobPostingStatus={store.updateJobPostingStatus}
              onAddCandidate={store.addCandidate}
              onMoveStage={store.moveCandidateStage}
              onConvertCandidate={store.convertCandidate}
            />
          )}

          {effectiveNav === 'attendance' && (
            <AttendanceLeaveView
              role={role}
              currentUser={store.currentUser}
              state={store.state}
              onCheckInOut={store.checkInOut}
              onCreateRequest={store.createRequest}
              onReviewRequest={store.reviewRequest}
            />
          )}

          {effectiveNav === 'payroll' && (
            <PayrollView
              role={role}
              currentUser={store.currentUser}
              state={store.state}
              settings={store.state.settings}
            />
          )}

          {effectiveNav === 'kpi' && (
            <KpiView
              role={role}
              currentUser={store.currentUser}
              state={store.state}
              onAddKpi={store.addKpi}
              onUpdateKpiProgress={store.updateKpiProgress}
              onDeleteKpi={store.deleteKpi}
            />
          )}

          {effectiveNav === 'settings' && role === 'admin' && (
            <SystemSettingsView
              settings={store.state.settings}
              onSaveSettings={store.updateSettings}
              onErrorToast={(message) => store.pushToast('error', message)}
            />
          )}
        </main>
      </div>

      {/* Reset Seed Data Confirmation Modal */}
      <Modal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset dữ liệu mẫu"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn khôi phục lại bộ dữ liệu mẫu ban đầu (10 nhân viên, 4 phòng ban,
            ứng viên ATS, chấm công và bảng lương mặc định)? Các thay đổi hiện tại sẽ bị ghi đè.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
              <button
                type="button"
                onClick={() => {
                  store.resetToSeedData();
                  setResetConfirmOpen(false);
                }}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
              Khôi phục dữ liệu mẫu
            </button>
          </div>
        </div>
      </Modal>

      {toastOverlay}
    </div>
  );
}
