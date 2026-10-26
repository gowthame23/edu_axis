import { BookOpen, Users, GraduationCap, BarChart3, Calendar, FileText } from 'lucide-react';

export default function LandingPage({ onShowLogin, onShowRegister }) {
  const features = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Efficiently manage students, teachers, and administrative staff in one centralized system.'
    },
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create and organize courses, assign teachers, and track student enrollments effortlessly.'
    },
    {
      icon: GraduationCap,
      title: 'Academic Tracking',
      description: 'Monitor student performance, grades, and attendance with comprehensive reporting tools.'
    },
    {
      icon: Calendar,
      title: 'Schedule Management',
      description: 'Plan and coordinate class schedules, events, and important academic dates seamlessly.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Generate detailed insights and reports to make data-driven decisions for your institution.'
    },
    {
      icon: FileText,
      title: 'Digital Records',
      description: 'Maintain secure digital records of all academic and administrative documents.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">EduAxis</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onShowLogin}
                className="px-6 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={onShowRegister}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-md hover:shadow-lg"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Transform Your School
              <span className="block text-blue-600 mt-2">Management Experience</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              EduAxis is a comprehensive school management system designed to streamline
              administrative tasks, enhance communication, and improve educational outcomes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onShowRegister}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
              Register
              </button>
              <button
                onClick={onShowLogin}
                className="px-8 py-4 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-lg transition-all shadow-md hover:shadow-lg border border-slate-200"
              >
               Login
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

  

      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">EduAxis</span>
          </div>
          <p className="text-slate-400">
            © 2025 EduAxis. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
