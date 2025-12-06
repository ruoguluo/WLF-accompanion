import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import MentorList from "@/pages/MentorList";
import MentorDetail from "@/pages/MentorDetail";
import EntrepreneurCard from "@/pages/EntrepreneurCard";
import MentorCardList from "@/pages/MentorCardList";
import MentorCardDetails from "@/pages/MentorCardDetails";
import MentorCourses from "@/pages/MentorCourses";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Home />} />
        <Route path="/mentors" element={<MentorList />} />
        <Route path="/mentor-card" element={<MentorCardList />} />
        <Route path="/mentor-card-details/:id" element={<MentorCardDetails />} />
        <Route path="/mentor-courses/:id" element={<MentorCourses />} />
        <Route path="/mentors/:id" element={<MentorDetail />} />
        <Route path="/entrepreneurs" element={<EntrepreneurCard />} />
      </Routes>
    </Router>
  );
}
