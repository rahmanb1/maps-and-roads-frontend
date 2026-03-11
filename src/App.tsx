import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Admin from './pages/Admin';
import EditPost from './pages/EditPost';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import OAuth2Success from './pages/OAuth2Success';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import TravelMap from './pages/TravelMap';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/posts/:id" element={<PostDetail />} />
                            <Route path="/create" element={<CreatePost />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/posts/:id/edit" element={<EditPost />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/oauth2/success" element={<OAuth2Success />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/users/:username" element={<UserProfile />} />
                            <Route path="/messages" element={<Chat />} />
                            <Route path="/messages/:username" element={<Chat />} />
                            <Route path="*" element={<NotFound />} />
                            <Route path="/map" element={<TravelMap />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;