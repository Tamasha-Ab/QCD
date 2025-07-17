import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AlertProvider } from "./components/AlertSystem";
import HomePage from './pages/home/HomePage.js';
import LoginPage from './pages/auth/login/LoginPage.js';
import SignupPage from './pages/auth/signup/SignupPage.js';
import ForgotPassword from './pages/ForgotPassword.js';
import ResetPassword from './pages/auth/ResetPassword.js';
import Dashboard from './pages/Dashboard.js';
import DefectPage from './pages/DefectPage.js';
import InspectionPage from './pages/InspectionPage.js';
import AddProject from './pages/AddProject.js';
import AIDetection from './pages/AIDetection.js';
import Analytics from './pages/Analytics.js';
import NavBar from './pages/NavBar.js';
import UserProfile from './pages/UserProfile.js';
import AlertNotifications from './pages/AlertNotifications.js';
import UserManagement from './pages/UserManagement.js';
import ScheduleInspection from './pages/ScheduleInspection.js';
import AddProduct from './pages/AddProduct.js';
import LogDefect from './pages/LogDefect.js';
import EditDefect from './pages/EditDefect.js';
import AddUser from './pages/AddUser.js';



function App() {
  return (
    <AlertProvider>
      <Router>
        <Routes>
          {/* Public Routes - No NavBar */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path='user-profile' element={<UserProfile />} />

          {/* Protected Routes - With NavBar */}
          <Route path="/" element={<NavBar />}>

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="defects" element={<DefectPage />} />
            <Route path="defects/log" element={<LogDefect />} />
            <Route path="defects/edit/:id" element={<EditDefect />} />
            <Route path="inspection" element={<InspectionPage />} />
            <Route path="inspection/AddProject" element={<AddProject />} />
            <Route path="ai-detection" element={<AIDetection />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path='alert-notifications' element={<AlertNotifications />} />
            <Route path='user-management' element={<UserManagement />} />
            <Route path='inspection/schedule' element={<ScheduleInspection />} />
            <Route path='products/add' element={<AddProduct />} />
            <Route path='user/add' element={<AddUser />} />


          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </AlertProvider>
  );
}

export default App;