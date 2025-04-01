"use client"

import { useEffect, useState } from 'react';
import { use } from 'react';
import ModuleTemplate from '../../../components/ModuleTemplate';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Main component for core module page
export default function CoreModulePage({ params }) {
  // Await params before accessing properties - required in Next.js App Router
  const resolvedParams = use(params);
  const moduleId = resolvedParams.moduleId;
  
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!moduleId) return; // Wait until we have the parameters
    
    // Dynamically fetch the core module data based on the moduleId parameter
    fetch(`/api/core/${moduleId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setModuleData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(`Error loading core module data for ${moduleId}:`, error);
        setError(error.message);
        setLoading(false);
      });
  }, [moduleId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !moduleData) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded p-4 my-8 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Core Module</h2>
        <p className="text-gray-300">
          Sorry, we couldn't load the documentation for this core module. 
          {error && <span className="block mt-2 text-sm opacity-80">Error: {error}</span>}
          Please try again later or contact the HyperBEAM team for assistance.
        </p>
      </div>
    );
  }
  
  // Use the same ModuleTemplate component as for subsystems, but pass 'core' as subsystem
  return <ModuleTemplate module={moduleData} subsystem="core" />;
}
