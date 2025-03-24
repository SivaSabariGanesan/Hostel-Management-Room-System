import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Building2, LogOut, Upload, Edit2, X, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

interface Room {
  _id: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
  department?: string;
  hasAttachedBathroom: boolean;
  hasAC: boolean;
  fees: number;
  isOccupied: boolean;
  occupants: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

const WardenDashboard = () => {
  const { logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    capacity: 2,
    hasAttachedBathroom: false,
    hasAC: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    roomNumber: '',
    capacity: 2,
    hasAttachedBathroom: false,
    hasAC: false
  });

  useEffect(() => {
    fetchRooms();
  }, []);

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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/rooms', newRoom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room created successfully');
      fetchRooms();
      setNewRoom({
        roomNumber: '',
        capacity: 2,
        hasAttachedBathroom: false,
        hasAC: false
      });
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const handleRemoveOccupant = async (roomId: string, userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/remove-occupant`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Student removed from room successfully');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to remove student from room');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBulkRoomUpload = async () => {
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
        const rooms = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/rooms/bulk', { rooms }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Rooms uploaded successfully');
        fetchRooms();
        setSelectedFile(null);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      toast.error('Failed to upload rooms. Please check the file format');
    }
  };

  const startEditing = (room: Room) => {
    setEditingRoom(room._id);
    setEditForm({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      hasAttachedBathroom: room.hasAttachedBathroom,
      hasAC: room.hasAC
    });
  };

  const cancelEditing = () => {
    setEditingRoom(null);
    setEditForm({
      roomNumber: '',
      capacity: 2,
      hasAttachedBathroom: false,
      hasAC: false
    });
  };

  const handleUpdateRoom = async (roomId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/rooms/${roomId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room updated successfully');
      fetchRooms();
      cancelEditing();
    } catch (error) {
      toast.error('Failed to update room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-800">Warden Dashboard</h1>
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Bulk Upload Rooms (Excel)</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={handleBulkRoomUpload}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  disabled={!selectedFile}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Rooms
                </button>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Add Single Room</h2>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Room Number"
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                className="rounded-md border border-gray-300 px-3 py-2"
                required
                min="1"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="attachedBathroom"
                  checked={newRoom.hasAttachedBathroom}
                  onChange={(e) => setNewRoom({ ...newRoom, hasAttachedBathroom: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="attachedBathroom">Attached Bathroom (+₹21,000)</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ac"
                  checked={newRoom.hasAC}
                  onChange={(e) => setNewRoom({ ...newRoom, hasAC: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="ac">Air Conditioning (+₹40,000)</label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Room
            </button>
          </form>

          <div className="mt-8">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <React.Fragment key={room._id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRoom === room._id ? (
                            <input
                              type="text"
                              value={editForm.roomNumber}
                              onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            room.roomNumber
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRoom === room._id ? (
                            <input
                              type="number"
                              value={editForm.capacity}
                              onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm w-20"
                              min="1"
                            />
                          ) : (
                            room.capacity
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{room.currentOccupancy}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{room.department || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRoom === room._id ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.hasAttachedBathroom}
                                  onChange={(e) => setEditForm({ ...editForm, hasAttachedBathroom: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">Attached Bathroom</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.hasAC}
                                  onChange={(e) => setEditForm({ ...editForm, hasAC: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">AC</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {[
                                room.hasAttachedBathroom && 'Attached Bathroom',
                                room.hasAC && 'AC'
                              ].filter(Boolean).join(', ') || 'Basic'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₹{room.fees.toLocaleString()}
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRoom === room._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateRoom(room._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(room)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={room.isOccupied}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {room.occupants.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium mb-2">Occupants:</div>
                            <div className="space-y-2">
                              {room.occupants.map((occupant) => (
                                <div key={occupant._id} className="flex items-center justify-between bg-white p-2 rounded-md">
                                  <div>
                                    <span className="font-medium">{occupant.name}</span>
                                    <span className="text-gray-500 ml-2">({occupant.email})</span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveOccupant(room._id, occupant._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Remove student from room"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WardenDashboard;