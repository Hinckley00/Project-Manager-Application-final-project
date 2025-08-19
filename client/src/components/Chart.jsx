import {
  //   Bar,
  //   BarChart,
  //   CartesianGrid,
  //   Legend,
  //   ResponsiveContainer,
  //   Tooltip,
  //   XAxis,
  //   YAxis,

  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// import { chartData } from "../assets/data";
// import { data } from "react-router-dom";

const Chart = ({data}) => {
  return (
    // <ResponsiveContainer width={"100%"} height={300}>
    //   <BarChart width={150} height={40} data={chartData}>
    //     <XAxis dataKey="name" />
    //     <YAxis />
    //     <Tooltip />
    //     <Legend />
    //     <CartesianGrid strokeDasharray="3 3" />
    //     <Bar dataKey="total" fill="#8884d8" />
    //   </BarChart>
    // </ResponsiveContainer>

    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        width={150}
        height={40}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
        <Line type="monotone" dataKey="total" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Chart;
