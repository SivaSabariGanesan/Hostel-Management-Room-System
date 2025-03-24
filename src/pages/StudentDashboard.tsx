import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Building2, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [myRoom, setMyRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchMyRoom();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms');
      setRooms(response.data.filter((room: any) => 
        !room.isOccupied && (!room.department || room.department === user.department)
      ));
    } catch (error) {
      toast.error('Failed to fetch rooms');
    }
  };

  const fetchMyRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/my-room`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyRoom(response.data);
    } catch (error) {
      // User might not have a room yet
      console.log('No room assigned');
    }
  };

  const bookRoom = async (roomId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/book`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Room booked successfully');
      fetchRooms();
      fetchMyRoom();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <User className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-800">Student Dashboard</h1>
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
        {myRoom ? (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">My Room</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Room Number: <span className="font-semibold">{myRoom.roomNumber}</span></p>
                <p className="text-gray-600">Department: <span className="font-semibold">{myRoom.department}</span></p>
              </div>
              <div>
                <p className="text-gray-600">Capacity: <span className="font-semibold">{myRoom.capacity}</span></p>
                <p className="text-gray-600">Current Occupancy: <span className="font-semibold">{myRoom.currentOccupancy}</span></p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-700">Roommates:</h3>
              <ul className="mt-2 space-y-1">
                {myRoom.occupants.map((occupant: any) => (
                  <li key={occupant._id} className="text-gray-600">{occupant.name}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Rooms</h2>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room: any) => (
                    <tr key={room._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{room.roomNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.currentOccupancy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.department || 'Any'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => bookRoom(room._id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Book Room
                        </button>
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

export default StudentDashboard;