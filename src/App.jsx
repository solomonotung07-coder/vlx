import { Routes, Route } from "react-router-dom";
import Navbar from "./utils/Navbar";
import Home from "./pages/Home";
import Footer from "./utils/Footer";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
