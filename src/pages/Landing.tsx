import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Rocket } from 'lucide-react';
import NavBar from '@/components/NavBar';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <NavBar title="Mentor Portal" />
      <div className="max-w-xl w-full mx-auto px-4 text-center mt-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentor Portal</h1>
        <div className="grid gap-6">
          <button
            onClick={() => navigate('/mentors')}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg text-gray-900 font-semibold py-4 rounded-lg transition-all"
          >
            <Users className="w-6 h-6 text-blue-600" />
            <span>List Mentor</span>
          </button>
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors"
          >
            <UserPlus className="w-6 h-6" />
            <span>Create Mentor</span>
          </button>
          <button
            onClick={() => navigate('/mentor-card')}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg text-gray-900 font-semibold py-4 rounded-lg transition-all"
          >
            <Rocket className="w-6 h-6 text-indigo-600" />
            <span>导师名片</span>
          </button>
        </div>
      </div>
    </div>
  );
}
