import clsx from "clsx";
import moment from "moment";
import { FaNewspaper } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import { LuClipboardList } from "react-icons/lu";
import {
  MdAdminPanelSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "../components/Chart";
import Loading from "../components/Loader";
import UserInfo from "../components/UserInfo";
import { useGetDashboardStatsQuery } from "../redux/slices/api/taskApiSlice";
import { BGS, PRIORITYSTYLES, TASK_TYPE, getInitials } from "../utils";

const TaskTable = ({ tasks }) => {
  // Safety check for tasks
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="w-full bg-white px-4 md:px-6 pt-4 pb-6 shadow-lg rounded">
        <div className="text-center py-8 text-gray-500">
          No recent tasks available
        </div>
      </div>
    );
  }

  const ICONS = {
    high: <MdKeyboardDoubleArrowUp />,
    medium: <MdKeyboardArrowUp />,
    low: <MdKeyboardArrowDown />,
  };

  const TableHeader = () => (
    <thead className="border-b border-gray-300">
      <tr className="text-black text-left">
        <th className="py-2 px-4">Task Title</th>
        <th className="py-2 px-4">Priority</th>
        <th className="py-2 px-4">Team</th>
        <th className="py-2 px-4 hidden md:block whitespace-nowrap">
          Created At
        </th>
      </tr>
    </thead>
  );

  const TableRow = ({ task }) => (
    <tr className="border-b border-gray-300 text-gray-600 hover:bg-gray-300/10">
      <td className="py-2 px-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task.stage])}
          />

          <p className="text-base text-black">{task.title}</p>
        </div>
      </td>

      <td className="py-2 px-4">
        <div className="flex gap-1 items-center">
          <span className={clsx("text-lg", PRIORITYSTYLES[task.priority])}>
            {ICONS[task.priority]}
          </span>
          <span className="capitalize">{task.priority}</span>
        </div>
      </td>

      <td className="py-2 px-4">
        <div className="flex">
          {Array.isArray(task.team) && task.team.length > 0
            ? task.team.map((m, index) => (
                <div
                  key={index}
                  className={clsx(
                    "w-8 h-8 rounded-full text-white flex items-center justify-center text-sm -mr-1 font-semibold",
                    BGS[index % BGS.length]
                  )}
                >
                  {getInitials(m?.name)}
                </div>
              ))
            : null}
        </div>
      </td>
      <td className="py-2 px-4 hidden md:block whitespace-nowrap">
        <span className="text-base text-gray-600">
          {moment(task?.date).fromNow()}
        </span>
      </td>
    </tr>
  );
  return (
    <>
      <div className="w-full bg-white px-4 md:px-6 pt-4 pb-6 shadow-lg rounded">
        <table className="w-full">
          <TableHeader />
          <tbody>
            {tasks?.map((task, id) => (
              <TableRow key={id} task={task} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const UserTable = ({ users }) => {
  // Safety check for users
  if (!users || !Array.isArray(users) || users.length === 0) {
    return (
      <div className="w-full overflow-x-auto bg-white px-4 py-4 shadow-lg rounded-lg">
        <div className="text-center py-8 text-gray-500">
          No users available
        </div>
      </div>
    );
  }

  const TableHeader = () => (
    <thead className="border-b border-gray-200">
      <tr className="text-gray-700 text-left text-sm">
        <th className="py-2 px-3 whitespace-nowrap">Full Name</th>
        <th className="py-2 px-3">Status</th>
        <th className="py-2 px-3 whitespace-nowrap">Created At</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-all text-sm">
      <td className="py-5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-violet-700 text-white flex items-center justify-center text-xs font-semibold">
            {getInitials(user?.name)}
          </div>
          <div className="leading-tight">
            <p className="font-medium text-gray-900 text-sm whitespace-nowrap">
              {user.name}
            </p>
            <p className="text-[11px] text-gray-500">{user?.role}</p>
          </div>
        </div>
      </td>

      <td className="py-5 px-3 whitespace-nowrap">
        <span
          className={clsx(
            "inline-block px-2 py-[2px] rounded-full text-xs font-medium",
            user?.isActive
              ? "bg-green-200 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          )}
        >
          {user?.isActive ? "Active" : "Disabled"}
        </span>
      </td>

      <td className="py-5 px-3 text-xs text-gray-500 whitespace-nowrap">
        {moment(user?.createdAt).fromNow()}
      </td>
    </tr>
  );

  return (
    <div className="w-full overflow-x-auto bg-white px-4 py-4 shadow-lg rounded-lg">
      <table className="min-w-full text-left">
        <TableHeader />
        <tbody>
          {users?.map((user, index) => (
            <TableRow key={index + user?._id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetDashboardStatsQuery();

  // Check authentication on component mount
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    console.log("Dashboard: Checking authentication, userInfo:", userInfo);
    
    if (!userInfo) {
      console.log("Dashboard: No userInfo found, redirecting to login");
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userInfo);
      console.log("Dashboard: Parsed user:", user);
      if (!user) {
        console.log("Dashboard: Invalid user data, redirecting to login");
        navigate("/login");
        return;
      }
    } catch (error) {
      console.error("Dashboard: Failed to parse user info:", error);
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Debug logging
  console.log('Dashboard API Response:', { data, isLoading, error });
  console.log('Dashboard: Available cookies:', document.cookie);
  console.log('Dashboard: localStorage userInfo:', localStorage.getItem("userInfo"));

  if (isLoading) {
    return(
      <div className="py-10">
        <Loading />
      </div>
    )
  }

  if (error) {
    console.error('Dashboard API Error:', error);
    
    // If it's an authentication error, redirect to login
    if (error.status === 401) {
      localStorage.removeItem("userInfo");
      navigate("/login");
      return null;
    }
    
    return (
      <div className="py-10 text-center">
        <div className="text-red-600 text-xl font-semibold mb-2">Error Loading Dashboard</div>
        <div className="text-gray-600">Failed to load dashboard statistics. Please try again later.</div>
        <div className="text-sm text-gray-500 mt-2">
          {error?.data?.message || error?.message || 'Unknown error occurred'}
        </div>
      </div>
    );
  }

  // Ensure data exists and has the expected structure
  if (!data || !data.status) {
    console.warn('Dashboard data is missing or invalid:', data);
    return (
      <div className="py-10 text-center">
        <div className="text-gray-600">No dashboard data available.</div>
        <div className="text-sm text-gray-500 mt-2">
          Data structure: {JSON.stringify(data, null, 2)}
        </div>
      </div>
    );
  }

  const totals = data?.tasks || {};
  const last10Task = data?.last10Task || [];
  const users = data?.users || [];
  const graphData = data?.graphData || [];

  console.log('Dashboard processed data:', { totals, last10Task, users, graphData });

  const stats = [
    {
      _id: "1",
      label: "TOTAL TASK",
      total: data?.totalTasks || 0,
      icon: <FaNewspaper />,
      bg: "bg-[#1d4ed8]",
    },
    {
      _id: "2",
      label: "COMPLTED TASK",
      total: totals["completed"] || 0,
      icon: <MdAdminPanelSettings />,
      bg: "bg-[#0f766e]",
    },
    {
      _id: "3",
      label: "TASK IN PROGRESS ",
      total: totals["in progress"] || 0,
      icon: <LuClipboardList />,
      bg: "bg-[#f59e0b]",
    },
    {
      _id: "4",
      label: "TODOS",
      total: totals["todo"] || 0,
      icon: <FaArrowsToDot />,
      bg: "bg-[#be185d]",
    },
  ];

  const Card = ({ label, count, bg, icon }) => {
    return (
      <div className="w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between">
        <div className="h-full flex flex-1 flex-col justify-between">
          <p className="text-base text-gray-600">{label}</p>
          <span className="text-2xl font-semibold">{count}</span>
          <span className="text-sm text-gray-400">{"11% last month"}</span>
        </div>

        <div
          className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center text-white ",
            bg
          )}
        >
          {icon}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full py-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map(({ icon, bg, label, total }, index) => (
          <Card key={index} icon={icon} bg={bg} label={label} count={total} />
        ))}
      </div>
      <br />
      <br />
      <div className="w-full bg-white my-16 p-4 rounded shadow-lg">
        <h4 className="text-xl text-gray-600 font-semibold">
          Chart by Priority
        </h4>
        <br />
        {graphData && graphData.length > 0 ? (
          <Chart data={graphData} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No chart data available
          </div>
        )}
      </div>
      <div className="w-full flex flex-col lg:flex-row gap-4 2xl:gap-10 py-8">
        {/* {Left} */}
        <div className="flex-1">
          <TaskTable tasks={last10Task} />
        </div>

        {/* {Right} */}
        <div className="w-full lg:w-1/3 font-semibold">
          <UserTable users={users} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
