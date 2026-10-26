import { 
  BookOpen, 
  Calendar, 
  FileText, 
  BarChart3, 
  ClipboardList, 
  Bell, 
  Library, 
  IndianRupee, 
  Home, 
  MessageSquare,
  Download,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

export const STUDENT_MODULES = [
  { id: 'home', icon: Home, title: 'Dashboard', description: 'Overview and statistics' },
  { id: 'courses', icon: BookOpen, title: 'My Courses', description: 'View enrolled courses' },
  { id: 'enrollment', icon: BookOpen, title: 'Course Registration', description: 'Register for new courses' },
  { id: 'grades', icon: BarChart3, title: 'Grades', description: 'Check your performance' },
  { id: 'attendance', icon: ClipboardList, title: 'Attendance', description: 'View attendance records' },
  { id: 'assignments', icon: FileText, title: 'Assignments', description: 'Submit and track assignments' },
  { id: 'materials', icon: Download, title: 'Study Materials', description: 'Download resources' },
  { id: 'schedule', icon: Calendar, title: 'Weekly Schedule', description: 'See weekly classes' },
  { id: 'announcements', icon: Bell, title: 'Announcements', description: 'Stay updated' },
  { id: 'messages', icon: MessageSquare, title: 'Messages', description: 'Chat with teachers' },
  { id: 'library', icon: Library, title: 'Library', description: 'Access resources' },
  { id: 'feedback', icon: MessageCircle, title: 'Feedback', description: 'Share your feedback' },
  { id: 'performance', icon: TrendingUp, title: 'Performance Analytics', description: 'Check your analytics' },
  { id: 'fees', icon: IndianRupee, title: 'Fees', description: 'View and pay fees' },
  { id: 'leave', icon: Calendar, title: 'Leave Requests', description: 'Apply & track leave' },
];
