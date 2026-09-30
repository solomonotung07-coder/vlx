import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./utils/Navbar";
import Home from "./pages/Home";
import Footer from "./utils/Footer";

// The CMS is loaded only when someone visits /admin, so it adds nothing
// to the public homepage bundle.
const Admin = lazy(() => import("./pages/admin/Admin"));

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  );
}

export default App;
