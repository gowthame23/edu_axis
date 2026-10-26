import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-20">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">EduAxis</h3>
            <p className="text-slate-600 text-sm">
              Comprehensive school management system designed to streamline 
              academic operations and enhance learning experiences.
            </p>
          </div>
 
        

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Contact Us</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>EduAxis@eduaxis.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>IIIT, Sri City</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col sm:flex-row justify-evenly items-center">
          <p className="text-sm text-slate-600">
            © {currentYear} EduAxis. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
