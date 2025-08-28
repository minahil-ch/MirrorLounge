import AdminInitializer from '@/components/AdminInitializer';

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-2">
            Mirror Beauty Lounge
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Admin Setup
          </h2>
          <p className="text-gray-600">
            Initialize the admin user to get started with the dashboard
          </p>
        </div>
        
        <AdminInitializer />
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            After creating the admin user, you can access the dashboard by signing in
          </p>
        </div>
      </div>
    </div>
  );
}