import { Navigate, Route, Routes } from "react-router-dom"
import LoginPage from "./pages/auth/login/LoginPage"
import SignupPage from "./pages/auth/signup/SignupPage"
import HomePage from "./pages/home/HomePage"
import NotificationPage from "./pages/notification/NotificationPage"
import Sidebar from "./components/common/Sidebar"
import RightPanel from "./components/common/RightPanel"
import ProfilePage from "./pages/profile/ProfilePage"
import { Toaster } from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import LoadingSpinner from "./components/common/LoadingSpinner"

function App() {

  const {data: authUser, isLoading} = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try{
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if(data.error) return null; // If there's an error, return null to indicate no user is authenticated
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch user data');
        }
        console.log("User data fetched:", data);
        return data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error; // Rethrow the error to be caught by the query's onError handler
      }
    },
    retry: false, // Disable automatic retries
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <LoadingSpinner className="lg" />
    </div>
  }

  return (
    <div className="flex max-w-6xl mx-auto">
      {authUser && <Sidebar />}
      {/* Main content area */}
     <Routes>
      <Route path="/" element={authUser ? <HomePage /> : <Navigate to={'/login'}/>} />
      <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={'/'}/>} />
      <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to={'/'}/>} />
      <Route path="/notifications" element={authUser ? <NotificationPage /> : <Navigate to={'/login'}/>} />
      <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to={'/login'}/>} />
     </Routes>
     {authUser && <RightPanel />}
     <Toaster />
    </div>
  )
}

export default App
