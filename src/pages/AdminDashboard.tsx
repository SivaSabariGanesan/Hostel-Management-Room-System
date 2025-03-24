import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, Building2, LogOut, Upload, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  year?: string;
  feesPaid?: number;
}

interface EditingUser extends User {
  password?: string;
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState([]);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    year: '',
    feesPaid: 70000
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRooms();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users', newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      fetchUsers();
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        year: '',
        feesPaid: 70000
      });
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      ...user,
      password: '' // Clear password field for editing
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${editingUser._id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      fetchUsers();
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBulkUserUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const users = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/users/bulk', { users }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Users uploaded successfully');
        fetchUsers();
        setSelectedFile(null);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      toast.error('Failed to upload users. Please check the file format');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`${
                    activeTab === 'rooms'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Rooms
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'users' ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Bulk Upload Users (Excel)</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <button
                    onClick={handleBulkUserUpload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    disabled={!selectedFile}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Users
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Excel Format Example:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Column Headers: name, email, password, role, department, year, feesPaid</li>
                  <li>Role should be either 'student' or 'warden'</li>
                  <li>Department and year are required for students</li>
                  <li>feesPaid should be at least 70000 (base fee)</li>
                </ul>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Create Single User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="student">Student</option>
                  <option value="warden">Warden</option>
                </select>
                {newUser.role === 'student' && (
                  <>
                    <input
                      type="text"
                      placeholder="Department"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Year"
                      value={newUser.year}
                      onChange={(e) => setNewUser({ ...newUser, year: e.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fees Paid (₹)
                      </label>
                      <div className="mt-1">
                        <select
                          value={newUser.feesPaid}
                          onChange={(e) => setNewUser({ ...newUser, feesPaid: parseInt(e.target.value) })}
                          className="rounded-md border border-gray-300 px-3 py-2 w-full"
                          required
                        >
                          <option value="70000">₹70,000 - Basic Room</option>
                          <option value="91000">₹91,000 - Room with Attached Bathroom</option>
                          <option value="110000">₹1,10,000 - Room with AC</option>
                          <option value="131000">₹1,31,000 - Room with Attached Bathroom & AC</option>
                        </select>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Select the total fees paid by the student. This will determine which type of room they can book.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create User
              </button>
            </form>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">User List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fees Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user: User) => (
                      <tr key={user._id}>
                        {editingUser?._id === user._id ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={editingUser.name}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                className="rounded-md border border-gray-300 px-2 py-1 w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                className="rounded-md border border-gray-300 px-2 py-1 w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                className="rounded-md border border-gray-300 px-2 py-1 w-full"
                              >
                                <option value="student">Student</option>
                                <option value="warden">Warden</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUser.role === 'student' ? (
                                <input
                                  type="text"
                                  value={editingUser.department || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                  className="rounded-md border border-gray-300 px-2 py-1 w-full"
                                />
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUser.role === 'student' ? (
                                <input
                                  type="number"
                                  value={editingUser.year || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser, year: e.target.value })}
                                  className="rounded-md border border-gray-300 px-2 py-1 w-full"
                                />
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingUser.role === 'student' ? (
                                <select
                                  value={editingUser.feesPaid}
                                  onChange={(e) => setEditingUser({ ...editingUser, feesPaid: parseInt(e.target.value) })}
                                  className="rounded-md border border-gray-300 px-2 py-1 w-full"
                                >
                                  <option value="70000">₹70,000</option>
                                  <option value="91000">₹91,000</option>
                                  <option value="110000">₹1,10,000</option>
                                  <option value="131000">₹1,31,000</option>
                                </select>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleUpdateUser}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.department || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.year || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.role === 'student' ? `₹${user.feesPaid?.toLocaleString() || '0'}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Room List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Occupancy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amenities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room: any) => (
                    <tr key={room._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{room.roomNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.currentOccupancy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {[
                          room.hasAttachedBathroom && 'Attached Bathroom',
                          room.hasAC && 'AC'
                        ].filter(Boolean).join(', ') || 'Basic'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{room.fees.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            room.isOccupied
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {room.isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;