import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NavBar from '@/components/NavBar';

interface MentorItem {
  id: string;
  name: string;
  createdAt: string;
  certificates?: string;
}

export default function MentorList() {
  const [mentors, setMentors] = useState<MentorItem[]>([]);

  useEffect(() => {
    axios.get('/api/mentors')
      .then(res => {
        if (res.data?.success) setMentors(res.data.data as MentorItem[]);
      })
      .catch(() => setMentors([]));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/mentors/${id}`)
      setMentors(prev => prev.filter(m => m.id !== id))
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="导师名片列表" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">导师名片列表</h1>
          </div>
          <Link to="/create" className="text-blue-600 hover:text-blue-800 font-medium">创建导师名片</Link>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">暂无导师名片</div>
        ) : (
          <ul className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {mentors.map((m) => (
              <li key={m.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <Link to={`/mentors/${m.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {(m.name || '').trim() || 'Unknown'}
                </Link>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Certificates:</span> {((m.certificates || '').trim()) || 'None'}
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <span className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
