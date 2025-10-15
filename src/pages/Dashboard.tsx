import { useMemo, useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
// import type { ApexOptions } from "apexcharts";
import axios from "axios";
// import useSWR from "swr";

const HTTP_API = "http://localhost:3011";

// interface typeNewestIAQ {
//   id: number;
//   sensor_id: string;
//   dateTime: number;
//   co2: number;
//   humidity: number;
//   temperature: number;
//   mode: string;
// }

const Dashboard = () => {
  // ── Mock data
  // const [isNewestIAQ, setNewestIAQ] = useState<any[]>();
  const [isMode, setIsMode] = useState("idle");
  const [iaq, setIaq] = useState<any[]>([]);
  const [isSystemRunning, setIsSystemRunning] = useState(false);

  // const getLastestIAQData = async (data) => {};

  const fetchFristTime = async () => {
    const ms = Date.now();
    const start_ms = ms - 21600000;
    const payload = {
      start: start_ms,
      lastTimestamp: 0, // 1760416776735 debug
      firstTime: true,
    };
    const hlrData = await axios.post(`${HTTP_API}/loop/data/iaq`, payload);
    setIaq(hlrData.data);
    console.log(hlrData.data);
    setIsMode("idle");
    setIsSystemRunning(false);
  };

  useEffect(() => {
    fetchFristTime();
  }, []);

  const co2Series = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.co2 });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `CO₂ Sensor ${sid}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  const TempSeries = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.temperature });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `Temperature Sensor ${sid}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  const HumidSeries = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.humidity });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `Humidity Sensor ${sid}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  // ── Chart options (Dark Mode)
  const optionsCo2: any = {
    theme: { mode: "dark" },
    chart: {
      id: "co2-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "CO₂ (ppm)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} ppm` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  const optionsTemp: any = {
    theme: { mode: "dark" },
    chart: {
      id: "temp-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "Temp (C)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} C` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  const optionsHumid: any = {
    theme: { mode: "dark" },
    chart: {
      id: "humid-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "Humid (%RH)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} %RH` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  return (
    <div className="ml-[4%] min-h-screen  flex justify-center  bg-gray-950 text-gray-100">
      <div className="w-[85%] mt-10 border-[1px] border-gray-500 p-3 mb-10 rounded-lg">
        <div className="p-4">
          <div>
            System:
            <span
              className={`ml-2 ${
                isSystemRunning === false ? "text-red-500" : "text-green-500"
              }`}
            >
              {isSystemRunning ? "Running" : "Offline"}
            </span>
          </div>
          <div className={`${isMode === ""}`}>Mode: {isMode}</div>
        </div>
        <div>
          <div className="ml-5 mr-5 border-[1px] border-gray-500 rounded-md h-[200px] flex justify-around p-3">
            <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center">
              <div>CO2 (ppm)</div>
              <div className="mt-10 text-[23px]">300</div>
            </div>
            <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center">
              <div>Temperature (C)</div>
              <div className="mt-10 text-[23px]">23.4</div>
            </div>
            <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center">
              <div>Humidity (%RH)</div>
              <div className="mt-10 text-[23px]">45 %</div>
            </div>
          </div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            CO2 (ppm)
          </div>
          {/* Chart Card */}
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <ReactApexChart
                options={optionsCo2}
                series={co2Series}
                type="line"
                height={360}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Humidity (%RH)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsTemp}
              series={TempSeries}
              type="line"
              height={360}
            />
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Temperature (Celsius)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsHumid}
              series={HumidSeries}
              type="line"
              height={360}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
