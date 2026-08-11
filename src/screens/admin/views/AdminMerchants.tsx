import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../../context/AppContext';
import { 
  Building2, 
  Users, 
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Ban,
  Filter
} from 'lucide-react';

export default function AdminMerchants() {
  const { merchants, users } = useApp();
  const [activeTab, setActiveTab] = useState<'merchants' | 'users'>('merchants');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Merchants & Users</h1>
          <p className="text-zinc-500 mt-1">Manage platform participants, onboarding, and access.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Tabs */}
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'merchants' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Merchants ({merchants.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" />
            End Users ({users.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-medium text-sm"
          />
        </div>
        
        <button className="px-4 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2 font-medium text-sm">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {activeTab === 'merchants' ? (
            <motion.div
              key="merchants"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Merchant ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Company Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Sector</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Orders</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredMerchants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium">No merchants found.</td>
                      </tr>
                    ) : (
                      filteredMerchants.map(merchant => (
                        <tr key={merchant.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">{merchant.id}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-900">{merchant.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{merchant.sector}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              merchant.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 
                              merchant.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {merchant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-zinc-900">{merchant.orders.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">No users found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">{user.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-900">{user.name}</div>
                            <div className="text-xs text-zinc-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              user.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Suspend">
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
