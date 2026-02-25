import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

import Students from './pages/Students';
import StudentForm from './pages/StudentForm';

import Faculty from './pages/Faculty';
import FacultyForm from './pages/FacultyForm';

import Attendance from './pages/Attendance';

// Placeholder components for other modules until implemented
import Fees from './pages/Fees';
import FeeForm from './pages/FeeForm';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Assignments from './pages/Assignments';
import AssignmentForm from './pages/AssignmentForm';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import About from './pages/About';
import Alumni from './pages/Alumni';
import Contact from './pages/Contact';
import Backup from './pages/Backup';
import AttendanceReport from './pages/AttendanceReport';
import OnlineClasses from './pages/OnlineClasses';
import TimeTable from './pages/TimeTable';
import Permissions from './pages/Permissions';
import ChangePassword from './pages/ChangePassword';
import AttendanceAlert from './pages/AttendanceAlert';
import Feedback from './pages/Feedback';
import StudentPermissions from './pages/StudentPermissions';
import SemesterRegistration from './pages/SemesterRegistration';
import AiDoubt from './pages/AiDoubt';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="student-dashboard" element={<StudentDashboard />} />
            <Route path="teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={<StudentForm />} />
            <Route path="students/edit/:id" element={<StudentForm />} />
            <Route path="faculty" element={<Faculty />} />
            <Route path="faculty/add" element={<FacultyForm />} />
            <Route path="faculty/edit/:id" element={<FacultyForm />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="fees/add" element={<FeeForm />} />
            <Route path="fees" element={<Fees />} />
            <Route path="fees/add" element={<FeeForm />} />
            <Route path="fees/edit/:id" element={<FeeForm />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="assignments/add" element={<AssignmentForm />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="about" element={<About />} />
            <Route path="alumni" element={<Alumni />} />
            <Route path="contact" element={<Contact />} />
            <Route path="backup" element={<Backup />} />
            <Route path="attendance-report" element={<AttendanceReport />} />
            <Route path="online-classes" element={<OnlineClasses />} />
            <Route path="timetable" element={<TimeTable />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="attendance-alert" element={<AttendanceAlert />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="student-permissions" element={<StudentPermissions />} />
            <Route path="registration" element={<SemesterRegistration />} />
            <Route path="ai-doubt" element={<AiDoubt />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
