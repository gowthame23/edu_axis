import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  ClipboardList, 
  Bell, 
  Upload, 
  MessageSquare, 
  Home,
  CalendarClock
} from 'lucide-react';

export const TEACHER_MODULES = [
  { id: 'home', icon: Home, title: 'Dashboard', description: 'Overview and statistics' },
  { id: 'courses', icon: BookOpen, title: 'My Courses', description: 'Manage your courses' },
  { id: 'attendance', icon: ClipboardList, title: 'Mark Attendance', description: 'Record student attendance' },
  { id: 'grading', icon: BarChart3, title: 'Assignments', description: 'Grade submissions' },
  { id: 'students', icon: Users, title: 'Student Lists', description: 'View students' },
  { id: 'announcements', icon: Bell, title: 'Announcements', description: 'Post announcements' },
  { id: 'leave', icon: CalendarClock, title: 'Apply Leave', description: 'Request time off' },
  { id: 'materials', icon: Upload, title: 'Study Materials', description: 'Upload resources' },
  { id: 'schedule', icon: Calendar, title: 'Schedule', description: 'Plan weekly classes' },
  { id: 'messages', icon: MessageSquare, title: 'Messages', description: 'Communicate with students' },
];
