"use client";
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCaaAS0ahFBaAhHFDKyn3AMyWOBm94Dlns",
  authDomain: "student-app-2768d.firebaseapp.com",
  projectId: "student-app-2768d",
  storageBucket: "student-app-2768d.appspot.com",
  messagingSenderId: "393704195505",
  appId: "1:393704195505:web:7f14f9508e68eec0602990",
  measurementId: "G-3EMV8Y3PK3",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    course: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, "students"));
      const studentList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentList);
      setLoading(false);
    };

    fetchStudents();
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  const filteredStudents = search
    ? students.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
          (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
          (s.course && s.course.toLowerCase().includes(search.toLowerCase())) ||
          (s.addedBy && s.addedBy.toLowerCase().includes(search.toLowerCase()))
      )
    : students;

  // Table data for rendering
  const tableData = filteredStudents.map((s, i) => ({
    course: s.course,
    student: s.name,
    email: s.email,
    addedBy: s.addedBy,
    id: s.id,
  }));

  // Modal form handlers
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.course) {
      alert("All fields are required!");
      return;
    }
    setFormLoading(true);
    try {
      // Set addedBy at submit time
      const newStudent = {
        ...form,
        addedBy: user?.displayName || "Unknown User",
      };
      const docRef = await addDoc(collection(db, "students"), newStudent);
      setStudents((prev) => [...prev, { id: docRef.id, ...newStudent }]);
      setForm({ name: "", email: "", course: "" });
      setShowModal(false);
    } catch (err) {
      alert("Failed to add student: " + err.message);
    }
    setFormLoading(false);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#22304e] text-white px-4 py-3">
        <button
          className="text-2xl"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <span className="text-lg font-bold">ADMIN</span>
        <div />
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed z-40 md:static top-0 left-0 h-full w-64 bg-[#22304e] text-white flex flex-col min-h-screen transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-200 ease-in-out`}
        >
          <div className="text-2xl font-bold px-6 py-5 border-b border-[#26385c] md:block hidden">
            ADMIN
          </div>
          <nav className="flex-1 py-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="flex items-center px-6 py-2 hover:bg-[#1e2a45] rounded transition"
                >
                  <span className="mr-3">👨‍🎓</span> Students
                </a>
              </li>
            </ul>
          </nav>
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-3 right-3 text-2xl"
            onClick={() => setSidebarOpen(false)}
          >
            &times;
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Login/Logout button */}
          <div className="absolute top-4 right-4 z-50">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-[#22304e] bg-[#22304e] text-white rounded-[15px] text-sm md:text-base"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 border border-[#22304e] bg-[#22304e] text-white rounded-[15px] text-sm md:text-base"
              >
                Login with Google
              </button>
            )}
          </div>

          {/* Header */}
          <header className="bg-white shadow px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-gray-800">
              Student Management
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {user?.displayName || "Lucy Sanders"}
              </span>
              <img
                src={
                  user?.photoURL ||
                  "https://randomuser.me/api/portraits/women/44.jpg"
                }
                alt="Profile"
                className="w-8 h-8 rounded-full border"
              />
            </div>
          </header>

          {/* Table Card */}
          <main className="flex-1 p-2 md:p-6">
            <div className="bg-white rounded-lg shadow p-3 md:p-6">
              {/* Create Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-gray-700">
                  Result List
                </h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium shadow"
                  onClick={() => setShowModal(true)}
                >
                  + Create
                </button>
              </div>

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2">
                  <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 md:p-6 relative">
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                      onClick={() => setShowModal(false)}
                    >
                      &times;
                    </button>
                    <h3 className="text-lg font-semibold mb-4">Add Student</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border rounded px-3 py-2 focus:outline-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border rounded px-3 py-2 focus:outline-blue-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Course
                        </label>
                        <input
                          type="text"
                          name="course"
                          value={form.course}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border rounded px-3 py-2 focus:outline-blue-600"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                          onClick={() => setShowModal(false)}
                          disabled={formLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                          disabled={formLoading}
                        >
                          {formLoading ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Show</label>
                  <select className="border rounded px-2 py-1 text-sm">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span className="text-sm text-gray-600">entries</span>
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <input
                    type="text"
                    placeholder="Search"
                    className="border rounded px-3 py-1 text-sm focus:outline-blue-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="bg-green-500 hover:bg-green-600 text-white rounded p-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Responsive Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        User ID
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Course
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Student
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Added By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-8 text-gray-400"
                        >
                          Loading students...
                        </td>
                      </tr>
                    ) : tableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-8 text-gray-400"
                        >
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      tableData.map((s, idx) => (
                        <tr
                          key={s.id || idx}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-2">{s.id}</td>
                          <td className="px-4 py-2">{s.course}</td>
                          <td className="px-4 py-2">{s.student}</td>
                          <td className="px-4 py-2 text-right">{s.email}</td>
                          <td className="px-4 py-2">{s.addedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading students...
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No students found.
                  </div>
                ) : (
                  tableData.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="border rounded-lg p-3 shadow-sm bg-gray-50"
                    >
                      <div className="font-semibold text-gray-700">
                        {s.student}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {s.course}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">Email:</span> {s.email}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">User ID:</span> {s.id}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">Added By:</span>{" "}
                        {s.addedBy}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row md:justify-between items-center mt-4 gap-2">
                <div className="text-xs text-gray-500">
                  Showing 1 to {tableData.length} of {tableData.length} entries
                </div>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 rounded border text-gray-600 bg-white hover:bg-gray-100 text-xs">
                    Previous
                  </button>
                  <button className="px-3 py-1 rounded border text-white bg-blue-600 hover:bg-blue-700 text-xs">
                    1
                  </button>
                  <button className="px-3 py-1 rounded border text-gray-600 bg-white hover:bg-gray-100 text-xs">
                    2
                  </button>
                  <button className="px-3 py-1 rounded border text-gray-600 bg-white hover:bg-gray-100 text-xs">
                    Next
                  </button>
                </div>
              </div>
            </div>
            {/* Footer */}
            <footer className="mt-6 text-center text-xs text-gray-400">
              Copyright © Webixzone 2023.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
