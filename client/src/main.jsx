import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { Provider } from "react-redux";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Users from "./pages/Users.jsx";
import Trash from "./pages/Trash.jsx";
import Login from "./pages/Login.jsx";
import TaskDetails from "./pages/TaskDetails.jsx";
import { Toaster } from "sonner";
import store from "./redux/store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // {
      //   index: true,
      //   element: <App />,
      // },
      {
        path: "/",
        element: <Navigate to="/dashboard" />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/tasks",
        element: <Tasks />,
      },
      {
        path: "/completed/:status",
        element: <Tasks />,
      },
      {
        path: "/in-progress/:status",
        element: <Tasks />,
      },
      {
        path: "/todo/:status",
        element: <Tasks />,
      },
      {
        path: "/team",
        element: <Users />,
      },
      {
        path: "/trashed",
        element: <Trash />,
      },
      {
        path: "task/:id",
        element: <TaskDetails />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster richColors />
    </Provider>
  </StrictMode>
);
