'use client';

import { format } from 'date-fns';

interface Coach {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
}

interface ClassInstance {
  id: number;
  classType: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  coach: Coach;
  location: Location;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
  isFull: boolean;
}

interface ClassCardProps {
  classInstance: ClassInstance;
  onBook?: (classId: number) => void;
}

export default function ClassCard({ classInstance, onBook }: ClassCardProps) {
  const startTime = new Date(classInstance.startTime);
  const endTime = new Date(classInstance.endTime);

  const handleBookClick = () => {
    if (onBook && !classInstance.isFull) {
      onBook(classInstance.id);
    }
  };

  // Calculate spot availability percentage for visual indicator
  const availabilityPercentage = (classInstance.availableSpots / classInstance.capacity) * 100;
  
  // Determine color based on availability
  const getAvailabilityColor = () => {
    if (classInstance.isFull) return 'text-red-600 bg-red-50';
    if (availabilityPercentage <= 25) return 'text-orange-600 bg-orange-50';
    if (availabilityPercentage <= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getAvailabilityText = () => {
    if (classInstance.isFull) return 'Full';
    if (classInstance.availableSpots === 1) return '1 spot left';
    return `${classInstance.availableSpots} spots left`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header with class type */}
      <div className="bg-gradient-to-r from-[#FF7A00] to-[#F57A00] px-6 py-4">
        <h3 className="text-xl font-bold text-white">{classInstance.classType}</h3>
        <p className="text-orange-100 text-sm mt-1">{classInstance.duration} minutes</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Date and Time */}
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(startTime, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </p>
          </div>
        </div>

        {/* Coach */}
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div>
            <p className="text-sm text-gray-600">Coach</p>
            <p className="text-sm font-medium text-gray-900">{classInstance.coach.name}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">{classInstance.location.name}</p>
            <p className="text-xs text-gray-500">{classInstance.location.address}</p>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="pt-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor()}`}>
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {getAvailabilityText()}
          </div>
        </div>

        {/* Description (if available) */}
        {classInstance.description && (
          <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
            {classInstance.description}
          </p>
        )}
      </div>

      {/* Footer with Book button */}
      <div className="px-6 pb-6">
        <button
          onClick={handleBookClick}
          disabled={classInstance.isFull}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 touch-target ${
            classInstance.isFull
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF7A00] text-white hover:bg-[#F57A00] active:bg-[#E56A00]'
          }`}
        >
          {classInstance.isFull ? 'Class Full' : 'Book Class'}
        </button>
      </div>
    </div>
  );
}
