// English / Arabic text. The default language is English.
const en = {
  appName: 'Annual Attendance Record',
  tagline: 'Hospital Staff Leave & Duty Management',
  nav_overview: 'Overview', nav_calendar: 'Calendar', nav_leaves: 'Leaves', nav_staff: 'Staff',
  nav_shifts: 'Shifts', nav_sheet: 'Annual Sheet', nav_admins: 'Admins & Settings',
  signOut: 'Sign out', switchLang: 'العربية', role_main: 'Main Admin', role_admin: 'Admin',
  loading: 'Loading…', save: 'Save', cancel: 'Cancel', close: 'Close', edit: 'Edit', remove: 'Remove', delete: 'Delete',
  add: 'Add', search: 'Search…', all: 'All', yes: 'Yes', actions: 'Actions', today: 'Today',
  month: 'Month', year: 'Year', prev: 'Previous', next: 'Next', print: 'Print', exportCsv: 'Export CSV',
  // login / setup
  login: 'Sign in', loginSub: 'Sign in to manage staff, leaves and duty rosters.',
  username: 'Username', password: 'Password', fullName: 'Full name', designation: 'Designation',
  confirmPassword: 'Confirm password',
  setupTitle: 'Create the Main Admin account', setupSub: 'This is the first-time setup. This account will have all privileges and the only right to give final approvals.',
  createAccount: 'Create account', passwordsDiffer: 'Passwords do not match.',
  // overview
  welcome: 'Welcome back, {name}', totalStaff: 'Total staff', onLeaveToday: 'On leave today', onDutyToday: 'On duty today',
  pendingApprovals: 'Waiting for approval', leaveCapacity: 'Leave capacity - next 14 days', capacityHint: 'Maximum {n} staff may be on leave at the same time.',
  noPending: 'Nothing is waiting for approval.', pendingTitle: 'Leave requests waiting for the Main Admin',
  removalRequests: 'Staff removal requests', requestedBy: 'Requested by {name}',
  // calendar
  onLeave: 'On leave', onDuty: 'On duty', full: 'FULL', capacity: 'Leave capacity', assignStaff: 'Assign staff',
  noDuty: 'Nobody is assigned on this day yet.', noLeave: 'Nobody is on leave.', timeline: '24-hour duty timeline',
  continuesFromPrev: 'continues from previous day', substitute: 'Substitute', transfer: 'Transfer',
  pendingTag: 'pending', hours: '24 hours', leaveHeat: 'Staff on leave', clickDay: 'Click a day to see who is on duty.',
  // leaves
  newLeave: 'Assign leave', leaveFrom: 'From date', leaveTo: 'To date', reason: 'Reason (optional)', staffMember: 'Staff member',
  daysCount: '{n} day(s)', leftDays: '{n} of {q} days left in {y}', status: 'Status', requested: 'Requested by',
  approve: 'Approve', reject: 'Reject', approved: 'Approved', pending: 'Pending', rejected: 'Rejected',
  leaveSentForApproval: 'Only the Main Admin can approve. This leave will be sent for final approval.',
  leaveApprovedNow: 'As Main Admin your leave assignment is approved immediately.',
  leaveSaved: 'Leave saved.', leaveRequested: 'Leave sent to the Main Admin for approval.', leaveApprovedMsg: 'Leave approved.', leaveRejectedMsg: 'Leave rejected.',
  confirmDelete: 'Are you sure?', year_: 'Year', dates: 'Dates', days: 'Days', staff: 'Staff', noRecords: 'No records.',
  // staff
  addStaff: 'Add staff', editStaff: 'Edit staff', staffName: 'Staff name', staffRole: 'Role (e.g. Nurse, Doctor)', department: 'Department',
  phone: 'Phone (optional)', leaveBalance: 'Leave balance', used: 'used', pendingDays: 'pending',
  removeStaff: 'Remove staff', requestRemoval: 'Request removal', removalPending: 'Removal requested by {name}',
  approveRemoval: 'Approve removal', declineRemoval: 'Decline', removalSent: 'Removal request sent to the Main Admin.', removedMsg: 'Staff removed.',
  // shifts
  addShift: 'Add shift', editShift: 'Edit shift', shiftName: 'Shift name', startTime: 'Start time', endTime: 'End time', color: 'Colour',
  shiftsHelp: 'Define the duty hours. A shift that ends before it starts (e.g. 22:00 to 06:00) continues into the next day.',
  // assign
  assignTitle: 'Assign staff to a shift', shift: 'Shift', chooseStaff: 'Choose staff', selected: '{n} selected',
  assigned: '{n} duty slot(s) created.', skippedN: '{n} skipped', removeFromShift: 'Remove from shift', substituteTitle: 'Substitute staff',
  replaceWith: 'Replace with', transferTitle: 'Move to another department', newDepartment: 'New department', applyUntil: 'Apply until',
  swapped: 'Updated.', unavailable: 'on leave',
  // sheet
  sheetTitle: 'Annual Attendance Sheet', sheetHelp: 'Approved leave days per month. Pending requests are shown separately.', total: 'Total', remaining: 'Remaining',
  // admins
  admins: 'Administrators', addAdmin: 'Add admin', maxAdmins: 'Maximum 3 admins (1 Main + 2 Admins).', resetPassword: 'Reset password', newPassword: 'New password',
  settings: 'Leave rules & departments', maxConcurrent: 'Max staff on leave at the same time', quota: 'Leave days per staff per year',
  departments: 'Departments (comma separated)', saved: 'Saved.', permissions: 'Who can do what',
  perm_staff: 'Add / edit staff', perm_leave: 'Assign leave (request)', perm_approve: 'Final approval of leave', perm_roster: 'Duty roster: assign, substitute, transfer',
  perm_removeStaff: 'Remove staff (final)', perm_shifts: 'Create / edit shifts', perm_delShift: 'Delete shifts', perm_admins: 'Manage admins & settings',
  with_approval: 'Request → Main Admin approves', onlyMain: 'Main Admin only', allowed: 'Yes',
};

