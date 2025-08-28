'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SimpleDashboard() {
  const [testState] = useState('Simple dashboard loaded');

  const stats = [
    { name: 'Total Services', value: '12', change: '8 active', color: 'pink' },
    { name: 'Categories', value: '5', change: '4 with services', color: 'blue' },
    { name: 'Active Offers', value: '3', change: 'AED 1500 total value', color: 'purple' },
  ];

  const quickActions = [
    { name: 'Add Service', href: '/services', icon: '✂️' },
    { name: 'Add Category', href: '/catagories', icon: '📂' },
    { name: 'Create Offer', href: '/offers', icon: '🏷️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-black dark:to-gray-900 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Simple Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-pink-300">
            Test page without authentication - {testState}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{stat.name}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-pink-400">{stat.change}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500`}
                >
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-lg mr-2">{action.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-pink-300">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Test Info */}
        <div className="mt-6 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-pink-300 mb-1">
            Test Information
          </h3>
          <p className="text-xs text-blue-800 dark:text-gray-300">
            This is a simplified dashboard without authentication or Firebase subscriptions.
            If this loads properly, the issue is with useEffect hooks not executing.
          </p>
        </div>
      </div>
    </div>
  );
}