const ar = {
  appName: 'السجل السنوي للحضور',
  tagline: 'إدارة إجازات وجداول مناوبات موظفي المستشفى',
  nav_overview: 'الرئيسية', nav_calendar: 'التقويم', nav_leaves: 'الإجازات', nav_staff: 'الموظفون',
  nav_shifts: 'الورديات', nav_sheet: 'السجل السنوي', nav_admins: 'المشرفون والإعدادات',
  signOut: 'تسجيل الخروج', switchLang: 'English', role_main: 'المشرف الرئيسي', role_admin: 'مشرف',
  loading: 'جارٍ التحميل…', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', edit: 'تعديل', remove: 'إزالة', delete: 'حذف',
  add: 'إضافة', search: 'بحث…', all: 'الكل', yes: 'نعم', actions: 'الإجراءات', today: 'اليوم',
  month: 'شهر', year: 'سنة', prev: 'السابق', next: 'التالي', print: 'طباعة', exportCsv: 'تصدير CSV',
  login: 'تسجيل الدخول', loginSub: 'سجّل الدخول لإدارة الموظفين والإجازات وجداول المناوبات.',
  username: 'اسم المستخدم', password: 'كلمة المرور', fullName: 'الاسم الكامل', designation: 'المسمى الوظيفي',
  confirmPassword: 'تأكيد كلمة المرور',
  setupTitle: 'إنشاء حساب المشرف الرئيسي', setupSub: 'هذا هو الإعداد الأول. سيملك هذا الحساب جميع الصلاحيات والحق الوحيد في الموافقة النهائية.',
  createAccount: 'إنشاء الحساب', passwordsDiffer: 'كلمتا المرور غير متطابقتين.',
  welcome: 'مرحبًا بعودتك، {name}', totalStaff: 'إجمالي الموظفين', onLeaveToday: 'في إجازة اليوم', onDutyToday: 'في الدوام اليوم',
  pendingApprovals: 'بانتظار الموافقة', leaveCapacity: 'سعة الإجازات - الأيام الـ ١٤ القادمة', capacityHint: 'يمكن لـ {n} موظفين كحد أقصى أن يكونوا في إجازة في نفس الوقت.',
  noPending: 'لا شيء بانتظار الموافقة.', pendingTitle: 'طلبات إجازة بانتظار المشرف الرئيسي',
  removalRequests: 'طلبات إزالة موظفين', requestedBy: 'بطلب من {name}',
  onLeave: 'في إجازة', onDuty: 'في الدوام', full: 'مكتمل', capacity: 'سعة الإجازات', assignStaff: 'تعيين موظفين',
  noDuty: 'لم يتم تعيين أحد في هذا اليوم بعد.', noLeave: 'لا أحد في إجازة.', timeline: 'الجدول الزمني للدوام (٢٤ ساعة)',
  continuesFromPrev: 'تمتد من اليوم السابق', substitute: 'استبدال', transfer: 'نقل',
  pendingTag: 'معلّقة', hours: '٢٤ ساعة', leaveHeat: 'الموظفون في إجازة', clickDay: 'اضغط على يوم لمعرفة من هو في الدوام.',
  newLeave: 'تعيين إجازة', leaveFrom: 'من تاريخ', leaveTo: 'إلى تاريخ', reason: 'السبب (اختياري)', staffMember: 'الموظف',
  daysCount: '{n} يوم', leftDays: 'متبقٍ {n} من {q} يومًا في {y}', status: 'الحالة', requested: 'طلب من',
  approve: 'موافقة', reject: 'رفض', approved: 'موافق عليها', pending: 'معلّقة', rejected: 'مرفوضة',
  leaveSentForApproval: 'الموافقة النهائية للمشرف الرئيسي فقط. ستُرسل هذه الإجازة للموافقة النهائية.',
  leaveApprovedNow: 'بصفتك المشرف الرئيسي تتم الموافقة على الإجازة فورًا.',
  leaveSaved: 'تم حفظ الإجازة.', leaveRequested: 'أُرسلت الإجازة إلى المشرف الرئيسي للموافقة.', leaveApprovedMsg: 'تمت الموافقة على الإجازة.', leaveRejectedMsg: 'تم رفض الإجازة.',
  confirmDelete: 'هل أنت متأكد؟', year_: 'السنة', dates: 'التواريخ', days: 'الأيام', staff: 'الموظف', noRecords: 'لا توجد سجلات.',
  addStaff: 'إضافة موظف', editStaff: 'تعديل موظف', staffName: 'اسم الموظف', staffRole: 'الوظيفة (مثل: ممرض، طبيب)', department: 'القسم',
  phone: 'الهاتف (اختياري)', leaveBalance: 'رصيد الإجازات', used: 'مستخدم', pendingDays: 'معلّق',
  removeStaff: 'إزالة موظف', requestRemoval: 'طلب إزالة', removalPending: 'طلب إزالة من {name}',
  approveRemoval: 'الموافقة على الإزالة', declineRemoval: 'رفض', removalSent: 'أُرسل طلب الإزالة إلى المشرف الرئيسي.', removedMsg: 'تمت إزالة الموظف.',
  addShift: 'إضافة وردية', editShift: 'تعديل وردية', shiftName: 'اسم الوردية', startTime: 'وقت البدء', endTime: 'وقت الانتهاء', color: 'اللون',
  shiftsHelp: 'حدّد ساعات الدوام. الوردية التي تنتهي قبل بدايتها (مثل ٢٢:٠٠ إلى ٠٦:٠٠) تمتد إلى اليوم التالي.',
  assignTitle: 'تعيين موظفين على وردية', shift: 'الوردية', chooseStaff: 'اختر الموظفين', selected: 'تم اختيار {n}',
  assigned: 'تم إنشاء {n} مناوبة.', skippedN: 'تم تخطي {n}', removeFromShift: 'إزالة من الوردية', substituteTitle: 'استبدال موظف',
  replaceWith: 'استبدال بـ', transferTitle: 'النقل إلى قسم آخر', newDepartment: 'القسم الجديد', applyUntil: 'تطبيق حتى',
  swapped: 'تم التحديث.', unavailable: 'في إجازة',
  sheetTitle: 'السجل السنوي للحضور', sheetHelp: 'أيام الإجازة المعتمدة في كل شهر. الطلبات المعلّقة تظهر بشكل منفصل.', total: 'المجموع', remaining: 'المتبقي',
  admins: 'المشرفون', addAdmin: 'إضافة مشرف', maxAdmins: 'الحد الأقصى ٣ مشرفين (رئيسي واحد + مشرفان).', resetPassword: 'إعادة تعيين كلمة المرور', newPassword: 'كلمة المرور الجديدة',
  settings: 'قواعد الإجازات والأقسام', maxConcurrent: 'الحد الأقصى للموظفين في إجازة في نفس الوقت', quota: 'أيام الإجازة لكل موظف في السنة',
  departments: 'الأقسام (مفصولة بفاصلة)', saved: 'تم الحفظ.', permissions: 'من يستطيع فعل ماذا',
  perm_staff: 'إضافة / تعديل الموظفين', perm_leave: 'تعيين إجازة (طلب)', perm_approve: 'الموافقة النهائية على الإجازات', perm_roster: 'جدول الدوام: تعيين، استبدال، نقل',
  perm_removeStaff: 'إزالة موظف (نهائيًا)', perm_shifts: 'إنشاء / تعديل الورديات', perm_delShift: 'حذف الورديات', perm_admins: 'إدارة المشرفين والإعدادات',
  with_approval: 'طلب ← يوافق المشرف الرئيسي', onlyMain: 'المشرف الرئيسي فقط', allowed: 'نعم',
};

export const DICT = { en, ar };

export function makeT(lang) {
  const d = DICT[lang] || en;
  return (key, vars) => {
    let s = d[key] ?? en[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, vars[k]);
    return s;
  };
}
